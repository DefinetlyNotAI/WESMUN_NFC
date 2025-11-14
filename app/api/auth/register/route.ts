import {type NextRequest, NextResponse} from "next/server"
import {registerUser} from "@/lib/auth"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {email, password, name} = body

        // Validate input
        if (!email || !password || !name) {
            return NextResponse.json({error: "Email, password, and name are required"}, {status: 400})
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json({error: "Password must be at least 8 characters long"}, {status: 400})
        }

        // Register user
        const result = await registerUser(email, password, name)

        if (!result.success) {
            return NextResponse.json({error: result.message}, {status: 400})
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        })
    } catch (error) {
        console.error("[v0] Registration error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
