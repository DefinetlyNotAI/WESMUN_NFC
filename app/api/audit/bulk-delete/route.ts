import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"

export async function DELETE(request: Request) {
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

        const body = await request.json()
        const {logIds} = body

        if (!Array.isArray(logIds) || logIds.length === 0) {
            return NextResponse.json({error: "Invalid log IDs"}, {status: 400})
        }

        // Validate all IDs are numbers
        const validIds = logIds.filter((id: any) => typeof id === "number" && !isNaN(id))
        if (validIds.length === 0) {
            return NextResponse.json({error: "No valid log IDs provided"}, {status: 400})
        }

        // Bulk delete
        const result = await query(
            `DELETE FROM audit_logs WHERE id = ANY($1::int[]) RETURNING id`,
            [validIds]
        )

        return NextResponse.json({success: true, deleted: result.length, logIds: result.map((r: any) => r.id)})
    } catch (error) {
        console.error("[WESMUN] Bulk delete audit logs error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
