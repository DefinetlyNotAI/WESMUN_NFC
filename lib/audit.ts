import {query} from "./db"

interface CreateAuditLogParams {
    actorId?: string | null
    targetUserId?: string | null
    action: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

export async function createAuditLog({
                                         actorId,
                                         targetUserId,
                                         action,
                                         details,
                                         ipAddress,
                                         userAgent,
                                     }: CreateAuditLogParams): Promise<void> {
    try {
        console.log("[WESMUN] Creating audit log:", {action, actorId, targetUserId})

        const finalActorId = actorId || null
        const finalTargetUserId = targetUserId || null

        await query(
            `INSERT INTO audit_logs (actor_id, target_user_id, action, details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                finalActorId,
                finalTargetUserId,
                action,
                details ? JSON.stringify(details) : null,
                ipAddress || null,
                userAgent || null,
            ],
        )

        console.log("[WESMUN] Audit log created successfully")
    } catch (error) {
        console.error("[WESMUN] Failed to create audit log:", error)
        // Don't throw - audit logging should not break the main flow
    }
}
