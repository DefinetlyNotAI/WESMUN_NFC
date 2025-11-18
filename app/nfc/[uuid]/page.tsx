import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {NfcScanView} from "@/components/nfc/nfc-scan-view"
import {NfcPageProps} from "@/types/components";

export default async function NfcPage({params}: NfcPageProps) {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    // Only admin, overseer, and security can access NFC pages
    if (user.role !== "admin" && user.role !== "overseer" && user.role !== "security") {
        redirect("/")
    }

    const {uuid} = await params

    return <NfcScanView uuid={uuid} userRole={user.role}/>
}
