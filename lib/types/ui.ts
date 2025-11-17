// Shared UI / component types
import type { UserRole, DietType } from "./database"
import React from "react";

export interface User {
    id: string
    name: string
    email: string
    image: string | null
    profile: {
        bags_checked: boolean
        attendance: boolean
        diet: DietType
        allergens: string | null
    }
    nfc_link: {
        uuid: string
        scan_count: number
    } | null
    role: {
        name: UserRole
    }
}

export interface UserEditDialogProps {
    open: boolean
    user: User | null
    onOpenChange: (open: boolean) => void
    onSave?: () => Promise<void>
}

export interface UserData {
    user: {
        id: string
        name: string
        email: string
        image: string | null
        role: { name: UserRole }
    }
    profile: {
        bags_checked: boolean
        attendance: boolean
        diet: DietType
        allergens: string | null
    }
    nfc_link: {
        scan_count: number
        last_scanned_at: string | null
    }
}

export interface NfcScanViewProps {
    uuid: string
    userRole: UserRole
}

export interface HomePageClientProps {
    user: {
        name: string
        email: string
        role: UserRole
    }
    isEmergencyAdmin: boolean
}

export interface DebugModeProps {
    currentRole: UserRole
    isEmergencyAdmin: boolean
}

export interface AuditLog {
    id: number
    action: string
    details: Record<string, any> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
    actor: {
        id: string
        name: string
        email: string
    } | null
    target_user: {
        id: string
        name: string
        email: string
    } | null
}

export interface UserManagementProps {
    filteredUsers: User[]
    searchQuery: string
    setSearchQuery: (s: string) => void
    updating: string | null
    copiedUuid: string | null
    setCopiedUuid: React.Dispatch<React.SetStateAction<string | null>>
    fetchUsers: () => Promise<void>
    updateUserRole: (id: string, role: UserRole, username?: string) => Promise<void>
    createNfcLink: (id: string) => Promise<void>
    deleteUser: (id: string, role?: UserRole) => Promise<void>
}

export interface StatusIconProps {
    active: boolean
    activeLabel: string
    inactiveLabel: string
}

export interface UserActionUser {
    id: string
    name: string
    email: string
    role: { name: UserRole }
}

export interface UserActionsProps {
    user: UserActionUser
    updating: string | null
    isAdmin: boolean
    isEmergencyAdmin: boolean
    setEditingUser: (user: any) => void
    deleteUser: (id: string, role?: UserRole) => Promise<void>
}

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

export interface CreateAuditLogParams {
    actorId?: string | null
    targetUserId?: string | null
    action: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

