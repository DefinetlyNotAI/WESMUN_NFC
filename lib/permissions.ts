import type {UserRole} from "@/types"

/**
 * Permission meanings (applies across all roles):
 * - canViewOwnProfile: User can view their own profile details (e.g., on /users/me) and related API reads.
 * - canUpdateOwnProfile: User can update their own profile fields (non-admin self-service edits only).
 * - canViewAllUsers: Can view the full users list and read other users' profiles (e.g., Users page, GET /api/users).
 * - canUpdateBagsChecked: Can update the "bags_checked" field for users (bag check/scan operations in Security flow).
 * - canUpdateAttendance: Can update attendance status for users (check-in/out scanning or manual updates).
 * - canUpdateDiet: Can modify user diet information (e.g., dietary preferences [Vegan status, Food received?] or needs data field).
 * - canUpdateAllergens: Can modify user allergen information (medical/safety data field).
 * - canManageUsers: Full user management actions (create, update, delete, bulk ops, role changes where allowed).
 * - canViewAuditLogs: Can read audit logs (Audit Logs page and /api/audit endpoints).
 * - canApproveUsers: Can approve or reject pending users (Admin approval queue and related endpoints).
 */
export const PERMISSIONS = {
    user: {
        canViewOwnProfile: true,
        canUpdateOwnProfile: false,
        canViewAllUsers: false,
        canUpdateBagsChecked: false,
        canUpdateAttendance: false,
        canUpdateDiet: false,
        canUpdateAllergens: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canApproveUsers: false,
    },
    security: {
        canViewOwnProfile: true,
        canUpdateOwnProfile: false,
        canViewAllUsers: true,
        canUpdateBagsChecked: true,
        canUpdateAttendance: true,
        canUpdateDiet: true,
        canUpdateAllergens: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canApproveUsers: false,
    },
    overseer: {
        canViewOwnProfile: true,
        canUpdateOwnProfile: false,
        canViewAllUsers: true,
        canUpdateBagsChecked: false,
        canUpdateAttendance: false,
        canUpdateDiet: false,
        canUpdateAllergens: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canApproveUsers: false,
    },
    admin: {
        canViewOwnProfile: true,
        canUpdateOwnProfile: true,
        canViewAllUsers: true,
        canUpdateBagsChecked: true,
        canUpdateAttendance: true,
        canUpdateDiet: true,
        canUpdateAllergens: true,
        canManageUsers: true,
        canViewAuditLogs: false,
        canApproveUsers: true,
    },
} as const

/**
 * Check if a given role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: keyof typeof PERMISSIONS.admin): boolean {
    return PERMISSIONS[role][permission] || false
}

/**
 * Convenience utility to determine if a role can update a specific user data field.
 */
export function canUpdateField(role: UserRole, field: "bags_checked" | "attendance" | "received_food" | "diet" | "allergens"): boolean {
    const permissionMap = {
        bags_checked: "canUpdateBagsChecked",
        attendance: "canUpdateAttendance",
        received_food: "canUpdateDiet", // Same permission as diet updates
        diet: "canUpdateDiet",
        allergens: "canUpdateAllergens",
    } as const

    return hasPermission(role, permissionMap[field])
}
