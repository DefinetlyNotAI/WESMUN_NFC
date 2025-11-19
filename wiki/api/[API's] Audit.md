# Audit APIs

This document covers all audit logging API endpoints for tracking system actions and changes.

---

## GET /api/audit

Retrieves audit logs with optional filtering and pagination.

### Authentication

Required: Yes  
Required Permission: `canViewAuditLogs` OR Emergency Admin  
Allowed Roles: Emergency Admin only (other roles do not have `canViewAuditLogs` by default)

### Request

**Query Parameters:**

- `limit` (number, optional): Number of logs to return (1-500, default: 100)
- `offset` (number, optional): Number of logs to skip (default: 0)
- `action` (string, optional): Filter by specific action type
- `search` (string, optional): Search across multiple fields

### Response

**Success (200 OK):**

```json
{
  "logs": [
    {
      "id": 12345,
      "action": "user_approved",
      "details": { "status": "approved" },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-20T14:30:00Z",
      "actor": {
        "id": "actor-uuid",
        "name": "Admin User",
        "email": "admin@wesmun.com"
      },
      "target_user": {
        "id": "target-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 1523
}
```

### Notes

- Only Emergency Admin can access audit logs
- Logs are sorted by `created_at` DESC (newest first)
- Search functionality covers actor, target user, action, and IP address fields

---

## DELETE /api/audit/[id]

Deletes a specific audit log entry.

### Authentication

Required: Yes  
Required: Emergency Admin only

### Request

**URL Parameters:**

- `id` (number, required): Audit log ID to delete

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "deleted": 12345
}
```

### Notes

- Extremely restricted operation - Emergency Admin only
- Use with caution - removes audit trail

---

## DELETE /api/audit/bulk-delete

Deletes multiple audit log entries at once.

### Authentication

Required: Yes  
Required: Emergency Admin only

### Request

**Body:**

```json
{
  "logIds": [12345, 12346, 12347]
}
```

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "deleted": 3,
  "logIds": [12345, 12346, 12347]
}
```

### Notes

- Only numeric IDs are processed
- Non-existent IDs are silently skipped
- Use with extreme caution

---

## Action Types

The system tracks these action types:

- `login` - User logged in
- `logout` - User logged out
- `user_approved` - Admin approved pending user
- `user_rejected` - Admin rejected pending user
- `user_delete` - User account deleted
- `role_update` - User role changed
- `profile_update` - Profile updated via NFC scan
- `profile_update_admin` - Admin updated user profile
- `profile_update_admin_bulk` - Bulk profile update
- `nfc_scan` - NFC link scanned
- `nfc_link_create` - NFC link created

---

## Code Examples

### Get Audit Logs

```javascript
const response = await fetch('/api/audit?limit=50&offset=0', {
  credentials: 'include',
});
const data = await response.json();
console.log('Logs:', data.logs);
console.log('Total:', data.total);
```

### Search Audit Logs

```javascript
const response = await fetch(
    '/api/audit?search=john@example.com&limit=50',
    {credentials: 'include'}
);
const data = await response.json();
```

### Delete Audit Log

```javascript
await fetch(`/api/audit/${logId}`, {
  method: 'DELETE',
  credentials: 'include',
});
```

