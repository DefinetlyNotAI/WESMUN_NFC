import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {AuditLogsView} from "@/components/audit/audit-logs-view"

export default async function AuditPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    if (user.role !== "overseer" && user.role !== "admin") {
        redirect("/")
    }

    return <AuditLogsView/>
}
