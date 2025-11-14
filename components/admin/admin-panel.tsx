"use client"

import React, {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {ArrowLeft, CheckCircle2, Loader2, Trash2, UserPlus, XCircle} from "lucide-react"
import Link from "next/link"
import type {UserRole} from "@/lib/types/database"
import {PendingApprovals} from "./pending-approvals"

interface User {
    id: string
    name: string
    email: string
    image: string | null
    profile: {
        bags_checked: boolean
        attendance: boolean
        diet: string
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

interface StatusIconProps {
    active: boolean
    activeLabel: string
    inactiveLabel: string
}

const StatusIcon: React.FC<StatusIconProps> = ({ active, activeLabel, inactiveLabel }) => (
    <span title={active ? activeLabel : inactiveLabel}>
    {active ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
    )}
  </span>
)


export function AdminPanel() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers().catch(console.error)
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error("Failed to fetch users")
        const data = await response.json()
        setUsers(data.users)
        setLoading(false)
    }

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        setUpdating(userId)
        const response = await fetch(`/api/users/${userId}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({role: newRole}),
        })
        if (!response.ok) throw new Error("Failed to update role")
        await fetchUsers()
        setUpdating(null)
    }

    const createNfcLink = async (userId: string) => {
        setUpdating(userId)
        const response = await fetch("/api/nfc-links", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({userId}),
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to create NFC link")
        }
        await fetchUsers()
        setUpdating(null)
    }

    const deleteUser = async (userId: string) => {
        setUpdating(userId)
        const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete user")
        await fetchUsers()
        setUpdating(null)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="container mx-auto max-w-7xl space-y-4">
                <Link href="/">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to Dashboard
                    </Button>
                </Link>

                <PendingApprovals/>

                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage users, roles, and NFC links</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>NFC Link</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image || "/wesmun.svg"}
                                                            alt={user.name}
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role.name}
                                                    onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                                                    disabled={updating === user.id}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="user">User</SelectItem>
                                                        <SelectItem value="security">Security</SelectItem>
                                                        <SelectItem value="overseer">Overseer</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <StatusIcon
                                                        active={user.profile.bags_checked}
                                                        activeLabel="Bags checked"
                                                        inactiveLabel="Bags not checked"
                                                    />
                                                    <StatusIcon
                                                        active={user.profile.attendance}
                                                        activeLabel="Attendance marked"
                                                        inactiveLabel="Attendance not marked"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.nfc_link ? (
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {user.nfc_link.scan_count} scans
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => createNfcLink(user.id)}
                                                        disabled={updating === user.id}
                                                    >
                                                        <UserPlus className="mr-1 h-3 w-3"/>
                                                        Create
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteUser(user.id)}
                                                    disabled={updating === user.id}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
