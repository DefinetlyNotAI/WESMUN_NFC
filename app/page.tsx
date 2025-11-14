import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {getCurrentUser} from "@/lib/session"
import Link from "next/link"
import {redirect} from "next/navigation"

export default async function HomePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">MUN NFC System</CardTitle>
                    <CardDescription className="text-base">
                        Welcome, {user.name} ({user.role})
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
                        <p className="font-semibold">Secure Access</p>
                        <p className="mt-1">You are signed in with a @wesmun.com account. All actions are logged for
                            security.</p>
                    </div>

                    <div className="grid gap-3">
                        {user.role === "admin" && (
                            <Link href="/admin">
                                <Button className="w-full" size="lg">
                                    Admin Panel
                                </Button>
                            </Link>
                        )}

                        {(user.role === "security" || user.role === "admin") && (
                            <Link href="/scan">
                                <Button className="w-full bg-transparent" variant="outline" size="lg">
                                    Scanner View
                                </Button>
                            </Link>
                        )}

                        {(user.role === "overseer" || user.role === "admin" || user.role === "security") && (
                            <Link href="/users">
                                <Button className="w-full bg-transparent" variant="outline" size="lg">
                                    User Management
                                </Button>
                            </Link>
                        )}

                        {(user.role === "overseer" || user.role === "admin") && (
                            <Link href="/audit">
                                <Button className="w-full bg-transparent" variant="outline" size="lg">
                                    Audit Logs
                                </Button>
                            </Link>
                        )}

                        <form action="/api/auth/logout" method="POST">
                            <Button type="submit" variant="ghost" className="w-full" size="lg">
                                Sign Out
                            </Button>
                        </form>
                    </div>

                    <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                        <p className="font-semibold text-slate-900">Your Role: {user.role}</p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                            {user.role === "admin" && (
                                <>
                                    <li>Full system access</li>
                                    <li>Approve/reject new users</li>
                                    <li>Manage user roles and permissions</li>
                                    <li>Create NFC links</li>
                                    <li>View audit logs</li>
                                </>
                            )}
                            {user.role === "security" && (
                                <>
                                    <li>Scan NFC cards</li>
                                    <li>Update bags checked status</li>
                                    <li>Mark attendance</li>
                                    <li>View user profiles</li>
                                </>
                            )}
                            {user.role === "overseer" && (
                                <>
                                    <li>View all user data (read-only)</li>
                                    <li>Access audit logs</li>
                                    <li>Monitor system activity</li>
                                </>
                            )}
                            {user.role === "user" && (
                                <>
                                    <li>View your own profile</li>
                                    <li>Limited system access</li>
                                </>
                            )}
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
