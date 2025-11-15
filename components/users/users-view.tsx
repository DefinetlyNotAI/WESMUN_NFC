"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Search,
    Utensils,
    XCircle,
    Edit2,
    RefreshCw,
    Copy,
    Eye
} from 'lucide-react'
import Link from "next/link"
import type {DietType, UserRole} from "@/lib/types/database"
import {UserEditDialog} from "./user-edit-dialog"
import {copyUuid} from "@/lib/copyUUID";

interface User {
    id: string
    name: string
    email: string
    image: string | null
    profile: {
        bags_checked: boolean
        attendance: boolean
        diet: DietType
        allergens: string | null
    }
    nfc_link: {
        uuid: string
        scan_count: number
    } | null
    role: {
        name: UserRole
    }
}

export function UsersView() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
    const [copiedUuid, setCopiedUuid] = useState<string | null>(null)

    useEffect(() => {
        getCurrentUserRole().catch(console.error)
        fetchUsers().catch(console.error)
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUsers(users)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredUsers(
                users.filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)),
            )
        }
    }, [searchQuery, users])

    const getCurrentUserRole = async () => {
        try {
            const response = await fetch("/api/auth/validate")
            if (response.ok) {
                const data = await response.json()
                setCurrentUserRole(data.user?.role)
            }
        } catch (error) {
            console.error("Error fetching user role:", error)
        }
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/users")
            const data = await response.json()
            // Filter out non-data users (security, overseer, admin)
            const dataUsers = data.users.filter((user: User) =>
                user.role.name === "user"
            )
            setUsers(dataUsers)
            setFilteredUsers(dataUsers)
        } catch (error) {
            console.error("[WESMUN] Failed to fetch users:", error)
        } finally {
            setLoading(false)
        }
    }



    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )
    }

    const isAdmin = currentUserRole === "admin"

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="container mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="transition-all duration-200 hover:scale-105 active:scale-95">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={fetchUsers}
                        disabled={loading}
                        className="transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
                        Refresh
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>View all registered attendees and their status</CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredUsers.map((user) => (
                                <Card key={user.id}>
                                    <CardContent className="pt-6">
                                        <div
                                            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex items-start gap-3">
                                                {user.image ? (
                                                    <img
                                                        src={user.image || "//wesmun.svg"}
                                                        alt={user.name}
                                                        className="h-12 w-12 rounded-full"
                                                    />
                                                ) : (
                                                    <div
                                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{user.name}</h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            {user.role.name}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>

                                                    <div className="mt-3 flex flex-wrap gap-3">
                                                        {user.role.name !== "admin" && user.role.name !== "security" && user.role.name !== "overseer" ? (
                                                            <>
                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    {user.profile.bags_checked ? (
                                                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                                                    ) : (
                                                                        <XCircle className="h-4 w-4 text-muted-foreground"/>
                                                                    )}
                                                                    <span className="text-muted-foreground">Bags Checked</span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    {user.profile.attendance ? (
                                                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                                                    ) : (
                                                                        <XCircle className="h-4 w-4 text-muted-foreground"/>
                                                                    )}
                                                                    <span className="text-muted-foreground">Attendance</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs">
                                                                No status tracking
                                                            </Badge>
                                                        )}

                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <Utensils className="h-4 w-4 text-muted-foreground"/>
                                                            <span
                                                                className="text-muted-foreground capitalize">{user.profile.diet}</span>
                                                        </div>

                                                        {user.profile.allergens && (
                                                            <div className="flex items-center gap-1.5 text-sm">
                                                                <AlertTriangle className="h-4 w-4 text-orange-600"/>
                                                                <span
                                                                    className="text-muted-foreground">{user.profile.allergens}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {user.nfc_link && (
                                                    <Link href={`/nfc/${user.nfc_link.uuid}`}>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                                                        >
                                                            <Eye className="mr-1 h-4 w-4"/>
                                                            Visit
                                                        </Button>
                                                    </Link>
                                                )}
                                                {isAdmin && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingUser(user)}
                                                        className="transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        <Edit2 className="h-4 w-4"/>
                                                    </Button>
                                                )}
                                                {user.nfc_link && (
                                                    <>
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {user.nfc_link.scan_count} scans
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => copyUuid(user.nfc_link!.uuid, user.id, setCopiedUuid)}
                                                            className="h-7 w-7 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
                                                            title="Copy NFC link"
                                                        >
                                                            <Copy className={`h-3 w-3 ${copiedUuid === user.id ? 'text-green-600' : ''}`}/>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredUsers.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground">No users found matching your
                                    search.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <UserEditDialog
                open={!!editingUser}
                user={editingUser}
                onOpenChange={(open) => !open && setEditingUser(null)}
                onSave={fetchUsers}
            />
        </div>
    )
}
