import type React from "react"
import type {Metadata} from "next"
import {Analytics} from "@vercel/analytics/next"
import {SessionProvider} from "@/components/auth/session-provider"
import {ThemeProvider} from "@/components/theme-provider"
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
            <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
        <Analytics/>
        </body>
        </html>
    )
}
