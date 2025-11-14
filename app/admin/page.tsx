import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {AdminPanel} from "@/components/admin/admin-panel"

export default async function AdminPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    if (user.role !== "admin") {
        redirect("/")
    }

    return <AdminPanel/>
}
