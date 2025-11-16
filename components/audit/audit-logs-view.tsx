"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {ArrowLeft, CheckSquare, Loader2, RefreshCw, Shield, Square, Trash2} from 'lucide-react'
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
    profile_update_admin_bulk: {label: "Bulk Admin Update", color: "bg-orange-700"},
    role_update: {label: "Role Change", color: "bg-purple-600"},
    user_delete: {label: "User Deleted", color: "bg-red-600"},
    nfc_link_create: {label: "NFC Link Created", color: "bg-teal-600"},
}

export function AuditLogsView() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set())
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionFilter, setActionFilter] = useState<string>("all")

    useEffect(() => {
        fetchLogs().catch(console.error)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionFilter])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            const url = actionFilter && actionFilter !== "all"
                ? `/api/audit?action=${actionFilter}`
                : "/api/audit"
            const response = await fetch(url)
            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Failed to fetch audit logs")
                setLogs([])
                setTotal(0)
                return
            }

            setLogs(Array.isArray(data.logs) ? data.logs : [])
            setTotal(data.total || 0)
            setSelectedLogs(new Set()) // Clear selection when filter changes
        } catch (error) {
            console.error("[WESMUN] Failed to fetch audit logs:", error)
            setError("An unexpected error occurred")
            setLogs([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const deleteLog = async (logId: number) => {
        if (!confirm("Delete this audit log? This action cannot be undone.")) return

        setDeleting(true)
        try {
            const response = await fetch(`/api/audit/${logId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                setLogs(logs.filter(l => l.id !== logId))
                setTotal(total - 1)
            } else {
                alert("Failed to delete log")
            }
        } catch (error) {
            console.error("Delete error:", error)
            alert("Error deleting log")
        } finally {
            setDeleting(false)
        }
    }

    const bulkDelete = async () => {
        if (selectedLogs.size === 0) return
        if (!confirm(`Delete ${selectedLogs.size} logs? This action cannot be undone.`)) return

        setDeleting(true)
        try {
            const response = await fetch("/api/audit/bulk-delete", {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({logIds: Array.from(selectedLogs)})
            })

            if (response.ok) {
                setLogs(logs.filter(l => !selectedLogs.has(l.id)))
                setTotal(total - selectedLogs.size)
                setSelectedLogs(new Set())
            } else {
                alert("Failed to delete logs")
            }
        } catch (error) {
            console.error("Bulk delete error:", error)
            alert("Error deleting logs")
        } finally {
            setDeleting(false)
        }
    }

    const toggleLogSelection = (logId: number) => {
        const newSelected = new Set(selectedLogs)
        if (newSelected.has(logId)) {
            newSelected.delete(logId)
        } else {
            newSelected.add(logId)
        }
        setSelectedLogs(newSelected)
    }

    const selectAll = () => {
        setSelectedLogs(new Set(logs.map(log => log.id)))
    }

    const deselectAll = () => {
        setSelectedLogs(new Set())
    }

    const isInitialLoading = loading && logs.length === 0 && !error

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="container mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link href="/">
                        <Button variant="ghost" size="sm"
                                className="transition-all duration-200 hover:scale-105 active:scale-95">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        {selectedLogs.size > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={bulkDelete}
                                disabled={deleting || loading}
                                className="transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete {selectedLogs.size}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchLogs}
                            disabled={loading}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                            {loading ? "Refreshing" : "Refresh"}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
                        <CardContent className="pt-6">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Filter and Selection Controls */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Filter by Action:</label>
                        <Select value={actionFilter} onValueChange={setActionFilter} disabled={loading}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="nfc_scan">NFC Scan</SelectItem>
                                <SelectItem value="profile_update">Profile Update</SelectItem>
                                <SelectItem value="profile_update_admin">Admin Update</SelectItem>
                                <SelectItem value="role_update">Role Change</SelectItem>
                                <SelectItem value="user_delete">User Deleted</SelectItem>
                                <SelectItem value="nfc_link_create">NFC Link Created</SelectItem>
                            </SelectContent>
                        </Select>
                        {loading && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedLogs.size === logs.length && logs.length > 0 ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deselectAll}
                                disabled={loading}
                                className="transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Square className="mr-2 h-4 w-4"/>
                                Deselect All
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAll}
                                disabled={logs.length === 0 || loading}
                                className="transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <CheckSquare className="mr-2 h-4 w-4"/>
                                Select All ({logs.length})
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5"/>
                            <CardTitle>Audit Logs</CardTitle>
                            {loading && <Badge variant="outline" className="ml-2">Updating…</Badge>}
                        </div>
                        <CardDescription>Complete activity trail of all system actions ({total} total
                            entries)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isInitialLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Array.isArray(logs) && logs.map((log) => {
                                    const actionConfig = ACTION_LABELS[log.action] || {
                                        label: log.action,
                                        color: "bg-gray-500"
                                    }

                                    return (
                                        <div key={log.id} className="rounded-lg border p-4 flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedLogs.has(log.id)}
                                                onChange={() => toggleLogSelection(log.id)}
                                                className="mt-1 cursor-pointer"
                                                disabled={loading}
                                            />

                                            <div
                                                className="flex-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

                                                <div
                                                    className="flex items-center gap-2 text-right text-xs text-muted-foreground">
                                                    <p>{new Date(log.created_at).toLocaleString()}</p>
                                                    {log.ip_address && <p className="font-mono">{log.ip_address}</p>}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteLog(log.id)}
                                                        disabled={deleting || loading}
                                                        className="transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-600"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {logs.length === 0 && !loading &&
                                    <div className="py-12 text-center text-muted-foreground">No audit logs found.</div>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
