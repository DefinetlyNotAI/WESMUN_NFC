"use client"

import React, {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Alert, AlertDescription} from "@/components/ui/alert"
import { Loader2, Plus, AlertCircle, CheckCircle2, Copy } from 'lucide-react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"

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
    const [bulkData, setBulkData] = useState("")
    const [loading, setLoading] = useState(false)
    const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([])
    const [error, setError] = useState("")

    const createSingleUser = async () => {
        if (!singleEmail || !singleName) {
            setError("Email and name are required")
            return
        }

        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/users/create-data-only", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    email: singleEmail,
                    name: singleName
                })
            })

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || "Failed to create user")
                return
            }

            const data = await response.json()
            setCreatedUsers([{
                email: singleEmail,
                success: true,
                message: data.message,
                user: data.user
            }])
            setSingleEmail("")
            setSingleName("")
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

        if (users.length === 0) {
            setError("No valid users found in CSV")
            return
        }

        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/users/undefined/bulk-create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({users})
            })

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || "Failed to create users")
                return
            }

            const data = await response.json()
            setCreatedUsers(data.results)
            setBulkData("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Users</CardTitle>
                    <CardDescription>Create data-only user accounts for attendees. These users cannot sign in but their data will be tracked.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="single">Single User</TabsTrigger>
                            <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="single" className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="single-email">Email Address</Label>
                                    <Input
                                        id="single-email"
                                        placeholder="user@example.com"
                                        type="email"
                                        value={singleEmail}
                                        onChange={(e) => setSingleEmail(e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="single-name">Full Name</Label>
                                    <Input
                                        id="single-name"
                                        placeholder="John Doe"
                                        value={singleName}
                                        onChange={(e) => setSingleName(e.target.value)}
                                    />
                                </div>

                                <Button onClick={createSingleUser} disabled={loading}>
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
                            <div className="grid gap-2">
                                <Label htmlFor="bulk-data">CSV Data (email,name)</Label>
                                <Textarea
                                    id="bulk-data"
                                    placeholder="user1@example.com,John Doe&#10;user2@example.com,Jane Smith"
                                    value={bulkData}
                                    onChange={(e) => setBulkData(e.target.value)}
                                    rows={6}
                                />
                            </div>

                            <Button onClick={createBulkUsers} disabled={loading}>
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
                        <CardDescription>Share the NFC UUID with security to add to cards</CardDescription>
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
                                                UUID: {result.user.nfcUuid}
                                            </div>
                                        )}
                                    </div>
                                    {result.user?.nfcUuid && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(result.user?.nfcUuid || "").catch(console.error);
                                            }}
                                        >
                                            <Copy className="h-3 w-3"/>
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
