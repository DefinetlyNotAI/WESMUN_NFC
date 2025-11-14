import {type NextRequest, NextResponse} from "next/server"
import {getCurrentUser} from "@/lib/session"
import {query} from "@/lib/db"
import {hasPermission} from "@/lib/permissions"
import {createAuditLog} from "@/lib/audit"
import {randomUUID} from "crypto"

interface CreateNfcLinkRequest {
    userId: string
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if (!hasPermission(user.role, "canManageUsers")) {
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }

        const body: CreateNfcLinkRequest = await request.json()

        if (!body.userId) {
            return NextResponse.json({error: "Invalid userId"}, {status: 400})
        }

        const targetUsers = await query("SELECT id FROM users WHERE id = $1 AND approval_status = 'approved'", [
            body.userId,
        ])

        if (targetUsers.length === 0) {
            return NextResponse.json({error: "User not found or not approved"}, {status: 404})
        }

        // Check if user already has an NFC link
        const existing = await query("SELECT id FROM nfc_links WHERE user_id = $1", [body.userId])

        if (existing.length > 0) {
            return NextResponse.json({error: "User already has an NFC link"}, {status: 400})
        }

        const uuid = randomUUID()

        await query("INSERT INTO nfc_links (user_id, uuid) VALUES ($1, $2)", [body.userId, uuid])

        await createAuditLog({
            actorId: user.id,
            targetUserId: body.userId,
            action: "nfc_link_create",
            details: {uuid},
            ipAddress: request.headers.get("x-forwarded-for") || undefined,
            userAgent: request.headers.get("user-agent") || undefined,
        })

        return NextResponse.json({uuid})
    } catch (error) {
        console.error("[v0] Create NFC link error:", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500})
    }
}
