import "server-only"

import type { SessionUser } from "@/lib/types"
import {cookies} from "next/headers"

// Re-export for convenience
export type { SessionUser }

function getBaseUrl() {
    if (typeof window !== "undefined") return "";

    // Always use your canonical domain in production
    if (process.env.NODE_ENV === "production") {
        return "https://nfc.wesmun.com";
    }

    // Dev uses localhost
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
