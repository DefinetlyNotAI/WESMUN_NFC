import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {createAuditLog} from "@/lib/audit"
import type {NfcLink, Profile, Role, User} from "@/lib/types/database"

export async function GET(request: NextRequest, {params}: { params: Promise<{ uuid: string }> }) {
    try {
        const user = await getCurrentUser()

        // If not authenticated, return 204 No Content (security requirement)
        if (!user) {
            return new NextResponse(null, {status: 204})
        }

        const {uuid} = await params

        // First, try to find by UUID
        const users = await query<User & { profile: Profile; nfc_link: NfcLink; role: Role }>(
            `SELECT u.*,
                    json_build_object(
                            'id', p.id,
                            'user_id', p.user_id,
                            'bags_checked', p.bags_checked,
                            'attendance', p.attendance,
                            'received_food', p.received_food,
                            'diet', p.diet,
                            'allergens', p.allergens,
                            'created_at', p.created_at,
                            'updated_at', p.updated_at
                    ) as profile,
                    json_build_object(
                            'id', n.id,
                            'user_id', n.user_id,
                            'uuid', n.uuid,
                            'created_at', n.created_at,
                            'last_scanned_at', n.last_scanned_at,
                            'scan_count', n.scan_count
                    ) as nfc_link,
                    json_build_object(
                            'id', r.id,
                            'name', r.name,
                            'description', r.description,
                            'created_at', r.created_at
                    ) as role
             FROM nfc_links n
                      JOIN users u ON n.user_id = u.id
                      LEFT JOIN profiles p ON u.id = p.user_id
                      JOIN roles r ON u.role_id = r.id
             WHERE n.uuid = $1
               AND u.approval_status = 'approved'`,
            [uuid],
        )

        // If not found by UUID, check if the uuid parameter is actually a userId
        if (users.length === 0) {
            const userIdCheck = await query<{ uuid: string }>(
                `SELECT n.uuid FROM nfc_links n WHERE n.user_id = $1`,
                [uuid]
            )

            if (userIdCheck.length > 0) {
                // Found a UUID for this userId - return redirect info
                return NextResponse.json({
                    redirect: true,
                    correctUuid: userIdCheck[0].uuid,
                    message: "Incorrect UUID format - use the NFC UUID instead of user ID"
                }, {status: 307}) // Temporary redirect
            }

            return NextResponse.json({error: "NFC link not found"}, {status: 404})
        }

        const targetUser = users[0]

        // Update scan count and last scanned time
        await query("UPDATE nfc_links SET scan_count = scan_count + 1, last_scanned_at = NOW() WHERE uuid = $1", [uuid])

        // Log the scan
        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
        const userAgent = request.headers.get("user-agent") || undefined

        await createAuditLog({
            actorId: user.id,
            targetUserId: targetUser.id,
            action: "nfc_scan",
            details: {uuid},
            ipAddress,
            userAgent,
        })

        // Return user data with profile
        return NextResponse.json({
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                image: targetUser.image,
                role: targetUser.role,
            },
            profile: targetUser.profile,
            nfc_link: targetUser.nfc_link,
        })
    } catch (error) {
        console.error("[WESMUN] NFC scan error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
