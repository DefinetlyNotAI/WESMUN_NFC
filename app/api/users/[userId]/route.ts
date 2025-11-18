import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"
import {createAuditLog} from "@/lib/audit"
import type {UpdateUserRequest} from "@/lib/types/api"

export async function PATCH(request: NextRequest, {params}: { params: Promise<{ userId: string }> }) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const {userId} = await params

        console.log("[WESMUN] Updating user:", userId)

        // Check if the user exists
        const existingUsers = await query<{ id: string }>("SELECT id FROM users WHERE id = $1", [userId])
        if (existingUsers.length === 0) {
            return NextResponse.json({error: "User not found"}, {status: 404})
        }

        const body: UpdateUserRequest = await request.json()

        console.log("[WESMUN] Update request body:", body)

        // Update role if provided
        if (body.role) {
            // Check if the target user has a wesmun.com email
            const targetUserData = await query<{ email: string }>(
                "SELECT email FROM users WHERE id = $1",
                [userId]
            )

            if (targetUserData.length === 0) {
                return NextResponse.json({error: "User not found"}, {status: 404})
            }

            const isWesmunEmail = targetUserData[0].email.toLowerCase().endsWith("@wesmun.com")

            if (!isWesmunEmail) {
                return NextResponse.json(
                    {error: "Role changes are only allowed for @wesmun.com email accounts"},
                    {status: 403}
                )
            }

            const roles = await query<{ id: number }>("SELECT id FROM roles WHERE name = $1", [body.role])

            if (roles.length === 0) {
                return NextResponse.json({error: "Invalid role"}, {status: 400})
            }

            await query("UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2", [roles[0].id, userId])

            await createAuditLog({
                actorId: user.id,
                targetUserId: userId,
                action: "role_update",
                details: {new_role: body.role},
                ipAddress: request.headers.get("x-forwarded-for") || undefined,
                userAgent: request.headers.get("user-agent") || undefined,
            })
        }

        // Update profile fields if provided
        const profileUpdates: string[] = []
        const profileValues: any[] = []
        let paramIndex = 1

        if (body.diet !== undefined) {
            profileUpdates.push(`diet = $${paramIndex++}`)
            profileValues.push(body.diet)
        }

        if (body.allergens !== undefined) {
            profileUpdates.push(`allergens = $${paramIndex++}`)
            profileValues.push(body.allergens)
        }

        if (body.bags_checked !== undefined) {
            profileUpdates.push(`bags_checked = $${paramIndex++}`)
            profileValues.push(body.bags_checked)
        }

        if (body.attendance !== undefined) {
            profileUpdates.push(`attendance = $${paramIndex++}`)
            profileValues.push(body.attendance)
        }

        if (body.received_food !== undefined) {
            profileUpdates.push(`received_food = $${paramIndex++}`)
            profileValues.push(body.received_food)
        }

        if (profileUpdates.length > 0) {
            // Check if profile exists for this user
            const existingProfiles = await query<{ id: string }>("SELECT id FROM profiles WHERE user_id = $1", [userId])

            if (existingProfiles.length === 0) {
                console.log("[WESMUN] No profile found for user, creating one...")
                // Create profile if it doesn't exist (default diet is nonveg)
                await query(
                    "INSERT INTO profiles (user_id, diet, bags_checked, attendance, received_food, allergens) VALUES ($1, $2, $3, $4, $5, $6)",
                    [userId, body.diet || 'nonveg', body.bags_checked || false, body.attendance || false, body.received_food || false, body.allergens || null]
                )
            } else {
                profileValues.push(userId)
                const updateQuery = `UPDATE profiles
                     SET ${profileUpdates.join(", ")},
                         updated_at = NOW()
                     WHERE user_id = $${paramIndex}`

                console.log("[WESMUN] Executing profile update query:", updateQuery, profileValues)

                const result = await query(updateQuery, profileValues)

                console.log("[WESMUN] Profile update result:", result)
            }

            await createAuditLog({
                actorId: user.id,
                targetUserId: userId,
                action: "profile_update_admin",
                details: body,
                ipAddress: request.headers.get("x-forwarded-for") || undefined,
                userAgent: request.headers.get("user-agent") || undefined,
            })
        }

        console.log("[WESMUN] User update successful")

        return NextResponse.json({success: true})
    } catch (error) {
        console.error("[WESMUN] Update user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}

export async function DELETE(request: NextRequest, {params}: { params: Promise<{ userId: string }> }) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const {userId} = await params

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({error: "Cannot delete your own account"}, {status: 400})
        }

        await createAuditLog({
            actorId: user.id,
            targetUserId: userId,
            action: "user_delete",
            details: {},
            ipAddress: request.headers.get("x-forwarded-for") || undefined,
            userAgent: request.headers.get("user-agent") || undefined,
        })

        await query("DELETE FROM users WHERE id = $1", [userId])

        return NextResponse.json({success: true})
    } catch (error) {
        console.error("[WESMUN] Delete user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
