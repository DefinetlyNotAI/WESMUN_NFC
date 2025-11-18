export type UserRole = "user" | "security" | "overseer" | "admin"
export type DietType = "veg" | "nonveg"

export interface Role {
    id: number
    name: UserRole
    description: string | null
    created_at: Date
}

export interface User {
    id: string
    email: string
    name: string
    image: string | null
    role_id: number
    created_at: Date
    updated_at: Date
    password_hash: string
    approval_status: "pending" | "approved"
    role_name: UserRole
}

export interface Profile {
    id: string
    user_id: string
    bags_checked: boolean
    attendance: boolean
    received_food: boolean
    diet: DietType
    allergens: string | null
    created_at: Date
    updated_at: Date
}

export interface NfcLink {
    id: string
    user_id: string
    uuid: string
    created_at: Date
    last_scanned_at: Date | null
    scan_count: number
}
