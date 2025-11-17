// Shared UI / component types
// This file is kept for backward compatibility
// All types are now organized in separate files
// Import from @/lib/types for new code

// Re-export all component types for backward compatibility
export type {
    User,
    UserEditDialogProps,
    UserData,
    UserActionUser,
    UserActionsProps,
    UserManagementProps,
    NfcScanViewProps,
    HomePageClientProps,
    DebugModeProps,
    AuditLog,
    StatusIconProps
} from "./components"

// Re-export API types that were in this file
export type {
    CreatedUser,
    CreateAuditLogParams
} from "./api"

