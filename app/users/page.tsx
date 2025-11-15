import {redirect} from "next/navigation"
import {getCurrentUser} from "@/lib/session"
import {UsersView} from "@/components/users/users-view"

export default async function UsersPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    if (user.role !== "admin") {
        redirect("/")
    }

    return <UsersView/>
}
