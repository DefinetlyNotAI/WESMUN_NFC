"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Loader2} from 'lucide-react'
import {useRouter} from 'next/navigation'

export function SignInForm() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setLoading(true)

        console.log("[WESMUN] Form submission started", {isLogin, email: formData.email})

        try {
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
            console.log("[WESMUN] Sending request to", endpoint)

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData),
            })

            console.log("[WESMUN] Response status:", response.status)
            console.log("[WESMUN] Response headers:", {
                contentType: response.headers.get("content-type"),
            })

            const contentType = response.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                console.error("[WESMUN] Invalid response type:", contentType)
                const text = await response.text()
                console.error("[WESMUN] Response body:", text.substring(0, 200))
                setError("Server returned invalid response. Please check server logs.")
                return
            }

            let data
            try {
                data = await response.json()
                console.log("[WESMUN] Response data:", {success: data.success, message: data.message})
            } catch (parseError) {
                console.error("[WESMUN] Failed to parse JSON response:", parseError)
                setError("Failed to parse server response")
                return
            }

            if (!response.ok) {
                const errorMessage = data.error || "An error occurred"
                console.log("[WESMUN] Error response:", errorMessage)
                setError(errorMessage)
                return
            }

            if (isLogin) {
                console.log("[WESMUN] Login successful, redirecting")
                setSuccess("Login successful!")
                router.push("/")
                router.refresh()
            } else {
                console.log("[WESMUN] Registration successful")
                setSuccess(data.message)
                setFormData({email: "", password: "", name: ""})
            }
        } catch (err) {
            console.error("[WESMUN] Unexpected error in form submission:", err)
            console.error("[WESMUN] Error details:", {
                message: err instanceof Error ? err.message : String(err),
                type: err instanceof Error ? err.name : typeof err,
            })
            setError("An unexpected error occurred. Please check browser console.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">MUN NFC System</CardTitle>
                <CardDescription>{isLogin ? "Sign in to your account" : "Create a new account"}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required={!isLogin}
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@wesmun.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                            disabled={loading}
                            minLength={8}
                        />
                        {!isLogin &&
                            <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>}
                    </div>

                    {error && (
                        <div
                            className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            className="rounded-lg border border-green-600 bg-green-50 p-3 text-sm text-green-900">{success}</div>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isLogin ? "Sign In" : "Register"}
                    </Button>

                    <div className="text-center text-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError("")
                                setSuccess("")
                            }}
                            className="text-primary hover:underline"
                            disabled={loading}
                        >
                            {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
                        </button>
                    </div>

                    <div className="rounded-lg border bg-blue-50 p-3 text-xs text-blue-900">
                        <p className="font-semibold">Note:</p>
                        <p className="mt-1">Only @wesmun.com email addresses are allowed. New accounts require admin
                            approval.</p>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
