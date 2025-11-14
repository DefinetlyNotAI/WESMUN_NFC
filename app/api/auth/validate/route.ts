import {validateSession} from "@/lib/auth"
import {type NextRequest, NextResponse} from "next/server"

export async function POST(request: NextRequest) {
    try {
        const {token} = await request.json()

        if (!token) {
            return NextResponse.json({error: "No token provided"}, {status: 401})
        }

        const user = await validateSession(token)

        if (!user) {
            return NextResponse.json({error: "Invalid session"}, {status: 401})
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("[v0] Validation error:", error)
        return NextResponse.json({error: "Validation failed"}, {status: 500})
    }
}
