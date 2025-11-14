import type {UserRole} from "./types/database"

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
        canUpdateDiet: false,
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
        canViewAuditLogs: true,
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
        canViewAuditLogs: true,
        canApproveUsers: true,
    },
} as const

export function hasPermission(role: UserRole, permission: keyof typeof PERMISSIONS.admin): boolean {
    return PERMISSIONS[role][permission] || false
}

export function canUpdateField(role: UserRole, field: "bags_checked" | "attendance" | "diet" | "allergens"): boolean {
    const permissionMap = {
        bags_checked: "canUpdateBagsChecked",
        attendance: "canUpdateAttendance",
        diet: "canUpdateDiet",
        allergens: "canUpdateAllergens",
    } as const

    return hasPermission(role, permissionMap[field])
}
