import type {UserRole} from "@/types/database"

declare module "next-auth" {
    interface User {
        id: string
        email: string
        name?: string | null
        image?: string | null
        role?: UserRole
    }
}
