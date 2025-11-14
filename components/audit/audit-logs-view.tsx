"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {ArrowLeft, Loader2, RefreshCw, Shield} from "lucide-react"
import Link from "next/link"

interface AuditLog {
    id: number
    action: string
    details: Record<string, any> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
    actor: {
        id: string
        name: string
        email: string
    } | null
    target_user: {
        id: string
        name: string
        email: string
    } | null
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    nfc_scan: {label: "NFC Scan", color: "bg-blue-500"},
    profile_update: {label: "Profile Update", color: "bg-green-600"},
    profile_update_admin: {label: "Admin Update", color: "bg-orange-600"},
    role_update: {label: "Role Change", color: "bg-purple-600"},
    user_delete: {label: "User Deleted", color: "bg-red-600"},
    nfc_link_create: {label: "NFC Link Created", color: "bg-teal-600"},
}

export function AuditLogsView() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        fetchLogs().catch(console.error)
    }, [])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/audit")
            const data = await response.json()
            setLogs(data.logs)
            setTotal(data.total)
        } catch (error) {
            console.error("[v0] Failed to fetch audit logs:", error)
        } finally {
            setLoading(false)
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
            <div className="container mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={fetchLogs}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Refresh
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5"/>
                            <CardTitle>Audit Logs</CardTitle>
                        </div>
                        <CardDescription>Complete activity trail of all system actions ({total} total
                            entries)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {logs.map((log) => {
                                const actionConfig = ACTION_LABELS[log.action] || {
                                    label: log.action,
                                    color: "bg-gray-500"
                                }

                                return (
                                    <div key={log.id} className="rounded-lg border p-4">
                                        <div
                                            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${actionConfig.color}`}/>
                                                    <span className="font-medium">{actionConfig.label}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        #{log.id}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    {log.actor && (
                                                        <p>
                                                            <span
                                                                className="font-medium">Actor:</span> {log.actor.name} ({log.actor.email})
                                                        </p>
                                                    )}
                                                    {log.target_user && (
                                                        <p>
                                                            <span
                                                                className="font-medium">Target:</span> {log.target_user.name} (
                                                            {log.target_user.email})
                                                        </p>
                                                    )}
                                                    {log.details && Object.keys(log.details).length > 0 && (
                                                        <details className="cursor-pointer">
                                                            <summary className="font-medium">Details</summary>
                                                            <pre
                                                                className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right text-xs text-muted-foreground">
                                                <p>{new Date(log.created_at).toLocaleString()}</p>
                                                {log.ip_address && <p className="font-mono">{log.ip_address}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {logs.length === 0 &&
                                <div className="py-12 text-center text-muted-foreground">No audit logs found.</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
