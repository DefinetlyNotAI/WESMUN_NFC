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

        if (!hasPermission(user.role, "canViewAllUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const users = await query<any>(
            `SELECT u.id,
                    u.email,
                    u.name,
                    u.image,
                    u.created_at,
                    u.updated_at,
                    u.approval_status,
                    json_build_object(
                            'id', p.id,
                            'bags_checked', p.bags_checked,
                            'attendance', p.attendance,
                            'diet', p.diet,
                            'allergens', p.allergens
                    ) as profile,
                    json_build_object(
                            'id', n.id,
                            'uuid', n.uuid,
                            'scan_count', n.scan_count,
                            'last_scanned_at', n.last_scanned_at
                    ) as nfc_link,
                    json_build_object(
                            'id', r.id,
                            'name', r.name,
                            'description', r.description
                    ) as role
             FROM users u
                      LEFT JOIN profiles p ON u.id = p.user_id
                      LEFT JOIN nfc_links n ON u.id = n.user_id
                      JOIN roles r ON u.role_id = r.id
             WHERE u.approval_status = 'approved'
             ORDER BY u.created_at DESC`,
        )

        return NextResponse.json({users})
    } catch (error) {
        console.error("[v0] Get users error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
