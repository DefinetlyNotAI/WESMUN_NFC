'use client'

import {Button} from "@/components/ui/button"
import {useRouter} from "next/navigation"

export default function LogoutButton() {
    const router = useRouter()

    const handleLogout = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch("/api/auth/logout", {method: "POST"})
        router.push("/auth/signin")
    }

    return (
        <form onSubmit={handleLogout}>
            <Button type="submit" variant="ghost" className="w-full" size="lg">
                Sign Out
            </Button>
        </form>
    )
}
