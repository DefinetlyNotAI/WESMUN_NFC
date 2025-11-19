# API Documentation Index

Welcome to the NFC WESMUN API documentation. This wiki provides comprehensive documentation for all available APIs in
the NFC WESMUN system.

---

## Overview

The NFC WESMUN system is a Next.js application that provides NFC-based user management for the WESMUN conference. It
includes:

- User authentication and authorization
- Role-based access control (RBAC)
- NFC link generation and scanning
- User profile management
- Audit logging
- Bulk operations support
- CSV/PDF export functionality

## API Endpoints Summary

**Total: 21 API endpoints**

### Authentication (4 endpoints)

> In depth wiki page can be found [here](api/authentication.md)

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - End session
- `GET /api/auth/validate` - Check session validity

### Users (9 endpoints)

> In depth wiki page can be found [here](api/user_management.md)

- `GET /api/users` - List all users
- `PATCH /api/users/[userId]` - Update user
- `DELETE /api/users/[userId]` - Delete user
- `PATCH /api/users/bulk-update` - Bulk update
- `POST /api/users/bulk-delete` - Bulk delete
- `POST /api/users/create-data-only` - Create delegate
- `POST /api/users/create-data-only/bulk` - Bulk create delegates
- `GET /api/users/export` - Export CSV/PDF
- `POST /api/users/export` - Export with filters

### Admin (2 endpoints)

> In depth wiki page can be found [here](api/admin.md)

- `GET /api/admin/pending-users` - List pending approvals
- `POST /api/admin/approve-user` - Approve/reject user

### NFC (3 endpoints)

> In depth wiki page can be found [here](api/nfc.md)

- `GET /api/nfc/[uuid]` - Scan NFC link
- `PATCH /api/nfc/[uuid]/update` - Update via NFC
- `POST /api/nfc-links` - Create NFC link

### Audit (3 endpoints)

> In depth wiki page can be found [here](api/audit.md)

- `GET /api/audit` - List audit logs
- `DELETE /api/audit/[id]` - Delete log entry
- `DELETE /api/audit/bulk-delete` - Bulk delete logs

---

## User Roles

| Role                | Description          | Key Permissions                   |
|---------------------|----------------------|-----------------------------------|
| **user**            | Conference delegate  | Data Only User                    |
| **security**        | Security personnel   | Scan, check bags, mark attendance |
| **overseer**        | Observer             | Read-only access                  |
| **admin**           | System administrator | Full user management              |
| **Emergency Admin** | Super admin          | Audit log access                  |

---

## Common Permissions

| Permission            | Security | Overseer | Admin           |
|-----------------------|----------|----------|-----------------|
| View all users        | ✅        | ✅        | ✅               |
| Update bags_checked   | ✅        | ❌        | ✅               |
| Update attendance     | ✅        | ❌        | ✅               |
| Update diet/allergens | ✅        | ❌        | ✅               |
| Create/delete users   | ❌        | ❌        | ✅               |
| Approve users         | ❌        | ❌        | ✅               |
| View audit logs       | ❌        | ❌        | Emergency Admin |

---

## Data Models

### Core Tables

- **users** - User accounts and authentication
- **profiles** - Event-specific user data (bags, attendance, diet)
- **nfc_links** - NFC UUID mappings
- **roles** - User role definitions
- **audit_logs** - System action tracking
- **sessions** - Active user sessions

### Key Relationships

```
users (1) ←→ (1) profiles
users (1) ←→ (1) nfc_links
users (N) → (1) roles
users (1) ← (N) audit_logs (as actor)
users (1) ← (N) audit_logs (as target)
users (1) ← (N) sessions
```

---

## Quick Start Examples

### Login and Get Users

```javascript
// Login
const loginRes = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
    })
});

// Get all users
const usersRes = await fetch('/api/users', {
    credentials: 'include'
});
const {users} = await usersRes.json();
```

### Scan NFC and Update

```javascript
// Scan NFC
const scanRes = await fetch(`/api/nfc/${uuid}`, {
    credentials: 'include'
});
const userData = await scanRes.json();

// Update profile
await fetch(`/api/nfc/${uuid}/update`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
        bags_checked: true,
        attendance: true
    })
});
```

### Create and Export Users

```javascript
// Bulk create data-only users
await fetch('/api/users/create-data-only/bulk', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
        users: [
            {email: 'user1@example.com', name: 'User One'},
            {email: 'user2@example.com', name: 'User Two'}
        ]
    })
});

// Export to CSV
const exportRes = await fetch(
    '/api/users/export?format=csv&attendance=true',
    {credentials: 'include'}
);
const blob = await exportRes.blob();
// Download file...
```

---

### Common Error Codes

| Code | Meaning      | Common Causes                        |
|------|--------------|--------------------------------------|
| 400  | Bad Request  | Missing fields, invalid format       |
| 401  | Unauthorized | Not logged in, invalid session       |
| 403  | Forbidden    | Insufficient permissions             |
| 404  | Not Found    | Invalid UUID, user doesn't exist     |
| 500  | Server Error | Database error, unexpected exception |

---

## Search & Filter

### User Export Filters

```
?format=csv|pdf         # Export format
?attendance=true|false  # Filter by attendance
?bags=true|false        # Filter by bags checked
?diet=veg|nonveg       # Filter by diet
?mode=count            # Count only (no data)
```

### Audit Log Filters

```
?limit=100             # Results per page (1-500)
?offset=0              # Skip N results
?action=nfc_scan       # Filter by action type
?search=john           # Search across fields
```

---

## Development Tools

### Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=random-secret-key
EMERGENCY_ADMIN_PASSWORD=password-for-super-admin
EMERGENCY_ADMIN_USERNAME=admin@wesmun.com
```

### Database Setup

```bash
python scripts/setupSQL.py
```

---

## Documentation Navigation

**I want to authenticate users:**
→ [Authentication API](api/authentication.md)

**I want to manage users:**
→ [User Management API](api/user_management.md)
→ [Admin API](api/admin.md)

**I want to scan NFC tags:**
→ [NFC API](api/nfc.md)

**I want to track actions:**
→ [Audit API](api/audit.md)

**I want to understand permissions:**
→ [Permissions & Roles](development/permissions_and_roles.md)

**I want to handle errors:**
→ [Error Handling](development/error_handling.md)

**I want TypeScript types:**
→ [Data Types](development/dataTypes.md)

---

## Extra Information

### Base URL

```
Production: https://nfc.wesmun.com
Development: http://localhost:3000
```

### Authentication

All API endpoints (except login and register) require authentication via HTTP-only session cookies. The session token is
set automatically after successful login.

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Contributing

To update this documentation:

1. **Edit markdown files** in `/wiki` directory
2. **Follow existing format** for consistency
3. **Include code examples** for all endpoints
4. **Test all examples** before committing
5. **Update this index** if adding new files

---
