import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {AuditLogsView} from "@/components/audit/audit-logs-view"

export default async function AuditPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    // Only emergency admin (superadmin) can access audit logs
    const isEmergencyAdmin = user.email === process.env.EMERGENCY_ADMIN_USERNAME ||
        user.name === "Emergency Admin"

    if (!isEmergencyAdmin) {
        redirect("/")
    }

    return <AuditLogsView/>
}
