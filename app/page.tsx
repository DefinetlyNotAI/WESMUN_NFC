import {getCurrentUser} from "@/lib/session"
import { redirect } from 'next/navigation'
import { HomePageClient } from "@/components/home-page-client"
export default async function HomePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/signin")
    }

    const isEmergencyAdmin = user.email === process.env.NEXT_PUBLIC_EMERGENCY_ADMIN_EMAIL ||
                             user.name === "Emergency Admin"

    return <HomePageClient user={user} isEmergencyAdmin={isEmergencyAdmin} />
}
