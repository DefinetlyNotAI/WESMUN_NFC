import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"
import {createAuditLog} from "@/lib/audit"

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const body = await request.json()
        const {userId, approved} = body

        if (!userId || typeof approved !== "boolean") {
            return NextResponse.json({error: "Invalid request"}, {status: 400})
        }

        const status = approved ? "approved" : "rejected"

        // Update user approval status
        await query(
            `UPDATE users
             SET approval_status = $1,
                 approved_by = $2,
                 approved_at = NOW()
             WHERE id = $3`,
            [status, user.id, userId],
        )

        // Create audit log
        await createAuditLog({
            actorId: user.id,
            targetUserId: userId,
            action: approved ? "user_approved" : "user_rejected",
            details: {status},
        })

        return NextResponse.json({
            success: true,
            message: `User ${approved ? "approved" : "rejected"} successfully`,
        })
    } catch (error) {
        console.error("[v0] Approve user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
