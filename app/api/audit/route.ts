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

        if (!hasPermission(user.role, "canViewAuditLogs")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const {searchParams} = new URL(request.url)
        const limit = Number.parseInt(searchParams.get("limit") || "100")
        const offset = Number.parseInt(searchParams.get("offset") || "0")

        if (limit > 500 || limit < 1) {
            return NextResponse.json({error: "Invalid limit parameter"}, {status: 400})
        }

        if (offset < 0) {
            return NextResponse.json({error: "Invalid offset parameter"}, {status: 400})
        }

        const logs = await query<any>(
            `SELECT al.id,
                    al.action,
                    al.details,
                    al.ip_address,
                    al.user_agent,
                    al.created_at,
                    json_build_object(
                            'id', actor.id,
                            'name', actor.name,
                            'email', actor.email
                    ) as actor,
                    json_build_object(
                            'id', target.id,
                            'name', target.name,
                            'email', target.email
                    ) as target_user
             FROM audit_logs al
                      LEFT JOIN users actor ON al.actor_id = actor.id
                      LEFT JOIN users target ON al.target_user_id = target.id
             ORDER BY al.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset],
        )

        const countResult = await query<{ count: number }>("SELECT COUNT(*) as count FROM audit_logs")
        const total = countResult[0]?.count || 0

        return NextResponse.json({logs, total})
    } catch (error) {
        console.error("[v0] Get audit logs error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
