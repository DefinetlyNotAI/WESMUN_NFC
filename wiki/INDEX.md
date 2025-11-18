# API Documentation Index

Complete documentation for all NFC WESMUN APIs.

---

## 📚 Documentation Files

### Getting Started

- **[README](./README.md)** - Main documentation overview and introduction

### Core APIs

1. **[Authentication API](./authentication-api.md)** - Login, register, logout, session validation
2. **[User Management API](./user-management-api.md)** - CRUD operations, bulk actions, exports
3. **[Admin API](./admin-api.md)** - User approval and admin operations
4. **[NFC API](./nfc-api.md)** - NFC scanning and profile updates
5. **[Audit API](./audit-api.md)** - Audit log viewing and management

### Reference

- **[Data Types](./data-types.md)** - All TypeScript interfaces and database schemas
- **[Permissions & Roles](./permissions-roles.md)** - RBAC system and access control
- **[Error Handling](./error-handling.md)** - Error codes, patterns, and recovery
- **[Quick Reference](./quick-reference.md)** - Quick lookup for common operations

---

## 🔑 API Endpoints Summary

### Authentication (4 endpoints)

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - End session
- `GET /api/auth/validate` - Check session validity

### Users (9 endpoints)

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

- `GET /api/admin/pending-users` - List pending approvals
- `POST /api/admin/approve-user` - Approve/reject user

### NFC (3 endpoints)

- `GET /api/nfc/[uuid]` - Scan NFC link
- `PATCH /api/nfc/[uuid]/update` - Update via NFC
- `POST /api/nfc-links` - Create NFC link

### Audit (3 endpoints)

- `GET /api/audit` - List audit logs
- `DELETE /api/audit/[id]` - Delete log entry
- `DELETE /api/audit/bulk-delete` - Bulk delete logs

**Total: 21 API endpoints**

---

## 👥 User Roles

| Role                | Description          | Key Permissions                   |
|---------------------|----------------------|-----------------------------------|
| **user**            | Conference delegate  | View own profile only             |
| **security**        | Security personnel   | Scan, check bags, mark attendance |
| **overseer**        | Observer             | Read-only access to all users     |
| **admin**           | System administrator | Full user management              |
| **Emergency Admin** | Super admin          | Audit log access                  |

---

## 🔐 Common Permissions

| Permission            | Security | Overseer | Admin           |
|-----------------------|----------|----------|-----------------|
| View all users        | ✅        | ✅        | ✅               |
| Update bags_checked   | ✅        | ❌        | ✅               |
| Update attendance     | ✅        | ❌        | ✅               |
| Update diet/allergens | ❌        | ❌        | ✅               |
| Create/delete users   | ❌        | ❌        | ✅               |
| Approve users         | ❌        | ❌        | ✅               |
| View audit logs       | ❌        | ❌        | Emergency Admin |

---

## 📊 Data Models

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

## 🚀 Quick Start Examples

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

## ⚠️ Common Error Codes

| Code | Meaning      | Common Causes                        |
|------|--------------|--------------------------------------|
| 400  | Bad Request  | Missing fields, invalid format       |
| 401  | Unauthorized | Not logged in, invalid session       |
| 403  | Forbidden    | Insufficient permissions             |
| 404  | Not Found    | Invalid UUID, user doesn't exist     |
| 500  | Server Error | Database error, unexpected exception |

---

## 🔍 Search & Filter

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

## 🛠️ Development Tools

### Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=random-secret-key
NEXT_PUBLIC_BASE_URL=https://nfc.wesmun.com
EMERGENCY_ADMIN_USERNAME=admin@wesmun.com
NODE_ENV=production
```

### Database Setup

```bash
# Connect to database
psql $DATABASE_URL

# Run schema setup
psql $DATABASE_URL < schema.sql

