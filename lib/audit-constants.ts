// Audit action labels - safe for client-side use
export const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    // NFC related
    nfc_scan: {label: "NFC Scan", color: "bg-blue-500"},
    nfc_link_create: {label: "NFC Link Created", color: "bg-teal-600"},

    // Profile updates
    profile_update: {label: "Profile Update", color: "bg-green-600"},
    profile_update_admin: {label: "Admin Profile Update", color: "bg-orange-600"},
    profile_update_admin_bulk: {label: "Bulk Admin Profile Update", color: "bg-orange-700"},

    // Role / user management
    role_update: {label: "Role Change", color: "bg-purple-600"},
    user_delete: {label: "User Deleted", color: "bg-red-600"},
    create_data_only_user: {label: "Data-only User Created", color: "bg-cyan-600"},

    // Login / auth
    user_login: {label: "User Login", color: "bg-green-500"},
    emergency_admin_login: {label: "Emergency Admin Login", color: "bg-amber-500"},

    // Approval flows
    user_approved: {label: "User Approved", color: "bg-green-700"},
    user_rejected: {label: "User Rejected", color: "bg-red-700"},
}

