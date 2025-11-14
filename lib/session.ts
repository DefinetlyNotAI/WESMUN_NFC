import "server-only"

import type {UserRole} from "./types/database"
import {cookies} from "next/headers"

// Mock user type for development
export type SessionUser = {
    id: string
    email: string
    name: string
    role: UserRole
    image?: string
}

export async function getCurrentUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get("session_token")?.value

    if (!token) return null

    try {
        const response = await fetch("http://localhost:3000/api/auth/validate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token}),
            cache: "no-store",
        })

        if (!response.ok) return null

        const user = await response.json()
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role_name,
            image: user.image || undefined,
        }
    } catch (error) {
        console.error("[v0] Session validation error:", error)
        return null
    }
}
