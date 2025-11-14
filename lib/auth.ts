import "server-only"
import { query } from "./db"
import type { User, UserRole } from "./types/database"
import { createAuditLog } from "./audit"
import { createHash, randomBytes } from "crypto"

/* -------------------- PASSWORD & TOKEN HELPERS -------------------- */

export function hashPassword(password: string): string {
    try {
        return createHash("sha256").update(password).digest("hex")
    } catch (error) {
        console.error("[WESMUN] hashPassword failed:", error)
        throw new Error("Failed to hash password")
    }
}

export function verifyPassword(password: string, hash: string): boolean {
    try {
        return hashPassword(password) === hash
    } catch (error) {
        console.error("[WESMUN] verifyPassword failed:", error)
        return false
    }
}

export function isValidWesmunEmail(email: string): boolean {
    try {
        return email.toLowerCase().endsWith("@wesmun.com")
    } catch (error) {
        console.error("[WESMUN] isValidWesmunEmail failed:", error)
        return false
    }
}

export function generateSessionToken(): string {
    try {
        return randomBytes(32).toString("hex")
    } catch (error) {
        console.error("[WESMUN] generateSessionToken failed:", error)
        throw new Error("Failed to generate session token")
    }
}

export function hashSessionToken(token: string): string {
    try {
        return createHash("sha256").update(token).digest("hex")
    } catch (error) {
        console.error("[WESMUN] hashSessionToken failed:", error)
        throw new Error("Failed to hash session token")
    }
}

/* -------------------- SESSION MANAGEMENT -------------------- */

