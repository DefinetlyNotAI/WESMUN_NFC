import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {ScannerView} from "@/components/scanner/scanner-view"

export default async function ScanPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    if (user.role !== "security" && user.role !== "admin") {
        redirect("/")
    }

    return <ScannerView/>
}
