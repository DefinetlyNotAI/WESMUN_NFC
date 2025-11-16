"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {AlertTriangle, CheckCircle2, Copy, Search, UserPlus, Utensils, XCircle} from "lucide-react"
import React, {useState} from "react"
import {UserEditDialog} from "../users/user-edit-dialog"
import {copyUuid} from "@/lib/copyUUID"
import type {DietType, UserRole} from "@/lib/types/database"
import {UserActions} from "@/components/admin/user-action";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"

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

interface Props {
    filteredUsers: User[]
    searchQuery: string
    setSearchQuery: (s: string) => void
    updating: string | null
    copiedUuid: string | null
    setCopiedUuid: React.Dispatch<React.SetStateAction<string | null>>
    fetchUsers: () => Promise<void>
    updateUserRole: (id: string, role: UserRole, username?: string) => Promise<void>
    createNfcLink: (id: string) => Promise<void>
    deleteUser: (id: string, role?: UserRole) => Promise<void>
}

interface StatusIconProps {
    active: boolean
    activeLabel: string
    inactiveLabel: string
}

const StatusIcon: React.FC<StatusIconProps> = ({active, activeLabel, inactiveLabel}) => (
    <div className="flex items-center gap-2">
        {active ? (
            <CheckCircle2 className="h-4 w-4 text-green-600"/>
        ) : (
            <XCircle className="h-4 w-4 text-muted-foreground"/>
        )}
        <span className="text-xs text-muted-foreground">{active ? activeLabel : inactiveLabel}</span>
    </div>
)

