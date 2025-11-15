import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {NfcScanView} from "@/components/nfc/nfc-scan-view"

interface NfcPageProps {
    params: {
        uuid: string
    }
}

export default async function NfcPage({params}: NfcPageProps) {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }
    const {uuid} = await params

    return <NfcScanView uuid={uuid} userRole={user.role}/>
}
