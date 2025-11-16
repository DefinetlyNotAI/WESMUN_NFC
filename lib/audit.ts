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

        // Fetch actor details if actorId provided
        let actorName = null
        let actorEmail = null
        if (finalActorId) {
            const actorResult = await query(
                `SELECT name, email FROM users WHERE id = $1`,
                [finalActorId]
            )
            if (actorResult.length > 0) {
                actorName = actorResult[0].name
                actorEmail = actorResult[0].email
            }
        }

        // Fetch target user details if targetUserId provided
        let targetUserName = null
        let targetUserEmail = null
        if (finalTargetUserId) {
            const targetResult = await query(
                `SELECT name, email FROM users WHERE id = $1`,
                [finalTargetUserId]
            )
            if (targetResult.length > 0) {
                targetUserName = targetResult[0].name
                targetUserEmail = targetResult[0].email
            }
        }

        await query(
            `INSERT INTO audit_logs (actor_id, target_user_id, action, details, ip_address, user_agent, actor_name, actor_email, target_user_name, target_user_email)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                finalActorId,
                finalTargetUserId,
                action,
                details ? JSON.stringify(details) : null,
                ipAddress || null,
                userAgent || null,
                actorName,
                actorEmail,
                targetUserName,
                targetUserEmail,
            ],
        )

        console.log("[WESMUN] Audit log created successfully")
    } catch (error) {
        console.error("[WESMUN] Failed to create audit log:", error)
        // Don't throw - audit logging should not break the main flow
    }
}
