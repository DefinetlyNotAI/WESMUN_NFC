"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {CheckCircle2, Copy, Edit2, Search, Trash2, UserPlus, Utensils, XCircle} from "lucide-react"
import React, {useState} from "react"
import {UserEditDialog} from "../users/user-edit-dialog"
import {copyUuid} from "@/lib/copyUUID"
import type {DietType, UserRole} from "@/lib/types/database"

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

    const EMERGENCY_ADMIN = process.env.EMERGENCY_ADMIN_USERNAME

    return (
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
                            {filteredUsers.map(user => {
                                const isEmergencyAdmin =
                                    user.email === EMERGENCY_ADMIN || user.name === "Emergency Admin"

                                const isAdmin = user.role.name === "admin"
                                const isWesmunEmail = user.email.toLowerCase().endsWith("@wesmun.com")
                                const canChangeRole = isWesmunEmail && !isEmergencyAdmin

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
                                                    @wesmun.com accounts only
                                                </p>
                                            )}

                                            {isEmergencyAdmin && (
                                                <p className="text-xs text-orange-600 mt-1">Emergency Admin</p>
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
                                                    WESMUN Staff, Unscannable
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
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingUser(user)}
                                                    disabled={updating === user.id || isEmergencyAdmin}
                                                >
                                                    <Edit2 className="h-4 w-4"/>
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteUser(user.id, user.role.name)}
                                                    disabled={updating === user.id || isAdmin || isEmergencyAdmin}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
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
    )
}
