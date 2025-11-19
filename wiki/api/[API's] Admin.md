# Admin APIs

This document covers all admin-specific API endpoints for user approval and management.

---

## GET /api/admin/pending-users

Retrieves all users pending approval.

### Authentication

Required: Yes  
Required Permission: `canManageUsers`  
Allowed Roles: `admin`

### Request

**Headers:**

```
Cookie: session_token=<token>
```

### Response

**Success (200 OK):**

```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "newuser@example.com",
      "name": "John Pending",
      "created_at": "2024-01-15T10:30:00Z",
      "approval_status": "pending"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "another@example.com",
      "name": "Jane Waiting",
      "created_at": "2024-01-16T14:20:00Z",
      "approval_status": "pending"
    }
  ]
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

**Error (403 Forbidden):**

```json
{
  "error": "Forbidden"
}
```

### Notes

- Only returns users with `approval_status: "pending"`
- Users are sorted by creation date (oldest first)
- Does not include profile or NFC link data (users don't have them yet)
- Used for admin approval queue/dashboard
- Real-time data (no caching)

---

## POST /api/admin/approve-user

Approves or rejects a pending user.

### Authentication

Required: Yes  
Required Permission: `canManageUsers`  
Allowed Roles: `admin`

### Request

**Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "approved": true
}
```

**Parameters:**

- `userId` (string, required): UUID of the user to approve/reject
- `approved` (boolean, required): true to approve, false to reject

### Response

**Success (200 OK) - Approved:**

```json
{
  "success": true,
  "message": "User approved successfully"
}
```

**Success (200 OK) - Rejected:**

```json
{
  "success": true,
  "message": "User rejected successfully"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Invalid request"
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

**Error (403 Forbidden):**

```json
{
  "error": "Forbidden"
}
```

### Notes

- Updates user's `approval_status` to "approved" or "rejected"
- Records the approving admin's ID in `approved_by` field
- Sets `approved_at` timestamp
- Creates audit log entry with action "user_approved" or "user_rejected"
- Approved users can immediately log in
- Rejected users cannot log in (effectively blocked)
- Action is reversible (can change status later via direct database update)

---

## Approval Workflow

### User Registration Flow

1. User registers via `/api/auth/register`
2. User account created with `approval_status: "pending"`
3. User cannot log in yet

### Admin Approval Flow

1. Admin views pending users via `/api/admin/pending-users`
2. Admin reviews user information
3. Admin approves or rejects via `/api/admin/approve-user`
4. User status updated to "approved" or "rejected"

### Post-Approval

- **Approved users:**
    - Can log in immediately
    - Default role: "user"
    - Profile and NFC link created on first need
    - Receive full system access per role permissions

- **Rejected users:**
    - Cannot log in
    - Account remains in database but inactive
    - Can be deleted manually by admin if needed
    - No notification sent (would need to be implemented)

---

## Approval Best Practices

### Security Considerations

1. **Verify Email Domains**
    - Check if email is from trusted domain
    - Be cautious with generic email providers
    - @wesmun.com emails may need higher privileges

2. **Review Registration Details**
    - Verify name appears legitimate
    - Check for suspicious patterns
    - Look for duplicate or similar entries

3. **Audit Trail**
    - All approvals are logged
    - Includes approving admin's ID
    - Timestamp recorded for compliance

### Workflow Recommendations

1. **Regular Review**
    - Check pending queue daily during active registration periods
    - Set up notifications for new registrations

2. **Batch Processing**
    - Review multiple users at once
    - Look for patterns (e.g., group registrations)

3. **Communication**
    - Consider implementing email notifications
    - Inform rejected users of alternative registration methods

---

## Admin Dashboard Integration

### Typical UI Components

**Pending Users Table:**

```javascript
const PendingUsersTable = () => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetch('/api/admin/pending-users', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setUsers(data.users));
  }, []);
  
  const handleApprove = async (userId, approved) => {
    await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, approved }),
    });
    // Refresh list
  };
  
  return (
    <table>
      {users.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>{new Date(user.created_at).toLocaleDateString()}</td>
          <td>
            <button onClick={() => handleApprove(user.id, true)}>
              Approve
            </button>
            <button onClick={() => handleApprove(user.id, false)}>
              Reject
            </button>
          </td>
        </tr>
      ))}
    </table>
  );
};
```

---

## Code Examples

### Get Pending Users

```javascript
const response = await fetch('/api/admin/pending-users', {
  credentials: 'include',
});

if (response.ok) {
  const data = await response.json();
  console.log('Pending users:', data.users);
  console.log(`Found ${data.users.length} users awaiting approval`);
} else {
  console.error('Failed to fetch pending users');
}
```

### Approve User

```javascript
const approveUser = async (userId) => {
  const response = await fetch('/api/admin/approve-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId: userId,
      approved: true,
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log(data.message); // "User approved successfully"
    return true;
  } else {
    const error = await response.json();
    console.error('Approval failed:', error.error);
    return false;
  }
};
```

### Reject User

```javascript
const rejectUser = async (userId) => {
  const response = await fetch('/api/admin/approve-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId: userId,
      approved: false, // false = reject
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log(data.message); // "User rejected successfully"
    return true;
  } else {
    const error = await response.json();
    console.error('Rejection failed:', error.error);
    return false;
  }
};
```

### Bulk Approval (Custom Implementation)

```javascript
const approveBulkUsers = async (userIds, approved) => {
  const results = await Promise.all(
    userIds.map(userId =>
      fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, approved }),
      }).then(res => res.json())
    )
  );
  
  const successful = results.filter(r => r.success).length;
  console.log(`Successfully processed ${successful}/${userIds.length} users`);
  return results;
};

// Usage
await approveBulkUsers(['id1', 'id2', 'id3'], true);
```

---

## Error Handling

### Common Errors

**Invalid Request:**

- Missing userId or approved parameter
- userId is not a valid UUID
- approved is not a boolean

**Unauthorized:**

- No session token provided
- Session token is invalid or expired
- User is not logged in

**Forbidden:**

- User role lacks `canManageUsers` permission
- Only admins can approve users
- Attempting to approve with non-admin account

### Error Recovery

```javascript
const approveWithRetry = async (userId, approved, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, approved }),
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 401 || response.status === 403) {
        // Don't retry auth errors
        throw new Error('Authentication/Authorization failed');
      }
      
      if (i === maxRetries - 1) {
        throw new Error('Max retries reached');
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
};
```

---

## Database Schema

### Relevant Tables

**users table (approval-related fields):**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role_id INTEGER REFERENCES roles(id),
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Approval Status Values

- `"pending"` - User registered but not yet reviewed
- `"approved"` - User approved and can log in
- `"rejected"` - User rejected and cannot log in

---
