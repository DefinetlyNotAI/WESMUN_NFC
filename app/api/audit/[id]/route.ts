import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"

export async function DELETE(
    {params}: {params: {id: string}}
) {
    const {id} = await params

    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (user.email !== process.env.EMERGENCY_ADMIN_USERNAME) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const logId = parseInt(id)
        if (isNaN(logId)) {
            return NextResponse.json({error: "Invalid log ID"}, {status: 400})
        }

        // Delete the audit log
        const result = await query(
            `DELETE FROM audit_logs WHERE id = $1 RETURNING id`,
            [logId]
        )

        if (result.length === 0) {
            return NextResponse.json({error: "Log not found"}, {status: 404})
        }

        return NextResponse.json({success: true, deleted: logId})
    } catch (error) {
        console.error("[v0] Delete audit log error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
