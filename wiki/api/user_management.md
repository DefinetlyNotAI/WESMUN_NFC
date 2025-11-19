# User Management APIs

This document covers all user management API endpoints.

---

## GET /api/users

Retrieves a list of all approved users with their profiles and NFC links.

### Authentication

Required: Yes  
Required Permission: `canViewAllUsers`  
Allowed Roles: `security`, `overseer`, `admin`

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
      "email": "user@example.com",
      "name": "John Doe",
      "image": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "approval_status": "approved",
      "profile": {
        "id": "profile-id",
        "bags_checked": false,
        "attendance": true,
        "received_food": false,
        "diet": "nonveg",
        "allergens": null
      },
      "nfc_link": {
        "id": "nfc-id",
        "uuid": "kptfal4nobb-esj3nkod5g",
        "scan_count": 5,
        "last_scanned_at": "2024-01-20T14:20:00Z"
      },
      "role": {
        "id": 1,
        "name": "user",
        "description": "Regular conference attendee"
      }
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

- Only returns users with `approval_status: "approved"`
- Returns complete user profile including NFC link data
- Users are sorted by creation date (newest first)
- Profile and NFC link data is included as nested JSON objects

---

## PATCH /api/users/[userId]

Updates a specific user's profile or role.

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

**URL Parameters:**

- `userId` (string, required): The user's UUID

**Body:**

```json
{
  "role": "security",
  "diet": "veg",
  "allergens": "peanuts",
  "bags_checked": true,
  "attendance": true,
  "received_food": false
}
```

**Parameters (all optional):**

- `role` (string): New role name (only for @wesmun.com emails)
- `diet` (string): Diet preference ("veg" or "nonveg")
- `allergens` (string): Allergen information (max 500 chars)
- `bags_checked` (boolean): Bag check status
- `attendance` (boolean): Attendance status
- `received_food` (boolean): Food received status

### Response

**Success (200 OK):**

```json
{
  "success": true
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Invalid role"
}
```

**Error (403 Forbidden):**

```json
{
  "error": "Role changes are only allowed for @wesmun.com email accounts"
}
```

**Error (404 Not Found):**

```json
{
  "error": "User not found"
}
```

### Notes

- Role changes are restricted to users with @wesmun.com email addresses
- If profile doesn't exist, it will be created automatically
- Creates audit log entry for all changes
- Cannot update own account (must use different endpoint)
- All fields are optional - only provided fields are updated

---

## DELETE /api/users/[userId]

Deletes a specific user account.

### Authentication

Required: Yes  
Required Permission: `canManageUsers`  
Allowed Roles: `admin`

### Request

**Headers:**

```
Cookie: session_token=<token>
```

**URL Parameters:**

- `userId` (string, required): The user's UUID

### Response

**Success (200 OK):**

```json
{
  "success": true
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Cannot delete your own account"
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

- Cannot delete your own account (security measure)
- Creates audit log entry before deletion
- Cascading delete removes all associated data (profile, NFC links, sessions)
- Action is irreversible
- IP address and user agent are logged

---

## PATCH /api/users/bulk-update

Updates multiple users at once.

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
  "userIds": [
    "user-id-1",
    "user-id-2",
    "user-id-3"
  ],
  "role": "security",
  "diet": "veg",
  "bags_checked": true,
  "attendance": true,
  "allergens": "none"
}
```

**Parameters:**

- `userIds` (string[], required): Array of user UUIDs to update
- `role` (string, optional): New role for all users (requires @wesmun.com emails)
- `diet` (string, optional): Diet preference ("veg" or "nonveg")
- `bags_checked` (boolean, optional): Bag check status
- `attendance` (boolean, optional): Attendance status
- `received_food` (boolean, optional): Food received status
- `allergens` (string, optional): Allergen information

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "updated": 3,
  "missing": []
}
```

**With Missing Users:**

```json
{
  "success": true,
  "updated": 2,
  "missing": [
    "invalid-user-id"
  ]
}
```

**Error (400 Bad Request):**

```json
{
  "error": "userIds must be a non-empty array"
}
```

**Error (403 Forbidden):**

```json
{
  "error": "Role changes only allowed for @wesmun.com accounts",
  "invalid": [
    "user@example.com"
  ]
}
```

### Notes

- All specified users receive the same updates
- Creates profiles if they don't exist
- Role changes only apply to @wesmun.com email accounts
- Missing user IDs are reported but don't cause failure
- Single audit log entry created for entire bulk operation
- Transaction-safe: all or nothing for database consistency

---

## POST /api/users/bulk-delete

Deletes multiple users at once.

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
  "userIds": [
    "user-id-1",
    "user-id-2",
    "user-id-3"
  ]
}
```

**Parameters:**

