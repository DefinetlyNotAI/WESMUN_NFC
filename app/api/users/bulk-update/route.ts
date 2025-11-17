import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"
import {createAuditLog} from "@/lib/audit"
import type {BulkUpdateBody} from "@/lib/types/api"

export async function PATCH(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        if (!hasPermission(currentUser.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const body: BulkUpdateBody = await request.json()
        const {userIds} = body
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({error: "userIds must be a non-empty array"}, {status: 400})
        }

        // Fetch target users and validate
        const placeholders = userIds.map((_, i) => `$${i + 1}`).join(",")
        const users = await query<{ id: string; email: string }>(`SELECT id, email FROM users WHERE id IN (${placeholders})`, userIds)
        const existingIds = new Set(users.map(u => u.id))
        const missing = userIds.filter(id => !existingIds.has(id))

        // Role update - only if role provided and all have wesmun.com email
        if (body.role) {
            const invalidRoleEmails = users.filter(u => !u.email.toLowerCase().endsWith("@wesmun.com"))
            if (invalidRoleEmails.length > 0) {
                return NextResponse.json({error: "Role changes only allowed for @wesmun.com accounts", invalid: invalidRoleEmails.map(u => u.email)}, {status: 403})
            }
            const roleRows = await query<{ id: number }>("SELECT id FROM roles WHERE name = $1", [body.role])
            if (roleRows.length === 0) return NextResponse.json({error: "Invalid role"}, {status: 400})
            await query(`UPDATE users SET role_id = $1, updated_at = NOW() WHERE id IN (${placeholders})`, [roleRows[0].id, ...userIds])
        }

        // Profile updates
        const profileFields: string[] = []
        const profileValues: any[] = []
        if (body.diet !== undefined) {profileFields.push("diet = $" + (profileValues.length + 1)); profileValues.push(body.diet)}
        if (body.bags_checked !== undefined) {profileFields.push("bags_checked = $" + (profileValues.length + 1)); profileValues.push(body.bags_checked)}
        if (body.attendance !== undefined) {profileFields.push("attendance = $" + (profileValues.length + 1)); profileValues.push(body.attendance)}
        if (body.allergens !== undefined) {profileFields.push("allergens = $" + (profileValues.length + 1)); profileValues.push(body.allergens)}

        if (profileFields.length > 0) {
            // Ensure profiles exist for each user
            for (const u of users) {
                const prof = await query<{ id: string }>("SELECT id FROM profiles WHERE user_id = $1", [u.id])
                if (prof.length === 0) {
                    await query("INSERT INTO profiles (user_id, diet, bags_checked, attendance, allergens) VALUES ($1,$2,$3,$4,$5)", [u.id, body.diet || 'nonveg', body.bags_checked || false, body.attendance || false, body.allergens || null])
                }
            }
            // Build update statement
            const setClause = profileFields.join(", ")
            profileValues.push(...userIds) // append ids for IN list via ANY
            // We can't parameterize variable-length IN easily combined with dynamic fields; build second placeholders
            const idPlaceholders = userIds.map((_, i) => `$${profileValues.length - userIds.length + i + 1}`).join(",")
            const finalValues = profileValues
            const updateSql = `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE user_id IN (${idPlaceholders})`
            await query(updateSql, finalValues)
        }

        // Audit log
        await createAuditLog({
            actorId: currentUser.id,
            action: "profile_update_admin_bulk",
            details: {
                affected_users: users.map(u => u.id),
                missing,
                updates: {
                    role: body.role || null,
                    diet: body.diet ?? null,
                    bags_checked: body.bags_checked ?? null,
                    attendance: body.attendance ?? null,
                    allergens: body.allergens ?? null
                }
            },
            ipAddress: undefined,
            userAgent: undefined
        })

        return NextResponse.json({success: true, updated: users.length, missing})
    } catch (e) {
        console.error("[WESMUN] Bulk update error", e)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}

