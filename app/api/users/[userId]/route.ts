import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"
import {createAuditLog} from "@/lib/audit"
import type {DietType, UserRole} from "@/lib/types/database"

interface UpdateUserRequest {
    role?: UserRole
    diet?: DietType
    allergens?: string
    bags_checked?: boolean
    attendance?: boolean
}

export async function PATCH(request: NextRequest, {params}: { params: { userId: string } }) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const {userId} = params
        const body: UpdateUserRequest = await request.json()

        // Update role if provided
        if (body.role) {
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

        if (profileUpdates.length > 0) {
            profileValues.push(userId)
            await query(
                `UPDATE profiles
                 SET ${profileUpdates.join(", ")},
                     updated_at = NOW()
                 WHERE user_id = $${paramIndex}`,
                profileValues,
            )

            await createAuditLog({
                actorId: user.id,
                targetUserId: userId,
                action: "profile_update_admin",
                details: body,
                ipAddress: request.headers.get("x-forwarded-for") || undefined,
                userAgent: request.headers.get("user-agent") || undefined,
            })
        }

        return NextResponse.json({success: true})
    } catch (error) {
        console.error("[v0] Update user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}

export async function DELETE(request: NextRequest, {params}: { params: { userId: string } }) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const {userId} = params

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
        console.error("[v0] Delete user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
