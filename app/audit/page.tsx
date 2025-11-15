import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {AuditLogsView} from "@/components/audit/audit-logs-view"

export default async function AuditPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    // Only emergency admin can access audit logs
    const isEmergencyAdmin = user.email === process.env.NEXT_PUBLIC_EMERGENCY_ADMIN_EMAIL ||
        user.name === "Emergency Admin"

    if (!isEmergencyAdmin) {
        redirect("/")
    }

    return <AuditLogsView/>
}
