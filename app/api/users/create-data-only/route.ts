import {NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {createDataOnlyUser} from "@/lib/auth"
import type {DietType} from "@/lib/types/database"

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
        const {email, name, diet, allergens} = body

        if (!email || !name) {
            return NextResponse.json({error: "Email and name are required"}, {status: 400})
        }

        if (allergens && typeof allergens === 'string' && allergens.length > 500) {
            return NextResponse.json({error: "Allergens field too long"}, {status: 400})
       }

        // Some compiled type info may still expect a smaller arity; cast to any to allow the optional allergens param
        const createFn = createDataOnlyUser as unknown as (...args: any[]) => Promise<any>
        const result = await createFn(email, name, user.id, (diet as DietType) || "nonveg", allergens || null)

        if (!result.success) {
            return NextResponse.json({error: result.message}, {status: 400})
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            user: result.user
        })
    } catch (error) {
        console.error("[WESMUN] Create data-only user error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
