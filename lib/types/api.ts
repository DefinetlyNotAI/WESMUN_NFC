// API request/response types
import type { UserRole, DietType } from "./database"

// User update types
export interface UpdateUserRequest {
    role?: UserRole
    diet?: DietType
    allergens?: string
    bags_checked?: boolean
    attendance?: boolean
}

export interface BulkUpdateBody {
    userIds: string[]
    role?: UserRole
    diet?: DietType
    bags_checked?: boolean
    attendance?: boolean
    allergens?: string | null
}

// Export types
export interface ExportParams {
    format: "csv" | "pdf"
    filterBags?: boolean
    filterAttendance?: boolean
    filterDiet?: DietType
    countOnly?: boolean
}

export interface ExportRow {
    name: string
    email: string
    bags_checked: boolean
    attendance: boolean
    diet: DietType | null
    allergens: string | null
    scan_count: number
    uuid: string | null
}

// Audit log types
export interface AuditLogParams {
    limit?: number
    offset?: number
    action?: string
    search?: string
}

export interface CreateAuditLogParams {
    actorId?: string | null
    targetUserId?: string | null
    action: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

// User creation types
export interface CreatedUser {
    email: string
    success: boolean
    message: string
    user?: {
        id: string
        email: string
        name: string
        nfcUuid?: string
    }
}

export interface CreateUserData {
    name: string
    email: string
    diet?: DietType
    allergens?: string
}

// NFC types
export interface NfcUpdateRequest {
    bags_checked?: boolean
    attendance?: boolean
}

// Admin approval types
export interface ApprovalRequest {
    userId: string
    approved: boolean
}

export interface PendingUser {
    id: string
    name: string
    email: string
    created_at: string
}

