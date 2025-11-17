// Authentication and session types
import type { UserRole } from "./database"

export type SessionUser = {
    id: string
    email: string
    name: string
    role: UserRole
    image?: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    success: boolean
    token?: string
    user?: SessionUser
    error?: string
}

export interface RegisterRequest {
    email: string
    password: string
    name: string
}

export interface RegisterResponse {
    success: boolean
    message: string
    error?: string
}

export interface ValidateTokenRequest {
    token: string
}

export interface ValidateTokenResponse {
    id: string
    email: string
    name: string
    role_name: UserRole
    image?: string
}

