import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

// List of protected paths
const protectedPaths = ["/admin", "/users", "/audit", "/scan"];

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // HTTPS redirect in production
    if (
        process.env.NODE_ENV === "production" &&
        request.headers.get("x-forwarded-proto") !== "https"
    ) {
        const url = new URL(request.url);
        url.protocol = "https:";
        return NextResponse.redirect(url, 301);
    }

    // Skip unprotected paths
    const excludedPaths = [
        "/auth/signin",
        "/wesmun.svg",
        "/_next/static",
        "/_next/image",
        "/api",
    ];
    if (excludedPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Check for protected routes
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
    if (isProtected) {
        const token = request.cookies.get("session_token")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/auth/signin", request.url));
        }
    }

    // Allow everything else
    return NextResponse.next();
}
