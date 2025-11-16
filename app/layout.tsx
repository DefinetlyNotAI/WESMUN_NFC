import type React from "react"
import type {Metadata} from "next"
import {Analytics} from "@vercel/analytics/next"
import {SessionProvider} from "@/components/auth/session-provider"
import {ThemeProvider} from "@/components/theme-provider"
import {ThemeToggle} from "@/components/ui/theme-toggle"
import "./globals.css"

export const metadata: Metadata = {
    title: "MUN NFC System",
    description: "NFC-based user management for WESMUN - made by Shahm Najeeb",
    icons: {
        icon: "/wesmun.svg",
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider>
                {/* Global theme toggle on all pages */}
                <div className="fixed right-4 top-4 z-50">
                    <ThemeToggle/>
                </div>
                {children}
            </SessionProvider>
        </ThemeProvider>
        <Analytics/>
        </body>
        </html>
    )
}