# Create initial admin
psql $DATABASE_URL -c "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE email = 'admin@wesmun.com';"
```

---

## 📖 Documentation Navigation

### By Use Case

**I want to authenticate users:**
→ [Authentication API](./authentication-api.md)

**I want to manage users:**
→ [User Management API](./user-management-api.md)
→ [Admin API](./admin-api.md)

**I want to scan NFC tags:**
→ [NFC API](./nfc-api.md)

**I want to track actions:**
→ [Audit API](./audit-api.md)

**I want to understand permissions:**
→ [Permissions & Roles](./permissions-roles.md)

**I want to handle errors:**
→ [Error Handling](./error-handling.md)

**I want TypeScript types:**
→ [Data Types](./data-types.md)

**I want quick answers:**
→ [Quick Reference](./quick-reference.md)

---

## 📝 Documentation Standards

### Request Examples

All endpoints include:

- HTTP method and path
- Required headers
- Request body schema
- URL parameters
- Query parameters

### Response Examples

All endpoints include:

- Success response (200/201/204)
- Error responses (400/401/403/404/500)
- Response body schema
- Headers (if relevant)

### Code Examples

Documentation includes:

- JavaScript/TypeScript examples
- cURL examples
- Common patterns
- Error handling

---

## 🔄 API Versioning

Current version: **v1** (implicit)

All endpoints are under `/api/` with no version prefix.

Future versions will use: `/api/v2/`, `/api/v3/`, etc.

**Backward Compatibility:**

- v1 (current) will remain available indefinitely
- Breaking changes will introduce new version
- Deprecation notices given 6 months in advance

---

## 🧪 Testing

### API Testing Tools

- **Postman** - Import collection from docs
- **cURL** - Command-line testing
- **HTTPie** - User-friendly CLI
- **Jest** - Unit/integration tests
- **Playwright** - E2E tests

### Test Accounts

Development environment includes:

- `admin@wesmun.com` - Admin user
- `security@wesmun.com` - Security user
- `user@example.com` - Regular user

---

## 📊 Statistics

**Documentation Stats:**

- Total pages: 10
- Total endpoints: 21
- Total roles: 4 (+1 emergency)
- Total permissions: 10
- Code examples: 50+
- Database tables: 6

**Coverage:**

- Authentication: ✅ Complete
- User Management: ✅ Complete
- Admin Operations: ✅ Complete
- NFC Operations: ✅ Complete
- Audit Logging: ✅ Complete
- Error Handling: ✅ Complete
- Data Types: ✅ Complete
- Permissions: ✅ Complete

---

## 🤝 Contributing

To update this documentation:

1. **Edit markdown files** in `/wiki` directory
2. **Follow existing format** for consistency
3. **Include code examples** for all endpoints
4. **Test all examples** before committing
5. **Update this index** if adding new files

### Documentation Style Guide

- Use headers for clear structure
- Include practical examples
- Explain the "why" not just the "how"
- Link to related documentation
- Keep code examples simple and clear

---

## 📞 Support

**Issues with APIs:**

1. Check [Error Handling](./error-handling.md)
2. Review [Quick Reference](./quick-reference.md)
3. Verify [Permissions](./permissions-roles.md)
4. Check server logs

**Documentation Questions:**

- Open an issue in the repository
- Tag with `documentation` label
- Provide specific page reference

---

## 🗺️ Roadmap

### Planned Enhancements

- [ ] WebSocket support for real-time updates
- [ ] GraphQL API alternative
- [ ] Rate limiting documentation
- [ ] API client libraries (JS/Python)
- [ ] OpenAPI/Swagger specification
- [ ] Webhook support
- [ ] Batch operation optimizations

### Documentation Improvements

- [ ] Interactive API playground
- [ ] Video tutorials
- [ ] Migration guides
- [ ] Performance best practices
- [ ] Security best practices
- [ ] Deployment guides

---

**Last Updated:** November 18, 2025  
**Version:** 1.0.0  
**Maintainer:** NFC WESMUN Team

