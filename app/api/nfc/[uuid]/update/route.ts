import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {createAuditLog} from "@/lib/audit"
import {canUpdateField} from "@/lib/permissions"
import type {DietType} from "@/lib/types/database"

interface UpdateProfileRequest {
    bags_checked?: boolean
    attendance?: boolean
    diet?: DietType
    allergens?: string
}

export async function PATCH(request: NextRequest, {params}: { params: { uuid: string } }) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        const {uuid} = params
        const body: UpdateProfileRequest = await request.json()

        if (body.allergens && body.allergens.length > 500) {
            return NextResponse.json({error: "Allergens field too long"}, {status: 400})
        }

        // Get the target user (only approved users)
        const users = await query<{ id: string; user_id: string }>(
            `SELECT u.id, p.id as profile_id
             FROM nfc_links n
                      JOIN users u ON n.user_id = u.id
                      LEFT JOIN profiles p ON u.id = p.user_id
             WHERE n.uuid = $1
               AND u.approval_status = 'approved'`,
            [uuid],
        )

        if (users.length === 0) {
            return NextResponse.json({error: "NFC link not found"}, {status: 404})
        }

        const targetUserId = users[0].id

        // Check permissions for each field
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (body.bags_checked !== undefined) {
            if (!canUpdateField(user.role, "bags_checked")) {
                return NextResponse.json({error: "Forbidden: Cannot update bags_checked"}, {status: 403})
            }
            updates.push(`bags_checked = $${paramIndex++}`)
            values.push(body.bags_checked)
        }

        if (body.attendance !== undefined) {
            if (!canUpdateField(user.role, "attendance")) {
                return NextResponse.json({error: "Forbidden: Cannot update attendance"}, {status: 403})
            }
            updates.push(`attendance = $${paramIndex++}`)
            values.push(body.attendance)
        }

        if (body.diet !== undefined) {
            if (!canUpdateField(user.role, "diet")) {
                return NextResponse.json({error: "Forbidden: Cannot update diet"}, {status: 403})
            }
            updates.push(`diet = $${paramIndex++}`)
            values.push(body.diet)
        }

        if (body.allergens !== undefined) {
            if (!canUpdateField(user.role, "allergens")) {
                return NextResponse.json({error: "Forbidden: Cannot update allergens"}, {status: 403})
            }
            updates.push(`allergens = $${paramIndex++}`)
            values.push(body.allergens)
        }

        if (updates.length === 0) {
            return NextResponse.json({error: "No valid fields to update"}, {status: 400})
        }

        // Add user_id to values
        values.push(targetUserId)

        // Update the profile
        await query(`UPDATE profiles
                     SET ${updates.join(", ")},
                         updated_at = NOW()
                     WHERE user_id = $${paramIndex}`, values)

        // Log the update
        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
        const userAgent = request.headers.get("user-agent") || undefined

        await createAuditLog({
            actorId: user.id,
            targetUserId,
            action: "profile_update",
            details: {updates: body, uuid},
            ipAddress,
            userAgent,
        })

        return NextResponse.json({success: true})
    } catch (error) {
        console.error("[v0] Profile update error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
