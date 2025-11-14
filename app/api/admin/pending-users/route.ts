import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        // Get pending users
        const pendingUsers = await query<any>(
            `SELECT u.id,
                    u.email,
                    u.name,
                    u.created_at,
                    u.approval_status
             FROM users u
             WHERE u.approval_status = 'pending'
             ORDER BY u.created_at DESC`,
        )

        return NextResponse.json({users: pendingUsers})
    } catch (error) {
        console.error("[v0] Get pending users error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
