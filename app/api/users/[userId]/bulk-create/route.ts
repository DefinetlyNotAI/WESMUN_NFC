import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {createDataOnlyUser} from "@/lib/auth"

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        // Only security and admin can create data-only users
        if (user.role !== "security" && user.role !== "admin") {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const body = await request.json()
        const {users: usersList} = body

        if (!Array.isArray(usersList) || usersList.length === 0) {
            return NextResponse.json({error: "Invalid user list"}, {status: 400})
        }

        const results = []
        for (const userData of usersList) {
            const result = await createDataOnlyUser(userData.email, userData.name, user.id)
            results.push({
                email: userData.email,
                ...result
            })
        }

        return NextResponse.json({
            success: true,
            results
        })
    } catch (error) {
        console.error("[v0] Bulk create users error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
