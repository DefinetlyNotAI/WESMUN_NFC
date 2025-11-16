import {Button} from "@/components/ui/button"
import {Edit2, Trash2} from "lucide-react"
import type {UserRole} from "@/lib/types/database"

interface User {
    id: string
    name: string
    email: string
    role: {
        name: UserRole
    }
}

interface UserActionsProps {
    user: User
    updating: string | null
    isAdmin: boolean
    isEmergencyAdmin: boolean
    setEditingUser: (user: any) => void
    deleteUser: (id: string, role?: UserRole) => Promise<void>
}

export function UserActions({
                                user,
                                updating,
                                isAdmin,
                                isEmergencyAdmin,
                                setEditingUser,
                                deleteUser
                            }: UserActionsProps) {
    const canEdit = !updating && !isEmergencyAdmin && user.role.name === 'user'
    const canDelete = !updating && !isAdmin && !isEmergencyAdmin && user.role.name !== 'security' && user.role.name !== 'overseer'

    const editReason = (() => {
        if (updating) return 'Action in progress'
        if (isEmergencyAdmin) return 'Emergency Admin cannot be edited'
        if (user.role.name !== 'user') return 'Only user role can be edited'
        return ''
    })()

    const deleteReason = (() => {
        if (updating) return 'Action in progress'
        if (isEmergencyAdmin) return 'Emergency Admin cannot be deleted'
        if (isAdmin) return 'Admins cannot be deleted'
        if (user.role.name === 'security') return 'Security staff cannot be deleted'
        if (user.role.name === 'overseer') return 'Overseers cannot be deleted'
        return ''
    })()

    return (
        <div className="flex gap-2 justify-end">
            <span title={!canEdit ? editReason : ''} className="inline-flex">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingUser(user)}
                    disabled={!canEdit}
                    className={!canEdit ? 'cursor-not-allowed opacity-50' : ''}
                >
                    <Edit2 className="h-4 w-4"/>
                </Button>
            </span>

            <span title={!canDelete ? deleteReason : ''} className="inline-flex">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteUser(user.id, user.role.name)}
                    disabled={!canDelete}
                    className={!canDelete ? 'cursor-not-allowed opacity-50' : ''}
                >
                    <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
            </span>
        </div>
    )
}
