import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> } // note: params is a Promise
) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const isEmergencyAdmin = user.email === process.env.EMERGENCY_ADMIN_USERNAME ||
            user.name === "Emergency Admin"

        if (!isEmergencyAdmin) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        // unwrap params
        const {id} = await context.params
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
        console.error("[WESMUN] Delete audit log error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
