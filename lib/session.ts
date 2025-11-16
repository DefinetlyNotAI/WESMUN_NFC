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

function getBaseUrl() {
    if (typeof window !== "undefined") return "";
    const vercelUrl = process.env.VERCEL_URL;
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
    if (vercelUrl) {
        console.log("[WESMUN] Vercel URL is processed")
        return `https://${vercelUrl}`
    }
    if (isProd) {
        console.error("Missing required env var VERCEL_URL in production")
    }
    console.log("[WESMUN] Local URL is processed")
    return "http://localhost:3000";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return null;

    const base = getBaseUrl();

    try {
        const response = await fetch(`${base}/api/auth/validate`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token}),
            cache: "no-store"
        });

        if (!response.ok) return null;

        const user = await response.json();

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role_name,
            image: user.image || undefined
        };

    } catch (error) {
        console.error("[WESMUN] Session validation error:", error);
        return null;
    }
}
