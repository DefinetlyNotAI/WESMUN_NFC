// Temporary handler until NextAuth is fully configured
export async function GET() {
    return new Response(
        JSON.stringify({
            error:
                "NextAuth not configured. Please add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET to environment variables.",
        }),
        {
            status: 503,
            headers: {"Content-Type": "application/json"},
        },
    )
}

export async function POST() {
    return new Response(
        JSON.stringify({
            error:
                "NextAuth not configured. Please add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET to environment variables.",
        }),
        {
            status: 503,
            headers: {"Content-Type": "application/json"},
        },
    )
}
