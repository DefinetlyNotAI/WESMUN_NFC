"use client"

import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import Link from "next/link"
import LogoutButton from "@/components/auth/sign-out-handler"
import {DebugMode} from "@/components/debug/debug-mode"
import {getEffectiveRole} from "@/lib/debug"
import type {UserRole} from "@/lib/types/database"

interface HomePageClientProps {
    user: {
        name: string
        email: string
        role: UserRole
    }
    isEmergencyAdmin: boolean
}

export function HomePageClient({user, isEmergencyAdmin}: HomePageClientProps) {
    const [effectiveRole, setEffectiveRole] = useState<UserRole>(user.role)

    useEffect(() => {
        // Update effective role on mount and when storage changes
        const updateRole = () => {
            setEffectiveRole(getEffectiveRole(user.role))
        }

        updateRole()

        // Listen for storage changes (in case debug mode is toggled in another tab)
        window.addEventListener('storage', updateRole)
        return () => window.removeEventListener('storage', updateRole)
    }, [user.role])

    return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black p-4">
            <DebugMode currentRole={user.role} isEmergencyAdmin={isEmergencyAdmin}/>

            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">WESMUN NFC System</CardTitle>
                    <CardDescription className="text-base">
                        Welcome, {user.name} ({effectiveRole})
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div
                        className="rounded-lg border bg-blue-50 dark:bg-black p-4 text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-semibold">Secure Access</p>
                        <p className="mt-1">You are signed in with a @wesmun.com account. All actions are IP-logged for
                            security.</p>
                    </div>

                    <div className="grid gap-3">
                        {effectiveRole === "admin" && (
                            <Link href="/admin">
                                <Button className="w-full" size="lg">
                                    Admin Panel
                                </Button>
                            </Link>
                        )}

                        {(effectiveRole === "security" || effectiveRole === "admin") && (
                            <Link href="/scan">
                                <Button className="w-full bg-transparent" variant="outline" size="lg">
                                    Scanner View
                                </Button>
                            </Link>
                        )}

                        {effectiveRole === "admin" && (
                            <Link href="/users">
                                <Button className="w-full bg-transparent" variant="outline" size="lg">
                                    User Management
                                </Button>
                            </Link>
                        )}

                        {isEmergencyAdmin && (
                            <Link href="/audit">
                                <Button className="w-full bg-transparent" variant="outline" size="lg">
                                    Audit Logs
                                </Button>
                            </Link>
                        )}

                        <LogoutButton/>
                    </div>

                    <div className="rounded-lg border bg-slate-50 dark:bg-black p-4 text-sm">
                        <p className="font-semibold text-slate-900 dark:text-white">Your Role: {effectiveRole}</p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700 dark:text-gray-300">
                            {effectiveRole === "admin" && (
                                <>
                                    <li>Full system access</li>
                                    <li>Approve/reject new users</li>
                                    <li>Manage user roles and permissions</li>
                                    <li>Create NFC links</li>
                                </>
                            )}
                            {effectiveRole === "security" && (
                                <>
                                    <li>Scan NFC cards</li>
                                    <li>Update bags checked status</li>
                                    <li>Mark attendance</li>
                                    <li>View user profiles</li>
                                </>
                            )}
                            {effectiveRole === "overseer" && (
                                <>
                                    <li>View all user data (read-only)</li>
                                    <li>Only physical card scanning is allowed</li>
                                </>
                            )}
                            {effectiveRole === "user" && (
                                <>
                                    <li>If you see this, please contact the administrator</li>
                                </>
                            )}
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
