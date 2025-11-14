"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Bell, CheckCircle2, Loader2, XCircle} from "lucide-react"

interface PendingUser {
    id: string
    name: string
    email: string
    created_at: string
    approval_status: string
}

export function PendingApprovals() {
    const [users, setUsers] = useState<PendingUser[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingUsers().catch(console.error)
        // Poll for new pending users every 30 seconds
        const interval = setInterval(fetchPendingUsers, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch("/api/admin/pending-users")
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users)
            }
        } catch (error) {
            console.error("[v0] Failed to fetch pending users:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleApproval = async (userId: string, approved: boolean) => {
        setProcessing(userId)

        const response = await fetch("/api/admin/approve-user", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({userId, approved}),
        })

        if (!response.ok) throw new Error("Failed to process approval")

        await fetchPendingUsers()
        setProcessing(null)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                </CardContent>
            </Card>
        )
    }

    if (users.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5"/>
                        Pending Approvals
                    </CardTitle>
                    <CardDescription>No pending user approvals</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5"/>
                    Pending Approvals
                    <Badge variant="destructive" className="ml-2">
                        {users.length}
                    </Badge>
                </CardTitle>
                <CardDescription>Review and approve new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleApproval(user.id, true)}
                                                disabled={processing === user.id}
                                            >
                                                {processing === user.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="mr-1 h-4 w-4"/>
                                                        Approve
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleApproval(user.id, false)}
                                                disabled={processing === user.id}
                                            >
                                                <XCircle className="mr-1 h-4 w-4"/>
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
