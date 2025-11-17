import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        // Check if user is emergency admin (superadmin) or has permission
        const isEmergencyAdmin = user.email === process.env.EMERGENCY_ADMIN_USERNAME ||
            user.name === "Emergency Admin"

        if (!isEmergencyAdmin && !hasPermission(user.role, "canViewAuditLogs")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const {searchParams} = new URL(request.url)
        const limit = Number.parseInt(searchParams.get("limit") || "100")
        const offset = Number.parseInt(searchParams.get("offset") || "0")
        const actionFilter = searchParams.get("action") || null
        const searchQuery = searchParams.get("search") || null

        if (limit > 500 || limit < 1) {
            return NextResponse.json({error: "Invalid limit parameter"}, {status: 400})
        }

        if (offset < 0) {
            return NextResponse.json({error: "Invalid offset parameter"}, {status: 400})
        }

        // Build query with optional action filter
        let queryStr = `SELECT al.id,
                    al.action,
                    al.details,
                    al.ip_address,
                    al.user_agent,
                    al.created_at,
                    json_build_object(
                            'id', al.actor_id,
                            'name', COALESCE(al.actor_name, actor.name),
                            'email', COALESCE(al.actor_email, actor.email)
                    ) as actor,
                    json_build_object(
                            'id', al.target_user_id,
                            'name', COALESCE(al.target_user_name, target.name),
                            'email', COALESCE(al.target_user_email, target.email)
                    ) as target_user
             FROM audit_logs al
                      LEFT JOIN users actor ON al.actor_id = actor.id
                      LEFT JOIN users target ON al.target_user_id = target.id`

        const queryParams: any[] = []
        const whereClauses: string[] = []

        if (actionFilter) {
            whereClauses.push(`al.action = $${queryParams.length + 1}`)
            queryParams.push(actionFilter)
        }

        if (searchQuery) {
            whereClauses.push(`(
                COALESCE(al.actor_name, actor.name) ILIKE $${queryParams.length + 1} OR
                COALESCE(al.actor_email, actor.email) ILIKE $${queryParams.length + 1} OR
                COALESCE(al.target_user_name, target.name) ILIKE $${queryParams.length + 1} OR
                COALESCE(al.target_user_email, target.email) ILIKE $${queryParams.length + 1} OR
                al.action ILIKE $${queryParams.length + 1} OR
                al.ip_address::text ILIKE $${queryParams.length + 1}
            )`)
            queryParams.push(`%${searchQuery}%`)
        }

        if (whereClauses.length > 0) {
            queryStr += ` WHERE ${whereClauses.join(' AND ')}`
        }

        queryStr += ` ORDER BY al.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
        queryParams.push(limit, offset)

        const logs = await query<any>(queryStr, queryParams)

        // Count with filter
        let countQuery = `SELECT COUNT(*) as count FROM audit_logs al
                          LEFT JOIN users actor ON al.actor_id = actor.id
                          LEFT JOIN users target ON al.target_user_id = target.id`
        const countParams: any[] = []
        const countWhereClauses: string[] = []

        if (actionFilter) {
            countWhereClauses.push(`al.action = $${countParams.length + 1}`)
            countParams.push(actionFilter)
        }

        if (searchQuery) {
            countWhereClauses.push(`(
                COALESCE(al.actor_name, actor.name) ILIKE $${countParams.length + 1} OR
                COALESCE(al.actor_email, actor.email) ILIKE $${countParams.length + 1} OR
                COALESCE(al.target_user_name, target.name) ILIKE $${countParams.length + 1} OR
                COALESCE(al.target_user_email, target.email) ILIKE $${countParams.length + 1} OR
                al.action ILIKE $${countParams.length + 1} OR
                al.ip_address::text ILIKE $${countParams.length + 1}
            )`)
            countParams.push(`%${searchQuery}%`)
        }

        if (countWhereClauses.length > 0) {
            countQuery += ` WHERE ${countWhereClauses.join(' AND ')}`
        }

        const countResult = await query<{ count: number }>(countQuery, countParams)
        const total = countResult[0]?.count || 0

        return NextResponse.json({logs, total})
    } catch (error) {
        console.error("[WESMUN] Get audit logs error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
