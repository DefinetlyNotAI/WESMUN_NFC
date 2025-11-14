import {NextResponse} from "next/server"
import {deleteSession} from "@/lib/auth"
import {cookies} from "next/headers"

export async function POST() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("session_token")?.value

        if (token) {
            await deleteSession(token)
        }

        // Clear cookie
        cookieStore.delete("session_token")

        return NextResponse.json({success: true, message: "Logged out successfully"})
    } catch (error) {
        console.error("[v0] Logout error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
