import {type NextRequest, NextResponse} from "next/server"
import {loginUser} from "@/lib/auth"
import {cookies} from "next/headers"

export async function POST(request: NextRequest) {
    console.log("[WESMUN] Login route handler called")

    try {
        console.log("[WESMUN] Parsing request body")
        const body = await request.json()
        const {email, password} = body

        console.log("[WESMUN] Received login attempt for:", email)

        // Validate input
        if (!email || !password) {
            console.log("[WESMUN] VALIDATION FAILED - Missing email or password")
            console.log("[WESMUN] Email provided:", !!email, "Password provided:", !!password)
            return NextResponse.json({error: "Email and password are required"}, {status: 400})
        }

        // Get IP address for rate limiting
        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
        console.log("[WESMUN] IP address:", ipAddress || "NOT_PROVIDED")

        // Attempt login
        console.log("[WESMUN] Calling loginUser function with email:", email)
        const result = await loginUser(email, password, ipAddress)
        console.log("[WESMUN] loginUser result:", {
            success: result.success,
            message: result.message,
            hasToken: !!result.token
        })

        if (!result.success) {
            console.log("[WESMUN] LOGIN FAILED - Reason:", result.message)
            return NextResponse.json({error: result.message}, {status: 401})
        }

        // Set secure HTTP-only cookie
        console.log("[WESMUN] LOGIN SUCCESSFUL - Setting session cookie")
        const cookieStore = await cookies()
        cookieStore.set("session_token", result.token!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        })

        console.log("[WESMUN] Session cookie set successfully")
        return NextResponse.json({
            success: true,
            message: result.message,
            user: result.user,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined

        console.error("[WESMUN] ===== LOGIN ROUTE ERROR =====")
        console.error("[WESMUN] CRITICAL ERROR in login route")
        console.error("[WESMUN] Error Type:", error instanceof Error ? error.constructor.name : typeof error)
        console.error("[WESMUN] Error Message:", errorMessage)
        console.error("[WESMUN] Error Stack:", errorStack)
        console.error("[WESMUN] Full Error Object:", JSON.stringify(error, null, 2))
        console.error("[WESMUN] ===== END ERROR =====")

        // Ensure JSON response
        return NextResponse.json(
            {
                error: errorMessage,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                details: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
                timestamp: new Date().toISOString(),
            },
            {status: 500},
        )
    }
}
