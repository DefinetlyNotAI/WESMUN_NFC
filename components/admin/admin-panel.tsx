// noinspection ExceptionCaughtLocallyJS

"use client"

import React, {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {ArrowLeft, Loader2, RefreshCw} from 'lucide-react'
import Link from "next/link"
import type {DietType, UserRole} from "@/lib/types/database"
import {PendingApprovals} from "./pending-approvals"
import {SecurityCreateUsers} from "./security-create-users"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {UserEditDialog} from "../users/user-edit-dialog"
import {UserManagementSection} from "@/components/admin/user-management";
import {Alert, AlertDescription} from "@/components/ui/alert"

interface User {
    id: string
    name: string
    email: string
    image: string | null
    profile: {
        bags_checked: boolean
        attendance: boolean
        received_food: boolean
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

export function AdminPanel() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

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
        try {
            setLoading(true)
            const response = await fetch("/api/users")
            if (!response.ok) throw new Error("Failed to fetch users")
            const data = await response.json()
            setUsers(data.users)
            setFilteredUsers(data.users)
        } catch (error) {
            console.error("[WESMUN] Fetch users error:", error)
        } finally {
            setLoading(false)
        }
    }

    const updateUserRole = async (userId: string, newRole: UserRole, username?: string) => {
        if (username === EMERGENCY_ADMIN) {
            setError("Cannot change the role of the emergency admin.")
            return
        }
        setUpdating(userId)
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({role: newRole}),
            })
            if (!response.ok) throw new Error("Failed to update role")
            await fetchUsers()
        } catch (error) {
            console.error("Update error:", error)
            setError("Failed to update user")
        } finally {
            setUpdating(null)
        }
    }

    const createNfcLink = async (userId: string) => {
        setUpdating(userId)
        try {
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
        } catch (error) {
            console.error("NFC create error:", error)
            setError("Failed to create NFC link")
        } finally {
            setUpdating(null)
        }
    }

    const deleteUser = async (userId: string, role?: UserRole) => {
        if (role === "admin") {
            setError("Cannot delete an admin user.")
            return
        }
        if (!confirm("Are you sure you want to delete this user?")) return
        setUpdating(userId)
        try {
            const response = await fetch(`/api/users/${userId}`, {method: "DELETE"})
            if (!response.ok) throw new Error("Failed to delete user")
            await fetchUsers()
        } catch (error) {
            console.error("Delete error:", error)
            setError("Failed to delete user")
        } finally {
            setUpdating(null)
        }
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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link href="/">
                        <Button variant="ghost" size="sm"
                                className="transition-all duration-200 hover:scale-105 active:scale-95">
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

                {error && (
                    <div className="mb-2">
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                )}

                <Tabs defaultValue="manage-users" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-auto">
                        <TabsTrigger value="manage-users" className="text-xs sm:text-sm px-2 py-2">
                            <span className="hidden sm:inline">Manage Delegates</span>
                            <span className="sm:hidden">Manage</span>
                        </TabsTrigger>
                        <TabsTrigger value="add-users" className="text-xs sm:text-sm px-2 py-2">
                            <span className="hidden sm:inline">Add Delegates</span>
                            <span className="sm:hidden">Add</span>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 py-2">
                            <span className="hidden sm:inline">Check requested signups</span>
                            <span className="sm:hidden">Requests</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manage-users">
                        <UserManagementSection
                            filteredUsers={filteredUsers}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            updating={updating}
                            copiedUuid={copiedUuid}
                            setCopiedUuid={setCopiedUuid}
                            fetchUsers={fetchUsers}
                            updateUserRole={updateUserRole}
                            createNfcLink={createNfcLink}
                            deleteUser={deleteUser}
                        />
                    </TabsContent>

                    <TabsContent value="pending">
                        <PendingApprovals/>
                    </TabsContent>

                    <TabsContent value="add-users">
                        <SecurityCreateUsers/>
                    </TabsContent>
                </Tabs>

                <UserEditDialog
                    open={!!editingUser}
                    user={editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    onSave={fetchUsers}
                />
            </div>
        </div>
    )
}