export async function createSession(userId: string): Promise<string> {
    try {
        const token = generateSessionToken()
        const tokenHash = hashSessionToken(token)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        await query(
            `INSERT INTO session_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [userId, tokenHash, expiresAt]
        )

        return token
    } catch (error) {
        console.error("[WESMUN] createSession failed:", error)
        throw new Error("Session creation failed")
    }
}

export async function validateSession(token: string): Promise<(User & { role_name: UserRole; password_hash: string }) | null> {
    try {
        const tokenHash = hashSessionToken(token)

        const sessions = await query<User & { role_name: UserRole; password_hash: string }>(
            `SELECT st.*, u.*, r.name as role_name
             FROM session_tokens st
                      JOIN users u ON st.user_id = u.id
                      JOIN roles r ON u.role_id = r.id
             WHERE st.token_hash = $1
               AND st.expires_at > NOW()
               AND u.approval_status = 'approved'`,
            [tokenHash]
        )

        if (sessions.length === 0) return null

        await query(`UPDATE session_tokens
                     SET last_used_at = NOW()
                     WHERE token_hash = $1`, [tokenHash])
        return sessions[0]
    } catch (error) {
        console.error("[WESMUN] validateSession failed:", error)
        return null
    }
}

export async function deleteSession(token: string): Promise<boolean> {
    try {
        const tokenHash = hashSessionToken(token)
        await query(`DELETE
                     FROM session_tokens
                     WHERE token_hash = $1`, [tokenHash])
        return true
    } catch (error) {
        console.error("[WESMUN] deleteSession failed:", error)
        return false
    }
}

/* -------------------- USER MANAGEMENT -------------------- */

export async function registerUser(
    email: string,
    password: string,
    name: string
): Promise<{ success: boolean; message: string }> {
    try {
        if (!isValidWesmunEmail(email)) {
            return { success: false, message: "Only @wesmun.com email addresses are allowed" }
        }

        const existingUsers = await query<User>(`SELECT * FROM users WHERE email = $1`, [email])
        if (existingUsers.length > 0) {
            return { success: false, message: "User already exists" }
        }

        const passwordHash = hashPassword(password)
        const users = await query<User>(
            `INSERT INTO users (email, name, password_hash, approval_status, role_id)
             VALUES ($1, $2, $3, 'pending', 1)
             RETURNING *`,
            [email, name, passwordHash]
        )

        if (users.length === 0) {
            return { success: false, message: "User creation failed" }
        }

        try {
            await query(`INSERT INTO profiles (user_id) VALUES ($1)`, [users[0].id])
        } catch (profileError) {
            console.error("[WESMUN] Profile creation failed:", profileError)
        }

        return { success: true, message: "Registration successful. Awaiting admin approval." }
    } catch (error) {
        console.error("[WESMUN] registerUser failed:", error)
        return { success: false, message: "Registration failed due to internal error" }
    }
}

/* -------------------- EMERGENCY ADMIN -------------------- */

export async function isEmergencyAdminCredentials(email: string, password: string): Promise<boolean> {
    try {
        const emergencyUsername = process.env.EMERGENCY_ADMIN_USERNAME
        const emergencyPassword = process.env.EMERGENCY_ADMIN_PASSWORD
        if (!emergencyUsername || !emergencyPassword) return false

        const validEmail = email.toLowerCase() === `${emergencyUsername}@wesmun.com`
        const validPassword = password === emergencyPassword

        return validEmail && validPassword
    } catch (error) {
        console.error("[WESMUN] isEmergencyAdminCredentials failed:", error)
        return false
    }
}

/* -------------------- LOGIN FUNCTION -------------------- */

export async function loginUser(
    email: string,
    password: string,
    ipAddress?: string
): Promise<{ success: boolean; token?: string; message: string; user?: any }> {
    try {
        // Emergency admin first
        if (await isEmergencyAdminCredentials(email, password)) {
            try {
                const adminEmail = `${process.env.EMERGENCY_ADMIN_USERNAME}@wesmun.com`
                let adminUsers = await query<User & { role_name: UserRole; password_hash: string }>(
                    `SELECT u.*, r.name as role_name
                     FROM users u
                              JOIN roles r ON u.role_id = r.id
                     WHERE u.email = $1`,
                    [adminEmail]
                )

                if (adminUsers.length === 0) {
                    const created = await query<User>(
                        `INSERT INTO users (email, name, password_hash, approval_status, role_id)
                         VALUES ($1, $2, $3, 'approved', 4)
                         RETURNING *`,
                        [adminEmail, "Emergency Admin", hashPassword(password)]
                    )
                    if (created.length > 0) {
                        await query(`INSERT INTO profiles (user_id) VALUES ($1)`, [created[0].id])
                        adminUsers = await query<User & { role_name: UserRole; password_hash: string }>(
                            `SELECT u.*, r.name as role_name
                             FROM users u
                                      JOIN roles r ON u.role_id = r.id
                             WHERE u.id = $1`,
                            [created[0].id]
                        )
                    } else {
                        return { success: false, message: "Emergency admin creation failed" }
                    }
                }

                const admin = adminUsers[0]
                const token = await createSession(admin.id)
                try {
                    await createAuditLog({
                        actorId: admin.id,
                        action: "emergency_admin_login",
                        details: { email: admin.email },
                        ipAddress
                    })
                } catch (auditError) {
                    console.error("[WESMUN] Emergency admin audit log failed:", auditError)
                }

                return {
                    success: true,
                    token,
                    message: "Emergency admin login successful",
                    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role_name }
                }
            } catch (adminError) {
                console.error("[WESMUN] Emergency admin login flow failed:", adminError)
                return { success: false, message: "Emergency admin login failed" }
            }
        }

        // Standard login
        if (!isValidWesmunEmail(email)) return { success: false, message: "Invalid email domain" }

        // Rate limit check
        try {
            if (await checkRateLimit(email, 5, 15 * 60)) return { success: false, message: "Too many login attempts" }
        } catch (rateError) {
            console.error("[WESMUN] Rate limit check failed:", rateError)
        }

        const users = await query<User>(
            `SELECT u.*, r.name as role_name
             FROM users u
                      JOIN roles r ON u.role_id = r.id
             WHERE u.email = $1`,
            [email]
        )

        if (users.length === 0) {
            try { await incrementRateLimit(email) } catch {}
            return { success: false, message: "Invalid email or password" }
        }

        const user = users[0]
        if (!verifyPassword(password, user.password_hash)) {
            try { await incrementRateLimit(email) } catch {}
            return { success: false, message: "Invalid email or password" }
        }

        if (user.approval_status !== "approved") return { success: false, message: "Your account is pending approval" }

        const token = await createSession(user.id)
        try {
            await createAuditLog({ actorId: user.id, action: "user_login", details: { email: user.email }, ipAddress })
        } catch (auditError) {
            console.error("[WESMUN] User login audit log failed:", auditError)
        }

        return {
            success: true,
            token,
            message: "Login successful",
            user: { id: user.id, email: user.email, name: user.name, role: user.role_name }
        }
    } catch (error) {
        console.error("[WESMUN] Unexpected loginUser error:", error)
        return { success: false, message: "An unexpected error occurred during login" }
    }
}

/* -------------------- RATE LIMITING -------------------- */

async function checkRateLimit(identifier: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    try {
        const windowStart = new Date(Date.now() - windowSeconds * 1000)
        const result = await query<{ count: number }>(
            `SELECT COALESCE(SUM(count), 0) as count
             FROM rate_limits
             WHERE identifier = $1
               AND action = 'login'
               AND window_start > $2`,
            [identifier, windowStart]
        )
        const count = result[0]?.count ?? 0
        return count >= maxAttempts
    } catch (error) {
        console.error("[WESMUN] checkRateLimit failed:", error)
        return false
    }
}

async function incrementRateLimit(identifier: string): Promise<void> {
    try {
        const windowStart = new Date(Date.now() - (Date.now() % (15 * 60 * 1000)))
        await query(
            `INSERT INTO rate_limits (identifier, action, count, window_start)
             VALUES ($1, 'login', 1, $2)
             ON CONFLICT (identifier, action, window_start)
                 DO UPDATE SET count = rate_limits.count + 1`,
            [identifier, windowStart]
        )
    } catch (error) {
        console.error("[WESMUN] incrementRateLimit failed:", error)
    }
}
