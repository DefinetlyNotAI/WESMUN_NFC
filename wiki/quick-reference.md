# Quick Reference Guide

A quick reference for the most commonly used API endpoints in NFC WESMUN.
---

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register

```http
POST /api/auth/register
Content-Type: application/json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Logout

```http
POST /api/auth/logout
```

### Validate Session

```http
GET /api/auth/validate
```

---

## Users

### Get All Users

```http
GET /api/users
```

**Required:** Security, Overseer, or Admin

### Update User

```http
PATCH /api/users/{userId}
Content-Type: application/json
{
  "diet": "veg",
  "attendance": true,
  "bags_checked": true
}
```

**Required:** Admin

### Delete User

```http
DELETE /api/users/{userId}
```

**Required:** Admin

### Bulk Update Users

```http
PATCH /api/users/bulk-update
Content-Type: application/json
{
  "userIds": ["id1", "id2"],
  "attendance": true
}
```

**Required:** Admin

### Export Users (CSV)

```http
GET /api/users/export?format=csv&attendance=true
```

**Required:** Security, Overseer, or Admin
---

## NFC

### Scan NFC Link

```http
GET /api/nfc/{uuid}
```

**Required:** Authenticated (returns 204 if not)

### Update via NFC

```http
PATCH /api/nfc/{uuid}/update
Content-Type: application/json
{
  "bags_checked": true,
  "attendance": true
}
```

**Required:** Varies by field (see permissions)
---

## Common Response Patterns

### Success Response

```json
{
  "success": true,
  "message": "Operation completed"
}
```

### Error Response

```json
{
  "error": "Error message"
}
```

---

## Status Codes Quick Reference

| Code | Meaning      | When               |
|------|--------------|--------------------|
| 200  | OK           | Success            |
| 204  | No Content   | NFC scan (no auth) |
| 400  | Bad Request  | Invalid input      |
| 401  | Unauthorized | Not authenticated  |
| 403  | Forbidden    | No permission      |
| 404  | Not Found    | Resource missing   |
| 500  | Server Error | Internal error     |

---

## Role Permissions Quick Reference

| Action            | User | Security | Overseer | Admin |
|-------------------|------|----------|----------|-------|
| View All  Users   | ❌    | ✅        | ✅        | ✅     |
| Update Bags       | ❌    | ✅        | ❌        | ✅     |
| Update Attendance | ❌    | ✅        | ❌        | ✅     |
| Update Diet       | ❌    | ❌        | ❌        | ✅     |
| Manage Users      | ❌    | ❌        | ❌        | ✅     |
| Approve Users     | ❌    | ❌        | ❌        | ✅     |

---

## Need More Info?

- **Full API Docs:** See individual API documentation files
- **Data Types:** [data-types.md](./data-types.md)
- **Permissions:** [permissions-roles.md](./permissions-roles.md)
- **Error Handling:** [error-handling.md](./error-handling.md)
