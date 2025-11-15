"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle2, Loader2, Trash2, UserPlus, XCircle, Search, Edit2 } from 'lucide-react'
import Link from "next/link"
import type { UserRole } from "@/lib/types/database"
import { PendingApprovals } from "./pending-approvals"
import { SecurityCreateUsers } from "./security-create-users"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
    <div className="flex items-center gap-2">
        {active ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
            <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{active ? activeLabel : inactiveLabel}</span>
    </div>
)

export function AdminPanel() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editRole, setEditRole] = useState<UserRole>("user")

    const EMERGENCY_ADMIN = process.env.EMERGENCY_ADMIN_USERNAME

    useEffect(() => {
        fetchUsers().catch(console.error)
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUsers(users)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredUsers(
                users.filter(user => 
                    user.name.toLowerCase().includes(query) || 
                    user.email.toLowerCase().includes(query)
                )
            )
        }
    }, [searchQuery, users])

    const fetchUsers = async () => {
        setLoading(true)
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error("Failed to fetch users")
        const data = await response.json()
        setUsers(data.users)
        setFilteredUsers(data.users)
        setLoading(false)
    }

    const updateUserRole = async (userId: string, newRole: UserRole, username?: string) => {
        if (username === EMERGENCY_ADMIN) {
            alert("Cannot change the role of the emergency admin.")
            return
        }
        setUpdating(userId)
        const response = await fetch(`/api/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
        })
        if (!response.ok) throw new Error("Failed to update role")
        await fetchUsers()
        setUpdating(null)
    }

    const createNfcLink = async (userId: string) => {
        setUpdating(userId)
        const response = await fetch("/api/nfc-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to create NFC link")
        }
        await fetchUsers()
        setUpdating(null)
    }

    const deleteUser = async (userId: string, role?: UserRole) => {
        if (role === "admin") {
            alert("Cannot delete an admin user.")
            return
        }
        if (!confirm("Are you sure you want to delete this user?")) return
        setUpdating(userId)
        const response = await fetch(`/api/users/${userId}`, { method: "DELETE" })
        if (!response.ok) throw new Error("Failed to delete user")
        await fetchUsers()
        setUpdating(null)
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setEditRole(user.role.name)
    }

    const saveUserEdit = async () => {
        if (!editingUser) return
        setUpdating(editingUser.id)
        const response = await fetch(`/api/users/${editingUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: editRole }),
        })
        if (!response.ok) throw new Error("Failed to update user")
        await fetchUsers()
        setUpdating(null)
        setEditingUser(null)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="container mx-auto max-w-7xl space-y-4">
                <Link href="/">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        <PendingApprovals />
                    </TabsContent>

                    <TabsContent value="users">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>Manage users, roles, and NFC links</CardDescription>
                                <div className="mt-4 relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
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
                                            {filteredUsers.map((user) => {
                                                const isEmergencyAdmin = user.name === EMERGENCY_ADMIN
                                                const isAdmin = user.role.name === "admin"
                                                return (
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
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
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
                                                                onValueChange={(value) =>
                                                                    updateUserRole(user.id, value as UserRole, user.name)
                                                                }
                                                                disabled={updating === user.id || isEmergencyAdmin}
                                                            >
                                                                <SelectTrigger className="w-32">
                                                                    <SelectValue />
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
                                                            {user.role.name !== "admin" && user.role.name !== "security" && user.role.name !== "overseer" ? (
                                                                <div className="flex gap-3">
                                                                    <StatusIcon
                                                                        active={user.profile.bags_checked}
                                                                        activeLabel="Bags Checked"
                                                                        inactiveLabel="Bags Not Checked"
                                                                    />
                                                                    <StatusIcon
                                                                        active={user.profile.attendance}
                                                                        activeLabel="Attendance"
                                                                        inactiveLabel="No Attendance"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs">No status tracking</Badge>
                                                            )}
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
                                                                    <UserPlus className="mr-1 h-3 w-3" />
                                                                    Create
                                                                </Button>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleEditUser(user)}
                                                                    disabled={updating === user.id || isEmergencyAdmin}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteUser(user.id, user.role.name)}
                                                                    disabled={updating === user.id || isAdmin}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <SecurityCreateUsers />
                    </TabsContent>
                </Tabs>

                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Modify user {editingUser?.name} settings
                            </DialogDescription>
                        </DialogHeader>
                        {editingUser && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Email</p>
                                    <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Select value={editRole} onValueChange={(value) => setEditRole(value as UserRole)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="security">Security</SelectItem>
                                            <SelectItem value="overseer">Overseer</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setEditingUser(null)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={saveUserEdit} disabled={updating === editingUser.id}>
                                        {updating === editingUser.id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
