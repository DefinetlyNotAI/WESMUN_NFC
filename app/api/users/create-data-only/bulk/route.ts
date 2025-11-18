import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {createDataOnlyUser} from "@/lib/auth"

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        // Only admin can create data-only users
        if (user.role !== "admin") {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const body = await request.json()
        const {users} = body

        if (!Array.isArray(users) || users.length === 0) {
            return NextResponse.json({error: "Users array is required"}, {status: 400})
        }

        const results = await Promise.all(
            users.map(async (userData: { email: string; name: string }) => {
                const result = await createDataOnlyUser(userData.email, userData.name, user.id)
                return {
                    email: userData.email,
                    success: result.success,
                    message: result.message,
                    user: result.user
                }
            })
        )

        return NextResponse.json({results, success: true})
    } catch (error) {
        console.error("[WESMUN] Bulk create data-only user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
