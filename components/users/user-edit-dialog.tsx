"use client"

import {useEffect, useState} from "react"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Loader2} from 'lucide-react'
import type {DietType, UserRole} from "@/lib/types/database"
import {Textarea} from "@/components/ui/textarea"
import {Alert, AlertDescription} from "@/components/ui/alert"
import type { UserEditDialogProps } from "@/lib/types/ui"

export function UserEditDialog({open, user, onOpenChange, onSave}: UserEditDialogProps) {
    const [diet, setDiet] = useState<DietType>("veg")
    const [bagsChecked, setBagsChecked] = useState(false)
    const [attendance, setAttendance] = useState(false)
    const [receivedFood, setReceivedFood] = useState(false)
    const [role, setRole] = useState<UserRole>("user")
    const [loading, setLoading] = useState(false)
    const [allergens, setAllergens] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    // Check if user has wesmun.com email
    const canChangeRole = user?.email.toLowerCase().endsWith("@wesmun.com") ?? false

    // Update state when user changes
    useEffect(() => {
        if (user) {
            setDiet(user.profile.diet === "veg" ? "veg" : "nonveg")
            setBagsChecked(user.profile.bags_checked ?? false)
            setAttendance(user.profile.attendance ?? false)
            setReceivedFood(user.profile.received_food ?? false)
            setRole(user.role.name)
            setAllergens(user.profile.allergens ?? "")
            setError(null)
        }
    }, [user])

    const handleSave = async () => {
        if (!user) return

        // simple validation
        if (allergens.length > 500) {
            setError("Allergens text is too long (max 500 characters)")
            return
        }

        setLoading(true)
        try {
            const updateData: any = {
                diet,
                bags_checked: bagsChecked,
                attendance,
                received_food: receivedFood,
                allergens // allow empty string to clear
            }

            // Only include role if user has wesmun.com email
            if (canChangeRole) {
                updateData.role = role
            }

            const response = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(updateData)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.error || `Failed to update user (${response.status})`
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(errorMessage)
            }

            onOpenChange(false)
            if (onSave) await onSave()
        } catch (error) {
            console.error("Error updating user:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to update user"
            setError(errorMessage)
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
                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

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

                    {canChangeRole && (
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                                <SelectTrigger id="role">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="overseer">Overseer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Role changes available for @wesmun.com accounts only
                            </p>
                        </div>
                    )}

                    {!canChangeRole && (
                        <div
                            className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-3">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                ⓘ Role changes are restricted to @wesmun.com email accounts
                            </p>
                        </div>
                    )}

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
                        <Label htmlFor="allergens">Allergens {allergens.length > 0 && <span className="text-muted-foreground">({allergens.length}/500)</span>}</Label>
                        <Textarea
                            id="allergens"
                            value={allergens}
                            onChange={(e) => setAllergens(e.target.value)}
                            placeholder="List any allergies (e.g., peanuts, gluten). Leave blank if none."
                            className={error ? "border-red-500" : ""}
                            rows={3}
                        />
                        {error && (
                            <p className="text-xs text-red-600">{error}</p>
                        )}
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

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={receivedFood}
                                onChange={(e) => setReceivedFood(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <span>Received Food</span>
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
