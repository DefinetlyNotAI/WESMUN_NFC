"use client"

import {useEffect, useState} from "react"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import type {UserRole} from "@/lib/types/database"
import type {DebugModeProps} from "@/lib/types/ui"

export function DebugMode({currentRole, isEmergencyAdmin}: DebugModeProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [debugRole, setDebugRole] = useState<UserRole>(currentRole)
    const [isDebugActive, setIsDebugActive] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    // Initialize from sessionStorage after hydration to avoid mismatch
    useEffect(() => {
        setIsHydrated(true)
        const storedRole = sessionStorage.getItem('debugRole') as UserRole | null
        if (storedRole) {
            setDebugRole(storedRole)
            setIsDebugActive(true)
        }
    }, [])

    useEffect(() => {
        if (!isEmergencyAdmin) return

        const handleKeyPress = (e: KeyboardEvent) => {
            // Press 'D' key to open debug mode (Shift+D or just D)
            if (e.key === 'D' || e.key === 'd') {
                // Don't trigger if typing in an input field
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    return
                }
                e.preventDefault()
                setIsOpen(true)
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isEmergencyAdmin])

    useEffect(() => {
        if (!isHydrated) return // Don't run before hydration

        // Smart reloading - only when necessary
        if (isDebugActive) {
            const storedRole = sessionStorage.getItem('debugRole')
            if (storedRole !== debugRole) {
                // Store the new role and reload
                sessionStorage.setItem('debugRole', debugRole)
                window.location.reload()
            }
        } else {
            const hadDebugRole = sessionStorage.getItem('debugRole')
            if (hadDebugRole) {
                // Clear debug role and reload
                sessionStorage.removeItem('debugRole')
                window.location.reload()
            }
        }
    }, [isDebugActive, debugRole, isHydrated])

    if (!isEmergencyAdmin) return null

    const handleActivateDebug = () => {
        setIsDebugActive(true)
        setIsOpen(false)
    }

    const handleDeactivateDebug = () => {
        setIsDebugActive(false)
        setDebugRole(currentRole)
        // Effect will handle clearing storage and reloading
    }

    return (
        <>
            {/* Debug Mode Indicator - Only render after hydration */}
            {isHydrated && isDebugActive && (
                <div className="fixed top-4 left-4 z-50">
                    <Badge
                        variant="destructive"
                        className="text-xs px-3 py-1 cursor-pointer animate-pulse"
                        onClick={() => setIsOpen(true)}
                    >
                        🐛 DEBUG MODE: {debugRole.toUpperCase()}
                    </Badge>
                </div>
            )}

            {/* Debug Mode Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            🐛 Debug Mode
                            <Badge variant="outline" className="text-xs">Emergency Admin Only</Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Temporarily switch roles to test different permission levels without signing out.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Role</label>
                            <div className="rounded-lg border p-3 bg-muted/50">
                                <p className="text-sm font-semibold">{currentRole}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Debug Role (Temporary)</label>
                            <Select
                                value={debugRole}
                                onValueChange={(value) => setDebugRole(value as UserRole)}
                                disabled={isDebugActive}
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="overseer">Overseer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isDebugActive && (
                            <div
                                className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-3">
                                <p className="text-xs text-orange-800 dark:text-orange-200">
                                    ⚠️ Debug mode is active. The UI will reflect permissions for the "{debugRole}" role.
                                </p>
                            </div>
                        )}

                        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                                💡 <strong>Tip:</strong> Press "D" anywhere to open this dialog. Debug mode persists
                                until you deactivate it or close the browser tab.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {!isDebugActive ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleActivateDebug}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                                        disabled={debugRole === currentRole}
                                    >
                                        Activate Debug Mode
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={handleDeactivateDebug}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        Deactivate Debug Mode
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
