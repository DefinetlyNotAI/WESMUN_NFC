"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertTriangle, CheckCircle2, Copy, Loader2, User, Utensils, XCircle} from 'lucide-react'
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import type {DietType} from "@/lib/types/database"
import type { UserData, NfcScanViewProps } from "@/lib/types/ui"

export function NfcScanView({uuid, userRole}: NfcScanViewProps) {
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [updating, setUpdating] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetchUserData().catch(console.error)
    }, [uuid])

    const fetchUserData = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/nfc/${uuid}`)

            if (response.status === 404) {
                setError("NFC UUID not found. Please check the code and try again.")
                setUserData(null)
                return
            }

            if (response.status === 204) {
                setError("Unauthorized access")
                setUserData(null)
                return
            }

            if (response.status === 307) {
                const data = await response.json()
                if (data.redirect && data.correctUuid) {
                    window.location.href = `/nfc/${data.correctUuid}`
                    return
                }
            }

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || "Failed to fetch user data")
                setUserData(null)
                return
            }

            const data = await response.json()
            setUserData(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred while fetching user data")
            setUserData(null)
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (field: "bags_checked" | "attendance", value: boolean) => {
        if (!userData) return

        setUpdating(true)
        try {
            const response = await fetch(`/api/nfc/${uuid}/update`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({[field]: value}),
            })
            if (!response.ok) {
                const error = await response.json()
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(error.error || "Failed to update")
            }

            // Update local state
            setUserData({
                ...userData,
                profile: {
                    ...userData.profile,
                    [field]: value,
                },
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile")
        } finally {
            setUpdating(false)
        }
    }

    const updateDiet = async (value: DietType) => {
        if (!userData) return

        setUpdating(true)
        try {
            const response = await fetch(`/api/nfc/${uuid}/update`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({diet: value}),
            })
            if (!response.ok) {
                const error = await response.json()
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(error.error || "Failed to update diet")
            }

            // Update local state
            setUserData({
                ...userData,
                profile: {
                    ...userData.profile,
                    diet: value,
                },
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update diet")
        } finally {
            setUpdating(false)
        }
    }

    const copyUUID = () => {
        navigator.clipboard.writeText(uuid).catch(console.error)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )
    }

    if (error || !userData) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <XCircle className="h-4 w-4"/>
                    <AlertDescription>{error || "User not found"}</AlertDescription>
                </Alert>
            </div>
        )
    }

    const canUpdateBags = userRole === "security" || userRole === "admin"
    const canUpdateAttendance = userRole === "security" || userRole === "admin"
    const canUpdateDiet = userRole === "admin"

    return (
        <div className="min-h-screen bg-muted/30 p-2 sm:p-4">
            <div className="mx-auto max-w-2xl space-y-4 px-2 sm:px-0">
                <Card>
                    <CardHeader className="px-4 sm:px-6">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {userData.user.image ? (
                                    <img
                                        src={userData.user.image || "//wesmun.svg"}
                                        alt={userData.user.name}
                                        className="h-12 w-12 rounded-full flex-shrink-0"
                                    />
                                ) : (
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                                        <User className="h-6 w-6"/>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="break-words text-lg sm:text-xl">{userData.user.name}</CardTitle>
                                    <CardDescription className="break-all text-sm">{userData.user.email}</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="flex-shrink-0">{userData.user.role.name}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Indicators */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-lg border p-4">
                                {userData.profile.bags_checked ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600"/>
                                ) : (
                                    <XCircle className="h-5 w-5 text-muted-foreground"/>
                                )}
                                <div>
                                    <p className="text-sm font-medium">Bags Checked</p>
                                    <p className="text-xs text-muted-foreground">
                                        {userData.profile.bags_checked ? "Completed" : "Pending"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border p-4">
                                {userData.profile.attendance ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600"/>
                                ) : (
                                    <XCircle className="h-5 w-5 text-muted-foreground"/>
                                )}
                                <div>
                                    <p className="text-sm font-medium">Attendance</p>
                                    <p className="text-xs text-muted-foreground">
                                        {userData.profile.attendance ? "Marked" : "Not marked"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Diet and Allergens */}
                        <div className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Utensils className="h-4 w-4 text-muted-foreground"/>
                                <span className="text-sm font-medium">Diet:</span>
                                {canUpdateDiet ? (
                                    <Select
                                        value={userData.profile.diet}
                                        onValueChange={(value) => updateDiet(value as DietType)}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="w-40 h-7">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="veg">Vegetarian</SelectItem>
                                            <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={userData.profile.diet === "veg" ? "secondary" : "outline"}>
                                        {userData.profile.diet === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                                    </Badge>
                                )}
                            </div>

                            {userData.profile.allergens && (
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-600"/>
                                    <div>
                                        <span className="text-sm font-medium">Allergens:</span>
                                        <p className="text-sm text-muted-foreground">{userData.profile.allergens}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Update Controls for Security/Admin */}
                        {(canUpdateBags || canUpdateAttendance) && (
                            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm font-medium">Quick Actions</p>

                                {canUpdateBags && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="bags"
                                            checked={userData.profile.bags_checked}
                                            onCheckedChange={(checked) => updateProfile("bags_checked", checked as boolean)}
                                            disabled={updating}
                                        />
                                        <Label htmlFor="bags" className="cursor-pointer text-sm">
                                            Mark bags as checked
                                        </Label>
                                    </div>
                                )}

                                {canUpdateAttendance && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="attendance"
                                            checked={userData.profile.attendance}
                                            onCheckedChange={(checked) => updateProfile("attendance", checked as boolean)}
                                            disabled={updating}
                                        />
                                        <Label htmlFor="attendance" className="cursor-pointer text-sm">
                                            Mark attendance
                                        </Label>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* UUID Copy Button */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="text-sm font-medium">NFC UUID</p>
                                <p className="text-xs text-muted-foreground font-mono break-all">{uuid}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyUUID}
                                className="transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Copy className={`h-3 w-3 transition-colors ${copied ? 'text-green-600' : ''}`}/>
                            </Button>
                        </div>

                        {/* Scan Info */}
                        <div className="text-center text-xs text-muted-foreground">
                            Scanned {userData.nfc_link.scan_count} times
                            {userData.nfc_link.last_scanned_at && (
                                <> • Last scan: {new Date(userData.nfc_link.last_scanned_at).toLocaleString()}</>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
