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

    return <NfcScanView uuid={params.uuid} userRole={user.role}/>
}
