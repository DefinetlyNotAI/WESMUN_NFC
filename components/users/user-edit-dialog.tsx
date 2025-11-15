"use client"

import {useState} from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import type {DietType, UserRole} from "@/lib/types/database"

interface User {
    id: string
    name: string
    email: string
    profile: {
        bags_checked: boolean
        attendance: boolean
        diet: DietType
        allergens: string | null
    }
    role: {
        name: UserRole
    }
}

interface UserEditDialogProps {
    open: boolean
    user: User | null
    onOpenChange: (open: boolean) => void
    onSave?: () => Promise<void>
}

export function UserEditDialog({open, user, onOpenChange, onSave}: UserEditDialogProps) {
    const [diet, setDiet] = useState<DietType>(user?.profile.diet === "veg" ? "veg" : "nonveg")
    const [bagsChecked, setBagsChecked] = useState(user?.profile.bags_checked ?? false)
    const [attendance, setAttendance] = useState(user?.profile.attendance ?? false)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!user) return

        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    diet,
                    bags_checked: bagsChecked,
                    attendance
                })
            })

            if (!response.ok) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("Failed to update user")
            }

            onOpenChange(false)
            if (onSave) await onSave()
        } catch (error) {
            console.error("Error updating user:", error)
            alert("Failed to update user")
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Modify {user.name}'s information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* User Info */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">User Info</Label>
                        <div className="rounded-lg border p-3 bg-muted/50">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <div className="mt-2">
                                <Badge variant="outline">{user.role.name}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="diet">Diet Preference</Label>
                        <Select value={diet} onValueChange={(value) => setDiet(value as DietType)}>
                            <SelectTrigger id="diet">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="veg">Vegetarian</SelectItem>
                                <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={bagsChecked}
                                onChange={(e) => setBagsChecked(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span>Bags Checked</span>
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={attendance}
                                onChange={(e) => setAttendance(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span>Attendance Marked</span>
                        </Label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
