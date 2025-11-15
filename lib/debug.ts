import type {UserRole} from "@/lib/types/database"

/**
 * Get the effective user role, taking debug mode into account.
 * This is a client-side utility that checks sessionStorage for a debug role.
 */
export function getDebugRole(): UserRole | null {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('debugRole') as UserRole | null
}

/**
 * Get the effective role to use (debug role if active, otherwise actual role)
 */
export function getEffectiveRole(actualRole: UserRole): UserRole {
    const debugRole = getDebugRole()
    return debugRole || actualRole
}

/**
 * Check if debug mode is currently active
 */
export function isDebugModeActive(): boolean {
    return getDebugRole() !== null
}