export function UserManagementSection(props: Props) {
    const {
        filteredUsers,
        searchQuery,
        setSearchQuery,
        updating,
        copiedUuid,
        setCopiedUuid,
        fetchUsers,
        updateUserRole,
        createNfcLink,
        deleteUser
    } = props

    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkEditing, setBulkEditing] = useState(false)
    const [bulkLoading, setBulkLoading] = useState(false)
    const [bulkDiet, setBulkDiet] = useState<DietType | "unchanged">("unchanged")
    const [bulkBags, setBulkBags] = useState<boolean | "mixed">("mixed")
    const [bulkAttendance, setBulkAttendance] = useState<boolean | "mixed">("mixed")
    const [bulkAllergens, setBulkAllergens] = useState<string>("")
    const [bulkValidation, setBulkValidation] = useState<{
        error: string | null
        success: string | null
        fieldErrors: Record<string, string>
    }>({error: null, success: null, fieldErrors: {}})
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [bulkDeleteResult, setBulkDeleteResult] = useState<null | {deleted: number; missing: number; forbidden: number}>(null)

    const EMERGENCY_ADMIN = process.env.EMERGENCY_ADMIN_USERNAME

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }
    const selectAllUsers = () => {
        // Only select users with role 'user', not admin/security/overseer
        const userOnlyIds = filteredUsers
            .filter(u => u.role.name === 'user')
            .map(u => u.id)
        setSelectedIds(new Set(userOnlyIds))
    }
    const clearSelection = () => setSelectedIds(new Set())

    const performBulkUpdate = async () => {
        if (selectedIds.size === 0) return

        // Reset validation
        setBulkValidation({error: null, success: null, fieldErrors: {}})

        // Validate at least one field is changed
        const hasChanges = bulkDiet !== "unchanged" || bulkBags !== "mixed" || bulkAttendance !== "mixed" || bulkAllergens.trim() !== ""
        if (!hasChanges) {
            setBulkValidation({
                error: "Please select at least one field to update",
                success: null,
                fieldErrors: {}
            })
            return
        }

        // Validate allergens length if provided
        const fieldErrors: Record<string, string> = {}
        if (bulkAllergens.trim().length > 500) {
            fieldErrors.allergens = "Allergens text is too long (max 500 characters)"
        }

        if (Object.keys(fieldErrors).length > 0) {
            setBulkValidation({error: null, success: null, fieldErrors})
            return
        }

        setBulkLoading(true)
        try {
            const body: any = {userIds: Array.from(selectedIds)}
            if (bulkDiet !== "unchanged") body.diet = bulkDiet
            if (bulkBags !== "mixed") body.bags_checked = bulkBags
            if (bulkAttendance !== "mixed") body.attendance = bulkAttendance
            if (bulkAllergens.trim() !== "") body.allergens = bulkAllergens.trim()

            const res = await fetch('/api/users/bulk-update', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setBulkValidation({
                    error: data.error || 'Bulk update failed',
                    success: null,
                    fieldErrors: {}
                })
            } else {
                setBulkValidation({
                    error: null,
                    success: `Successfully updated ${data.updated} user(s)${data.missing?.length ? ` (${data.missing.length} not found)` : ''}`,
                    fieldErrors: {}
                })
                // Reset form after 2 seconds
                setTimeout(() => {
                    setBulkEditing(false)
                    clearSelection()
                    setBulkValidation({error: null, success: null, fieldErrors: {}})
                }, 2000)
                await fetchUsers()
            }
        } catch (e) {
            console.error(e)
            setBulkValidation({
                error: 'Network error occurred',
                success: null,
                fieldErrors: {}
            })
        } finally {
            setBulkLoading(false)
        }
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users, roles, and NFC links</CardDescription>

                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {selectedIds.size > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setBulkEditing(true)}>Bulk Edit ({selectedIds.size})</Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { if (!bulkDeleteLoading) { setBulkDeleteResult(null); setBulkDeleteOpen(true) } }}
                            disabled={bulkDeleteLoading}
                        >{bulkDeleteLoading ? 'Deleting...' : 'Bulk Delete'}</Button>
                        <Button variant="outline" size="sm" onClick={selectAllUsers}>Select All</Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[36px]">{/* Select */}</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>NFC Link</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(user => {
                                const isEmergencyAdmin =
                                    user.email === EMERGENCY_ADMIN || user.name === "Emergency Admin"

                                const isAdmin = user.role.name === "admin"
                                const isWesmunEmail = user.email.toLowerCase().endsWith("@wesmun.com")
                                const canChangeRole = isWesmunEmail && !isEmergencyAdmin

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            {user.role.name === 'user' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(user.id)}
                                                    onChange={() => toggleSelect(user.id)}
                                                    className="h-4 w-4 cursor-pointer"
                                                    title="Select for bulk edit"
                                                />
                                            ) : (
                                                <span className="inline-block w-4" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.image ? (
                                                    <img src={user.image || "/wesmun.svg"} alt={user.name} className="h-8 w-8 rounded-full"/>
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
                                                onValueChange={value =>
                                                    updateUserRole(user.id, value as UserRole, user.name)
                                                }
                                                disabled={updating === user.id || !canChangeRole}
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

                                            {!canChangeRole && !isEmergencyAdmin && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    @wesmun.com accounts only are allowed positions
                                                </p>
                                            )}

                                            {isEmergencyAdmin && (
                                                <p className="text-xs text-orange-600 mt-1">Emergency Admin Status
                                                    cannot be revoked</p>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {user.role.name !== "admin" &&
                                            user.role.name !== "security" &&
                                            user.role.name !== "overseer" ? (
                                                <div className="space-y-2">
                                                    <div className="flex gap-3">
                                                        <StatusIcon
                                                            active={user.profile.bags_checked}
                                                            activeLabel="Bags"
                                                            inactiveLabel="No Bags"
                                                        />
                                                        <StatusIcon
                                                            active={user.profile.attendance}
                                                            activeLabel="Attendance"
                                                            inactiveLabel="No Attendance"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <Utensils className="h-3 w-3 text-muted-foreground"/>
                                                        <Badge
                                                            variant={
                                                                user.profile.diet === "veg"
                                                                    ? "secondary"
                                                                    : "outline"
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {user.profile.diet === "veg"
                                                                ? "Veg"
                                                                : "Non-Veg"}
                                                        </Badge>

                                                        {user.profile.allergens && (
                                                            <><
                                                                AlertTriangle className="h-4 w-4 text-orange-600"/>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Delegate has allergens
                                                                </Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    No status tracking
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {user.role.name === "admin" ||
                                            user.role.name === "security" ||
                                            user.role.name === "overseer" ? (
                                                <span className="text-sm text-muted-foreground">
                                                    WESMUN Staff have no NFC links
                                                </span>
                                            ) : user.nfc_link && user.nfc_link.uuid ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {user.nfc_link.scan_count} scans
                                                    </Badge>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            copyUuid(
                                                                user.nfc_link!.uuid,
                                                                user.id,
                                                                setCopiedUuid
                                                            )
                                                        }
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <Copy
                                                            className={
                                                                "h-3 w-3 " +
                                                                (copiedUuid === user.id
                                                                    ? "text-green-600"
                                                                    : "")
                                                            }
                                                        />
                                                    </Button>
                                                </div>
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
                                            <UserActions
                                                user={user}
                                                updating={updating}
                                                isAdmin={isAdmin}
                                                isEmergencyAdmin={isEmergencyAdmin}
                                                setEditingUser={setEditingUser}
                                                deleteUser={deleteUser}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>

                <UserEditDialog
                    open={!!editingUser}
                    user={editingUser}
                    onOpenChange={open => !open && setEditingUser(null)}
                    onSave={fetchUsers}
                />
            </CardContent>
        </Card>

        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditing} onOpenChange={(open)=>{
            setBulkEditing(open);
            if (!open) setBulkValidation({error: null, success: null, fieldErrors: {}})
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Edit ({selectedIds.size})</DialogTitle>
                    <DialogDescription>
                        Apply the following changes to {selectedIds.size} selected user{selectedIds.size === 1 ? '' : 's'}.
                    </DialogDescription>
                </DialogHeader>

                {bulkValidation.error && (
                    <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 p-3">
                        <p className="text-sm text-red-600 dark:text-red-400">{bulkValidation.error}</p>
                    </div>
                )}

                {bulkValidation.success && (
                    <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 p-3">
                        <p className="text-sm text-green-600 dark:text-green-400">✓ {bulkValidation.success}</p>
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="text-xs font-medium">Diet</label>
                        <Select value={bulkDiet} onValueChange={(v) => setBulkDiet(v as DietType | "unchanged")}>
                            <SelectTrigger><SelectValue placeholder="Leave unchanged"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unchanged">(Unchanged)</SelectItem>
                                <SelectItem value="veg">Vegetarian</SelectItem>
                                <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                            </SelectContent>
                        </Select>
                        {bulkValidation.fieldErrors.diet && (
                            <p className="text-xs text-red-600 mt-1">{bulkValidation.fieldErrors.diet}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-medium">Bags Checked</label>
                        <Select value={bulkBags === 'mixed' ? 'mixed' : (bulkBags ? 'true' : 'false')}
                                onValueChange={(v) => setBulkBags(v === 'mixed' ? 'mixed' : v === 'true')}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mixed">(Unchanged)</SelectItem>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                        </Select>
                        {bulkValidation.fieldErrors.bags_checked && (
                            <p className="text-xs text-red-600 mt-1">{bulkValidation.fieldErrors.bags_checked}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-medium">Attendance</label>
                        <Select
                            value={bulkAttendance === 'mixed' ? 'mixed' : (bulkAttendance ? 'true' : 'false')}
                            onValueChange={(v) => setBulkAttendance(v === 'mixed' ? 'mixed' : v === 'true')}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mixed">(Unchanged)</SelectItem>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                        </Select>
                        {bulkValidation.fieldErrors.attendance && (
                            <p className="text-xs text-red-600 mt-1">{bulkValidation.fieldErrors.attendance}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-medium">Allergens {bulkAllergens.length > 0 &&
                            <span className="text-muted-foreground">({bulkAllergens.length}/500)</span>}</label>
                        <Input
                            value={bulkAllergens}
                            onChange={e => setBulkAllergens(e.target.value)}
                            placeholder="Leave blank to keep"
                            className={bulkValidation.fieldErrors.allergens ? "border-red-500" : ""}
                        />
                        {bulkValidation.fieldErrors.allergens && (
                            <p className="text-xs text-red-600 mt-1">{bulkValidation.fieldErrors.allergens}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        setBulkEditing(false);
                        setBulkValidation({error: null, success: null, fieldErrors: {}})
                    }} disabled={bulkLoading}>Cancel</Button>
                    <Button size="sm" onClick={performBulkUpdate} disabled={bulkLoading || selectedIds.size === 0}>
                        {bulkLoading ? 'Updating...' : `Apply Changes to ${selectedIds.size}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!bulkDeleteLoading) setBulkDeleteOpen(open) }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{bulkDeleteResult ? 'Bulk Delete Result' : `Confirm Bulk Delete (${selectedIds.size})`}</DialogTitle>
                    <DialogDescription>
                        {bulkDeleteResult ? (
                            <>Operation completed. Review the summary below.</>
                        ) : (
                            <>You are about to permanently delete {selectedIds.size} selected user{selectedIds.size === 1 ? '' : 's'}. This action cannot be undone.</>
                        )}
                    </DialogDescription>
                </DialogHeader>
                {bulkDeleteResult ? (
                    <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                            <p><strong>Deleted:</strong> {bulkDeleteResult.deleted}</p>
                            <p><strong>Forbidden (skipped):</strong> {bulkDeleteResult.forbidden}</p>
                            <p><strong>Missing:</strong> {bulkDeleteResult.missing}</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => { setBulkDeleteOpen(false); }}>{'Close'}</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-md border p-3 text-xs text-muted-foreground">
                            <p>Only regular <strong>user</strong> role accounts will be deleted. Admin, security, overseer, and emergency admin account's are automatically skipped.</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setBulkDeleteOpen(false)}
                                disabled={bulkDeleteLoading}
                            >Cancel</Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={bulkDeleteLoading || selectedIds.size === 0}
                                onClick={async () => {
                                    setBulkDeleteLoading(true)
                                    try {
                                        const res = await fetch('/api/users/bulk-delete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userIds: Array.from(selectedIds) })
                                        })
                                        const data = await res.json().catch(()=>({}))
                                        if (!res.ok) {
                                            setBulkDeleteResult({deleted: 0, forbidden: 0, missing: 0})
                                            console.error('[BulkDelete] failed:', data.error)
                                        } else {
                                            setBulkDeleteResult({
                                                deleted: data.deleted || 0,
                                                forbidden: (data.forbidden?.length) || 0,
                                                missing: (data.missing?.length) || 0
                                            })
                                            clearSelection()
                                            await fetchUsers()
                                        }
                                    } catch (e) {
                                        console.error(e)
                                        setBulkDeleteResult({deleted: 0, forbidden: 0, missing: 0})
                                    } finally {
                                        setBulkDeleteLoading(false)
                                    }
                                }}
                            >{bulkDeleteLoading ? 'Deleting...' : 'Confirm Delete'}</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
        </>
    )
}
