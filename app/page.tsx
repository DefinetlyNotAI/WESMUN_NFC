import {getCurrentUser} from "@/lib/session"
import { redirect } from 'next/navigation'
import { HomePageClient } from "@/components/home-page-client"
export default async function HomePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    const isEmergencyAdmin = user.email === process.env.EMERGENCY_ADMIN_USERNAME ||
                             user.name === "Emergency Admin"

    return <HomePageClient user={user} isEmergencyAdmin={isEmergencyAdmin} />
}
