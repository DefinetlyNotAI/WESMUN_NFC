"use client"

import React, {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle, CheckCircle2, Copy, Loader2, Plus, Utensils} from 'lucide-react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import type {DietType} from "@/lib/types/database"

interface CreatedUser {
    email: string
    success: boolean
    message: string
    user?: {
        id: string
        email: string
        name: string
        nfcUuid?: string
    }
}

export function SecurityCreateUsers() {
    const [activeTab, setActiveTab] = useState("single")
    const [singleEmail, setSingleEmail] = useState("")
    const [singleName, setSingleName] = useState("")
    const [singleDiet, setSingleDiet] = useState<DietType>("nonveg")
    const [singleAllergens, setSingleAllergens] = useState<string>("")
    const [bulkData, setBulkData] = useState("")
    const [loading, setLoading] = useState(false)
    const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([])
    const [error, setError] = useState("")
    const [copied, setCopied] = useState<string | null>(null)

    const validateEmail = (email: string): string | null => {
        if (!email) return "Email is required"
        if (!email.includes("@")) return "Invalid email format"
        if (!email.includes(".")) return "Invalid email domain"
        return null
    }

    const validateName = (name: string): string | null => {
        if (!name || !name.trim()) return "Name is required"
        if (name.trim().length < 2) return "Name must be at least 2 characters"
        return null
    }

    const createSingleUser = async () => {
        const emailError = validateEmail(singleEmail)
        const nameError = validateName(singleName)

        if (emailError || nameError) {
            setError(emailError || nameError || "Invalid input")
            return
        }

        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/users/create-data-only", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    email: singleEmail.trim(),
                    name: singleName.trim(),
                    diet: singleDiet,
                    allergens: singleAllergens.trim() || null,
                })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || data.message || "Failed to create user")
                return
            }

            setCreatedUsers([{
                email: singleEmail,
                success: true,
                message: data.message,
                user: data.user
            }])
            setSingleEmail("")
            setSingleName("")
            setSingleDiet("nonveg")
            setSingleAllergens("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    const createBulkUsers = async () => {
        if (!bulkData.trim()) {
            setError("Please enter CSV data (email,name format)")
            return
        }

        const users = bulkData
            .split("\n")
            .filter(line => line.trim())
            .map(line => {
                const [email, name] = line.split(",").map(s => s.trim())
                return {email, name}
            })
            .filter(u => u.email && u.name)

        const invalidUsers: string[] = []
        users.forEach((u, idx) => {
            const emailErr = validateEmail(u.email)
            const nameErr = validateName(u.name)
            if (emailErr || nameErr) {
                invalidUsers.push(`Row ${idx + 1}: ${emailErr || nameErr}`)
            }
        })

        if (invalidUsers.length > 0) {
            setError(`Validation errors:\n${invalidUsers.join("\n")}`)
            return
        }

        if (users.length === 0) {
            setError("No valid users found in CSV")
            return
        }

        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/users/create-data-only/bulk", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({users})
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || data.message || "Failed to create users")
                return
            }

            setCreatedUsers(data.results)
            setBulkData("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).catch(console.error)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Users</CardTitle>
                    <CardDescription>Create data-only user accounts for attendees. These users cannot sign in but their
                        data will be tracked.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="single">Single User</TabsTrigger>
                            <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="single" className="space-y-4">
                            <div className="grid gap-4">
                                {/* email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="single-email">Email Address</Label>
                                    <Input
                                        id="single-email"
                                        placeholder="user@example.com"
                                        type="email"
                                        value={singleEmail}
                                        onChange={(e) => setSingleEmail(e.target.value)}
                                        aria-invalid={error ? "true" : "false"}
                                    />
                                </div>

                                {/* name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="single-name">Full Name</Label>
                                    <Input
                                        id="single-name"
                                        placeholder="John Doe"
                                        value={singleName}
                                        onChange={(e) => setSingleName(e.target.value)}
                                        aria-invalid={error ? "true" : "false"}
                                    />
                                </div>

                                {/* diet selector */}
                                <div className="grid gap-2">
                                    <Label htmlFor="single-diet" className="flex items-center gap-2">
                                        <Utensils className="h-4 w-4"/>
                                        Diet Preference
                                    </Label>
                                    <Select value={singleDiet}
                                            onValueChange={(value) => setSingleDiet(value as DietType)}>
                                        <SelectTrigger id="single-diet">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nonveg">Non-Vegetarian (Default)</SelectItem>
                                            <SelectItem value="veg">Vegetarian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* allergens */}
                                <div className="grid gap-2">
                                    <Label htmlFor="single-allergens" className="flex items-center gap-2">
                                        <Utensils className="h-4 w-4"/>
                                        Allergens (optional)
                                    </Label>
                                    <Textarea
                                        id="single-allergens"
                                        placeholder="Peanuts, dairy, gluten, etc."
                                        value={singleAllergens}
                                        onChange={(e) => setSingleAllergens(e.target.value)}
                                        rows={3}
                                        aria-invalid={error ? "true" : "false"}
                                    />
                                </div>

                                {/* submit button */}
                                <Button onClick={createSingleUser} disabled={loading}
                                        className="transition-all duration-200 hover:scale-105 active:scale-95">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4"/>
                                            Create User
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="bulk" className="space-y-4">
                            <Textarea
                                id="bulk-data"
                                placeholder={`user1@example.com, John Doe
user2@example.com, Jane Smith`}
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                                rows={6}
                                aria-invalid={error ? "true" : "false"}
                            />
                            <Button onClick={createBulkUsers} disabled={loading}
                                    className="transition-all duration-200 hover:scale-105 active:scale-95">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Create Users
                                    </>
                                )}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {createdUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Created Users</CardTitle>
                        <CardDescription>Share the NFC link with security to add to cards</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {createdUsers.map((result, idx) => (
                                <div key={idx} className="flex items-start justify-between gap-4 p-3 border rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {result.success ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0"/>
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0"/>
                                            )}
                                            <span className="font-medium text-sm">{result.email}</span>
                                        </div>
                                        {result.user && (
                                            <div className="text-xs text-muted-foreground mt-1 break-all font-mono">
                                                Link: {`${typeof window !== 'undefined' ? window.location.origin : ''}/nfc/${result.user.nfcUuid}`}
                                            </div>
                                        )}
                                    </div>
                                    {result.user?.nfcUuid && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/nfc/${result.user?.nfcUuid}`
                                                copyToClipboard(link, result.user?.nfcUuid || "No UUID Associated with user, Report to administrator")
                                            }}
                                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                                        >
                                            <Copy
                                                className={`h-3 w-3 transition-colors ${copied === result.user.nfcUuid ? 'text-green-600' : ''}`}/>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
