import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {createAuditLog} from "@/lib/audit"
import type {NfcLink, Profile, Role, User} from "@/types/database"

/**
 * Validates if a string is a valid NFC UUID format
 * Accepts the custom format used by the application: base36-base36
 * Example: kptfal4nobb-esj3nkod5g
 */
function isValidUUID(uuid: string): boolean {
    // Custom NFC UUID format: alphanumeric-alphanumeric (base36)
    // Each part is typically 10-13 characters
    const nfcUuidRegex = /^[a-z0-9]+-[a-z0-9]+$/i
    return nfcUuidRegex.test(uuid) && uuid.length >= 10 && uuid.length <= 50
}

/**
 * Checks if a string is a numeric user ID
 */
function isNumericUserId(value: string): boolean {
    return /^\d+$/.test(value)
}

export async function GET(request: NextRequest, {params}: { params: Promise<{ uuid: string }> }) {
    try {
        const user = await getCurrentUser()

        // If not authenticated, return 204 No Content (security requirement)
        if (!user) {
            return new NextResponse(null, {status: 204})
        }

        const {uuid} = await params

        // Validate the format of the parameter
        if (!uuid || uuid.trim() === "") {
            return NextResponse.json({error: "Invalid NFC identifier"}, {status: 400})
        }

        // Check if it's a numeric user ID
        if (isNumericUserId(uuid)) {
            // Look up the NFC UUID for this user ID
            const userIdCheck = await query<{ uuid: string; approval_status: string }>(
                `SELECT n.uuid, u.approval_status
                 FROM nfc_links n
                 JOIN users u ON n.user_id = u.id
                 WHERE n.user_id = $1`,
                [uuid]
            )

            if (userIdCheck.length > 0) {
                // Check if user is approved
                if (userIdCheck[0].approval_status !== 'approved') {
                    return NextResponse.json({error: "User not approved"}, {status: 404})
                }

                // Found a UUID for this userId - return redirect info
                return NextResponse.json({
                    redirect: true,
                    correctUuid: userIdCheck[0].uuid,
                    message: "Redirecting to NFC UUID"
                }, {status: 307}) // Temporary redirect
            }

            // User ID provided but no NFC link found
            return NextResponse.json({error: "NFC link not found"}, {status: 404})
        }

        // Check if it's a valid UUID format
        if (!isValidUUID(uuid)) {
            return NextResponse.json({error: "Invalid UUID format"}, {status: 400})
        }

        // Try to find by UUID
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

        // If not found, return 404
        if (users.length === 0) {
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

        // Check if it's a database constraint error (likely means record doesn't exist)
        if (error instanceof Error && error.message.includes('no rows')) {
            return NextResponse.json({error: "NFC link not found"}, {status: 404})
        }

        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}

