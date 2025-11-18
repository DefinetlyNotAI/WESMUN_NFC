import {NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/session'
import {hasPermission} from '@/lib/permissions'
import {query} from '@/lib/db'
import {createAuditLog} from '@/lib/audit'
import {BulkDeleteBody} from "@/types/api";


export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        if (!hasPermission(user.role, 'canManageUsers')) return NextResponse.json({error: 'Forbidden'}, {status: 403})

        const body: BulkDeleteBody = await request.json().catch(() => ({}))
        const {userIds} = body
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({error: 'userIds array required'}, {status: 400})
        }

        // Fetch roles for provided users
        const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',')
        const rows = await query<{ id: string; role_name: string }>(
            `SELECT u.id, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id IN (${placeholders})`,
            userIds
        )

        const existingMap = new Map(rows.map(r => [r.id, r.role_name]))
        const missing: string[] = []
        const forbidden: string[] = []
        const deletable: string[] = []

        for (const id of userIds) {
            const role = existingMap.get(id)
            if (!role) {
                missing.push(id);
                continue
            }
            if (id === user.id || role === 'admin' || role === 'security' || role === 'overseer') {
                forbidden.push(id);
                continue
            }
            deletable.push(id)
        }

        let deleted = 0
        if (deletable.length > 0) {
            const delPlaceholders = deletable.map((_, i) => `$${i + 1}`).join(',')
            await query(`DELETE FROM users WHERE id IN (${delPlaceholders})`, deletable)
            deleted = deletable.length
            // Audit each deletion (do not block on failures)
            await Promise.all(deletable.map(targetId => createAuditLog({
                actorId: user.id,
                targetUserId: targetId,
                action: 'user_delete',
                details: {bulk: true},
                ipAddress: request.headers.get('x-forwarded-for') || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            })))
        }

        return NextResponse.json({success: true, deleted, missing, forbidden})
    } catch (error) {
        console.error('[WESMUN] Bulk delete error:', error)
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}

