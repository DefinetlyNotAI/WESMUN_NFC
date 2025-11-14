"use client"

import type React from "react"
import {useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {ArrowLeft, QrCode} from "lucide-react"
import Link from "next/link"
import {useRouter} from "next/navigation"

export function ScannerView() {
    const [uuid, setUuid] = useState("")
    const router = useRouter()

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault()
        if (uuid.trim()) {
            router.push(`/nfc/${uuid.trim()}`)
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 p-4">
            <div className="mx-auto max-w-md space-y-4">
                <Link href="/">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to Dashboard
                    </Button>
                </Link>

                <Card>
                    <CardHeader className="text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <QrCode className="h-8 w-8"/>
                        </div>
                        <CardTitle>Scan NFC Card</CardTitle>
                        <CardDescription>Enter the UUID from the NFC card to view user details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleScan} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Enter UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
                                    value={uuid}
                                    onChange={(e) => setUuid(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <Button type="submit" className="w-full" size="lg" disabled={!uuid.trim()}>
                                Scan Card
                            </Button>
                        </form>

                        <div className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                            <p className="font-medium">How to use:</p>
                            <ol className="mt-2 list-inside list-decimal space-y-1">
                                <li>Scan the NFC card with your device</li>
                                <li>Copy the UUID from the URL</li>
                                <li>Paste it here to view user details</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