- `userIds` (string[], required): Array of user UUIDs to delete

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "deleted": 2,
  "missing": [
    "invalid-id"
  ],
  "forbidden": [
    "admin-id"
  ]
}
```

**Error (400 Bad Request):**

```json
{
  "error": "userIds array required"
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

- Cannot delete own account
- Cannot delete admin, security, or overseer role accounts
- Missing user IDs are reported in response
- Forbidden deletions (protected roles) are reported separately
- Creates individual audit log entries for each deletion
- Partial success is possible (some deleted, some forbidden)

---

## POST /api/users/create-data-only

Creates a single data-only user (no login capability).

### Authentication

Required: Yes  
Required Roles: `security`, `admin`

### Request

**Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**Body:**

```json
{
  "email": "delegate@example.com",
  "name": "Jane Delegate",
  "diet": "veg",
  "allergens": "gluten"
}
```

**Parameters:**

- `email` (string, required): User's email address
- `name` (string, required): User's full name
- `diet` (string, optional): Diet preference (default: "nonveg")
- `allergens` (string, optional): Allergen information (max 500 chars)

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Data-only user created successfully",
  "user": {
    "id": "user-uuid",
    "email": "delegate@example.com",
    "name": "Jane Delegate",
    "nfcUuid": "kptfal4nobb-esj3nkod5g"
  }
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Email and name are required"
}
```

```json
{
  "error": "Allergens field too long"
}
```

### Notes

- Creates user without password (cannot login)
- Automatically approved (no pending status)
- NFC link is created automatically
- Profile is created with specified diet and allergens
- Useful for importing delegate lists
- Creates audit log entry

---

## POST /api/users/create-data-only/bulk

Creates multiple data-only users at once.

### Authentication

Required: Yes  
Required Roles: `security`, `admin`

### Request

**Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**Body:**

```json
{
  "users": [
    {
      "email": "delegate1@example.com",
      "name": "John Delegate"
    },
    {
      "email": "delegate2@example.com",
      "name": "Jane Delegate"
    }
  ]
}
```

**Parameters:**

- `users` (array, required): Array of user objects
    - `email` (string, required): User's email
    - `name` (string, required): User's name

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "results": [
    {
      "email": "delegate1@example.com",
      "success": true,
      "message": "Data-only user created successfully",
      "user": {
        "id": "uuid-1",
        "email": "delegate1@example.com",
        "name": "John Delegate",
        "nfcUuid": "uuid-1-nfc"
      }
    },
    {
      "email": "delegate2@example.com",
      "success": true,
      "message": "Data-only user created successfully",
      "user": {
        "id": "uuid-2",
        "email": "delegate2@example.com",
        "name": "Jane Delegate",
        "nfcUuid": "uuid-2-nfc"
      }
    }
  ]
}
```

**With Partial Failures:**

```json
{
  "success": true,
  "results": [
    {
      "email": "delegate1@example.com",
      "success": true,
      "message": "Data-only user created successfully",
      "user": {}
    },
    {
      "email": "existing@example.com",
      "success": false,
      "message": "Email already exists"
    }
  ]
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Invalid user list"
}
```

### Notes

- Processes all users in parallel
- Individual failures don't prevent other users from being created
- Each user creation result is returned separately
- All created users are data-only (no passwords)
- NFC links created automatically for each user
- Audit logs created for each successful creation

---

## GET /api/users/export

Exports user data as CSV or PDF (also supports POST).

### Authentication

Required: Yes  
Required Permission: `canViewAllUsers`  
Allowed Roles: `security`, `overseer`, `admin`

### Request (GET)

**Headers:**

```
Cookie: session_token=<token>
```

**Query Parameters:**

- `format` (string, optional): Export format ("csv" or "pdf", default: "csv")
- `bags` (string, optional): Filter by bags_checked ("true" or "false")
- `attendance` (string, optional): Filter by attendance ("true" or "false")
- `diet` (string, optional): Filter by diet ("veg" or "nonveg")
- `mode` (string, optional): Set to "count" for count-only response
- `countOnly` (string, optional): Alternative to mode=count ("true")

**Example:**

```
GET /api/users/export?format=csv&attendance=true&diet=veg
```

### Request (POST)

**Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**Body:**

```json
{
  "format": "csv",
  "bags": "true",
  "attendance": "true",
  "diet": "veg",
  "mode": "count"
}
```

### Response (Count Mode)

**Success (200 OK):**

```json
{
  "total": 150,
  "filtered": 45
}
```

### Response (CSV Export)

**Success (200 OK):**

```csv
name,email,bags_checked,attendance,received_food,diet,allergens,scan_count,nfc_link
"John Doe",john@example.com,Y,Y,N,nonveg,"",5,https://nfc.wesmun.com/nfc/kptfal4nobb-esj3nkod5g
"Jane Smith",jane@example.com,N,Y,Y,veg,"peanuts",3,https://nfc.wesmun.com/nfc/abc123-def456
```

**Headers:**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=WESMUN_DELEGATE_DATA_2024-01-15.csv
```

### Response (PDF Export)

**Success (200 OK):**
Binary PDF file with formatted user data table.

**Headers:**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename=WESMUN_DELEGATE_DATA_2024-01-15.pdf
```

### Notes

- Only exports users with role "user" and approval_status "approved"
- CSV includes clickable NFC links
- PDF generates formatted table (A4 landscape)
- Filename includes current date
- Filters can be combined
- Count mode useful for UI pagination/stats
- CSV fields are properly escaped for special characters

---

## Code Examples

### Get All Users

```javascript
const response = await fetch('/api/users', {
    credentials: 'include',
});

const data = await response.json();
console.log('Users:', data.users);
```

### Update User

```javascript
const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
        diet: 'veg',
        attendance: true,
        bags_checked: true,
    }),
});

const result = await response.json();
console.log('Update result:', result);
```

### Bulk Update

```javascript
const response = await fetch('/api/users/bulk-update', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
        userIds: ['id1', 'id2', 'id3'],
        attendance: true,
    }),
});

const result = await response.json();
console.log(`Updated ${result.updated} users`);
```

### Export CSV

```javascript
const response = await fetch(
    '/api/users/export?format=csv&attendance=true',
    {credentials: 'include'}
);

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'delegates.csv';
a.click();
```

### Create Bulk Data-Only Users

```javascript
const response = await fetch('/api/users/create-data-only/bulk', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
        users: [
            {email: 'user1@example.com', name: 'User One'},
            {email: 'user2@example.com', name: 'User Two'},
        ],
    }),
});

const data = await response.json();
console.log('Created users:', data.results);
```

