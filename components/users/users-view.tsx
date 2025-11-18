"use client"

import React, {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Copy,
    Download,
    Edit2,
    Eye,
    Loader2,
    RefreshCw,
    Search,
    Utensils,
    XCircle
} from 'lucide-react'
import Link from "next/link"
import type {UserRole} from "@/lib/types/database"
import {UserEditDialog} from "./user-edit-dialog"
import type {User} from "@/lib/types/ui"
import {copyUuid} from "@/lib/copyUUID"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Label} from "@/components/ui/label"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {cookies} from "next/headers";

export function UsersView() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
    const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
    const [showExportDialog, setShowExportDialog] = useState(false)
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
    const [filterBags, setFilterBags] = useState<string>("all")
    const [filterAttendance, setFilterAttendance] = useState<string>("all")
    const [filterDiet, setFilterDiet] = useState<string>("all")
    const [exportCount, setExportCount] = useState<{ filtered: number, total: number } | null>(null)
    const [exportError, setExportError] = useState<string | null>(null)

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

    // fetch counts when export dialog opens or filters change
    useEffect(() => {
        if (!showExportDialog) return
        const run = async () => {
            const params = new URLSearchParams({format: 'csv', mode: 'count'})
            if (filterBags !== 'all') params.append('bags', filterBags)
            if (filterAttendance !== 'all') params.append('attendance', filterAttendance)
            if (filterDiet !== 'all') params.append('diet', filterDiet)
            const res = await fetch(`/api/users/export?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setExportCount({filtered: data.filtered ?? 0, total: data.total ?? 0})
            } else {
                setExportCount(null)
            }
        }
        run().catch(() => setExportCount(null))
    }, [showExportDialog, filterBags, filterAttendance, filterDiet])

    const getCurrentUserRole = async () => {
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get("session_token")?.value;
            if (!token) {
                console.warn("No token found")
                return
            }

            const response = await fetch("/api/auth/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token })
            })

            if (!response.ok) {
                console.warn("Validation failed", response.status)
                return
            }

            const data = await response.json()
            setCurrentUserRole(data.user?.role)
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

    const downloadExport = async (format: 'csv' | 'pdf') => {
        try {
            const params = new URLSearchParams({format})
            if (filterBags !== "all") params.append("bags", filterBags)
            if (filterAttendance !== "all") params.append("attendance", filterAttendance)
            if (filterDiet !== "all") params.append("diet", filterDiet)

            const res = await fetch(`/api/users/export?${params.toString()}`)
            if (!res.ok) {
                setExportError('Export failed');
                return
            }
            const blob = await res.blob()
            const dateStr = new Date().toISOString().split('T')[0]
            const ext = format === 'csv' ? 'csv' : 'pdf'
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `WESMUN_DELEGATE_DATA_${dateStr}.${ext}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            setShowExportDialog(false)
            setExportError(null)
        } catch (e) {
            console.error(e);
            setExportError('Export error')
        }
    }

    const openExportDialog = (format: 'csv' | 'pdf') => {
        setExportFormat(format)
        setExportError(null)
        setShowExportDialog(true)
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
        <div className="min-h-screen bg-muted/30 p-2 sm:p-4">
            <div className="container mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link href="/" className="flex-shrink-0">
                        <Button variant="ghost" size="sm"
                                className="transition-all duration-200 hover:scale-105 active:scale-95">
                            <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4"/>
                            <span className="hidden xs:inline">Back to Dashboard</span>
                            <span className="xs:hidden">Back</span>
                        </Button>
                    </Link>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchUsers}
                            disabled={loading}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <RefreshCw className={`mr-1 sm:mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openExportDialog('csv')}
                                title="Download CSV">
                            <Download className="mr-1 sm:mr-2 h-4 w-4"/>
                            <span className="hidden sm:inline">CSV</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openExportDialog('pdf')}
                                title="Download PDF">
                            <Download className="mr-1 sm:mr-2 h-4 w-4"/>
                            <span className="hidden sm:inline">PDF</span>
                        </Button>
                    </div>
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
                                                                        <CheckCircle2
                                                                            className="h-4 w-4 text-green-600"/>
                                                                    ) : (
                                                                        <XCircle
                                                                            className="h-4 w-4 text-muted-foreground"/>
                                                                    )}
                                                                    <span
                                                                        className="text-muted-foreground">Bags Checked</span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    {user.profile.attendance ? (
                                                                        <CheckCircle2
                                                                            className="h-4 w-4 text-green-600"/>
                                                                    ) : (
                                                                        <XCircle
                                                                            className="h-4 w-4 text-muted-foreground"/>
                                                                    )}
                                                                    <span
                                                                        className="text-muted-foreground">Attendance</span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    {user.profile.received_food ? (
                                                                        <CheckCircle2
                                                                            className="h-4 w-4 text-green-600"/>
                                                                    ) : (
                                                                        <XCircle
                                                                            className="h-4 w-4 text-muted-foreground"/>
                                                                    )}
                                                                    <span
                                                                        className="text-muted-foreground">Received Food</span>
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
                                                            <>
                                                                <AlertTriangle className="h-4 w-4 text-orange-600"/>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Delegate has allergens
                                                                </Badge>
                                                            </>
                                                        </div>
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
                                                            <Copy
                                                                className={`h-3 w-3 ${copiedUuid === user.id ? 'text-green-600' : ''}`}/>
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

            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Delegate Data ({exportFormat.toUpperCase()})</DialogTitle>
                        <DialogDescription>
                            Filter the export by user attributes (optional)
                        </DialogDescription>
                    </DialogHeader>

                    {exportError && (
                        <div className="mb-2">
                            <Alert variant="destructive">
                                <AlertDescription>{exportError}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bags Checked</Label>
                            <Select value={filterBags} onValueChange={setFilterBags}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All (No Filter)</SelectItem>
                                    <SelectItem value="true">Yes - Bags Checked</SelectItem>
                                    <SelectItem value="false">No - Bags Not Checked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Attendance</Label>
                            <Select value={filterAttendance} onValueChange={setFilterAttendance}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All (No Filter)</SelectItem>
                                    <SelectItem value="true">Yes - Attended</SelectItem>
                                    <SelectItem value="false">No - Not Attended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Diet Preference</Label>
                            <Select value={filterDiet} onValueChange={setFilterDiet}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All (No Filter)</SelectItem>
                                    <SelectItem value="veg">Vegetarian</SelectItem>
                                    <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium mb-1">Export Summary</p>
                            <p className="text-muted-foreground">
                                Format: <span
                                className="font-mono text-xs bg-background px-1 rounded">{exportFormat.toUpperCase()}</span>
                                {filterBags !== "all" && <> •
                                    Bags: {filterBags === "true" ? "Checked" : "Not Checked"}</>}
                                {filterAttendance !== "all" && <> •
                                    Attendance: {filterAttendance === "true" ? "Yes" : "No"}</>}
                                {filterDiet !== "all" && <> •
                                    Diet: {filterDiet === "veg" ? "Vegetarian" : "Non-Vegetarian"}</>}
                                {filterBags === "all" && filterAttendance === "all" && filterDiet === "all" && <> • No
                                    filters applied</>}
                            </p>
                            <p className="text-xs mt-1">
                                {exportCount ? (
                                    <>This export will include <span
                                        className="font-medium">{exportCount.filtered}</span> of <span
                                        className="font-medium">{exportCount.total}</span> approved users.</>
                                ) : (
                                    <>Calculating included users…</>
                                )}
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => downloadExport(exportFormat)} className="flex-1">
                                <Download className="mr-2 h-4 w-4"/>
                                Download {exportFormat.toUpperCase()}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
