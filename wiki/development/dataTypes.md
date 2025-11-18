# Data Types

This document describes all data types and interfaces used throughout the NFC WESMUN API.

---

## Database Types

### UserRole

Enum representing user roles in the system.

```typescript
type UserRole = "user" | "security" | "overseer" | "admin"
```

**Values:**

- `"user"` - Regular conference attendee/delegate
- `"security"` - Security personnel with scanning privileges
- `"overseer"` - Observer role with read-only access
- `"admin"` - Administrator with full system access

---

### DietType

Enum representing dietary preferences.

```typescript
type DietType = "veg" | "nonveg"
```

**Values:**

- `"veg"` - Vegetarian diet
- `"nonveg"` - Non-vegetarian diet

**Notes:**

- Default value: `"nonveg"`
- Used for food distribution planning
- Simplified to two options for operational efficiency

---

### ApprovalStatus

User approval status enum.

```typescript
type ApprovalStatus = "pending" | "approved" | "rejected"
```

**Values:**

- `"pending"` - User registered but awaiting approval
- `"approved"` - User approved and can access system
- `"rejected"` - User registration rejected

---

## Database Models

### Role

Role definition in the system.

```typescript
interface Role {
    id: number
    name: UserRole
    description: string | null
    created_at: Date
}
```

**Fields:**

- `id` - Primary key (integer)
- `name` - Role name (UserRole enum)
- `description` - Optional role description
- `created_at` - Role creation timestamp

**Database Table:**

```sql
CREATE TABLE roles
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

### User

User account information.

```typescript
interface User {
    id: string // UUID
    email: string
    name: string
    image: string | null
    role_id: number
    created_at: Date
    updated_at: Date
    password_hash: string
    approval_status: "pending" | "approved" | "rejected"
    role_name: UserRole
}
```

**Fields:**

- `id` - UUID primary key
- `email` - Unique email address
- `name` - Full name
- `image` - Optional profile image URL
- `role_id` - Foreign key to roles table
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `password_hash` - Hashed password (nullable for data-only users)
- `approval_status` - Approval state
- `role_name` - Denormalized role name (from join)

**Database Table:**

```sql
CREATE TABLE users
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255)        NOT NULL,
    image           VARCHAR(500),
    role_id         INTEGER REFERENCES roles (id),
    password_hash   VARCHAR(255),
    approval_status VARCHAR(20)      DEFAULT 'pending',
    approved_by     UUID REFERENCES users (id),
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP        DEFAULT NOW(),
    updated_at      TIMESTAMP        DEFAULT NOW()
);
```

---

### Profile

User profile with event-specific data.

```typescript
interface Profile {
    id: string // UUID
    user_id: string // UUID
    bags_checked: boolean
    attendance: boolean
    received_food: boolean
    diet: DietType
    allergens: string | null
    created_at: Date
    updated_at: Date
}
```

**Fields:**

- `id` - UUID primary key
- `user_id` - Foreign key to users table (one-to-one)
- `bags_checked` - Whether bags have been checked at security
- `attendance` - Whether user has checked in
- `received_food` - Whether user has received meal
- `diet` - Dietary preference
- `allergens` - Free-text allergen information (max 500 chars)
- `created_at` - Profile creation timestamp
- `updated_at` - Last update timestamp

**Database Table:**

```sql
CREATE TABLE profiles
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    bags_checked  BOOLEAN          DEFAULT FALSE,
    attendance    BOOLEAN          DEFAULT FALSE,
    received_food BOOLEAN          DEFAULT FALSE,
    diet          VARCHAR(20)      DEFAULT 'nonveg',
    allergens     VARCHAR(500),
    created_at    TIMESTAMP        DEFAULT NOW(),
    updated_at    TIMESTAMP        DEFAULT NOW()
);
```

**Default Values:**

- `bags_checked`: false
- `attendance`: false
- `received_food`: false
- `diet`: "nonveg"
- `allergens`: null

---

### NfcLink

NFC link associated with a user.

```typescript
interface NfcLink {
    id: string // UUID
    user_id: string // UUID
    uuid: string
    created_at: Date
    last_scanned_at: Date | null
    scan_count: number
}
```

**Fields:**

- `id` - UUID primary key
- `user_id` - Foreign key to users table (one-to-one)
- `uuid` - NFC UUID (unique, custom format)
- `created_at` - Link creation timestamp
- `last_scanned_at` - Timestamp of most recent scan (null if never scanned)
- `scan_count` - Total number of scans

**Database Table:**

```sql
CREATE TABLE nfc_links
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    uuid            VARCHAR(100) UNIQUE NOT NULL,
    created_at      TIMESTAMP        DEFAULT NOW(),
    last_scanned_at TIMESTAMP,
    scan_count      INTEGER          DEFAULT 0
);
```

**UUID Format:**

- Custom format: `[a-z0-9]+-[a-z0-9]+`
- Example: `kptfal4nobb-esj3nkod5g`
- Length: 10-50 characters
- Base36 encoding

---

## API Request Types

### UpdateUserRequest

Request body for updating a user.

```typescript
interface UpdateUserRequest {
    role?: UserRole
    diet?: DietType
    allergens?: string
    bags_checked?: boolean
    attendance?: boolean
    received_food?: boolean
}
```

**All fields optional** - only provided fields are updated.

**Constraints:**

- `role`: Only for @wesmun.com email addresses
- `allergens`: Max 500 characters

---

### BulkUpdateBody

Request body for bulk user updates.

```typescript
interface BulkUpdateBody {
    userIds: string[] // Required
    role?: UserRole
    diet?: DietType
    bags_checked?: boolean
    attendance?: boolean
    received_food?: boolean
    allergens?: string | null
}
```

**Required:**

- `userIds`: Non-empty array of user UUIDs

**Optional:**

- All other fields (applied to all users in array)

---

### BulkDeleteBody

Request body for bulk user deletion.

```typescript
interface BulkDeleteBody {
    userIds?: string[]
}
```

**Fields:**

- `userIds`: Array of user UUIDs to delete

---

### ExportParams

Parameters for user export functionality.

```typescript
interface ExportParams {
    format: "csv" | "pdf"
    filterBags?: boolean
    filterAttendance?: boolean
    filterDiet?: DietType
    countOnly?: boolean
}
```

**Fields:**

- `format`: Export file format
- `filterBags`: Filter by bags_checked status
- `filterAttendance`: Filter by attendance status
- `filterDiet`: Filter by diet preference
- `countOnly`: Return count instead of data (for UI)

---

### ExportRow

Single row in export data.

```typescript
interface ExportRow {
    name: string
    email: string
    bags_checked: boolean
    attendance: boolean
    received_food: boolean
    diet: DietType | null
    allergens: string | null
    scan_count: number
    uuid: string | null
}
```

**CSV Format:**

```csv
name,email,bags_checked,attendance,received_food,diet,allergens,scan_count,nfc_link
"John Doe",john@example.com,Y,Y,N,nonveg,"peanuts",5,https://nfc.wesmun.com/nfc/abc123
```

---

### AuditLogParams

Parameters for audit log queries.

```typescript
interface AuditLogParams {
    limit?: number // 1-500, default 100
    offset?: number // >= 0, default 0
    action?: string // Filter by action type
    search?: string // Search across multiple fields
}
```

---

### CreateAuditLogParams

Parameters for creating audit log entries.

```typescript
interface CreateAuditLogParams {
    actorId?: string | null
    targetUserId?: string | null
    action: string // Required
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}
```

**Required:**

- `action`: Action type string

**Optional:**

- `actorId`: User performing action (null for system actions)
- `targetUserId`: User being acted upon
- `details`: Action-specific JSON data
- `ipAddress`: IP address of actor
- `userAgent`: User agent string of actor

---

### CreatedUser

Response for user creation operations.

```typescript
interface CreatedUser {
    email: string
    success: boolean
    message: string
    user?: {
        id: string
        email: string
        name: string
        nfcUuid?: string
    }
}
```

**Fields:**

- `email`: Email of created user
- `success`: Whether creation succeeded
- `message`: Success or error message
- `user`: Created user data (only if success)

---

### CreateUserData

Data for creating a new user.

```typescript
interface CreateUserData {
    name: string // Required
    email: string // Required
    diet?: DietType
    allergens?: string
}
```

**Required:**

- `name`: Full name
- `email`: Email address

**Optional:**

- `diet`: Dietary preference (default: "nonveg")
- `allergens`: Allergen information

---

### NfcUpdateRequest

Request body for NFC-based profile updates.

```typescript
interface NfcUpdateRequest {
    bags_checked?: boolean
    attendance?: boolean
    received_food?: boolean
}
```

**All fields optional.**

**Note:** Diet and allergen updates not included (security/admin only).

---

### UpdateProfileRequest

Request body for profile updates (admin/full access).

```typescript
interface UpdateProfileRequest {
    bags_checked?: boolean
    attendance?: boolean
    received_food?: boolean
    diet?: DietType
    allergens?: string
}
```

**All fields optional.**

**Constraints:**

- `allergens`: Max 500 characters

---

### ApprovalRequest

Request body for user approval/rejection.

```typescript
interface ApprovalRequest {
    userId: string // Required
    approved: boolean // Required
}
```

**Fields:**

- `userId`: UUID of user to approve/reject
- `approved`: true = approve, false = reject

---

### PendingUser

Pending user information.

```typescript
interface PendingUser {
    id: string
    name: string
    email: string
    created_at: string // ISO 8601
    approval_status: string // Always "pending"
}
```

---

### CreateNfcLinkRequest

Request body for creating NFC links.

```typescript
interface CreateNfcLinkRequest {
    userId: string // Required
}
```

**Fields:**

- `userId`: UUID of user to create NFC link for

---

## API Response Types

### Standard Success Response

```typescript
interface SuccessResponse<T = any> {
    success: true
    message?: string
    data?: T
}
```

### Standard Error Response

```typescript
interface ErrorResponse {
    error: string
    details?: string // Development only
    errorType?: string // Development only
    timestamp?: string // ISO 8601
}
```

### Login Response

```typescript
interface LoginResponse {
    success: true
    message: string
    user: {
        id: string
        email: string
        name: string
        role: UserRole
        image: string | null
    }
}
```

### Validate Response

```typescript
interface ValidateResponse {
    user: {
        id: string
        email: string
        name: string
        role: UserRole
        image: string | null
    }
}
```

### NFC Scan Response

```typescript
interface NfcScanResponse {
    user: {
        id: string
        name: string
        email: string
        image: string | null
        role: Role
    }
    profile: Profile
    nfc_link: NfcLink
}
```

### Users List Response

```typescript
interface UsersListResponse {
    users: Array<User & {
        profile: Profile
        nfc_link: NfcLink
        role: Role
    }>
}
```

### Audit Logs Response

```typescript
interface AuditLogsResponse {
    logs: Array<{
        id: number
        action: string
        details: Record<string, any>
        ip_address: string | null
        user_agent: string | null
        created_at: string // ISO 8601
        actor: {
            id: string | null
            name: string | null
            email: string | null
        }
        target_user: {
            id: string | null
            name: string | null
            email: string | null
        }
    }>
    total: number
}
```

### Export Count Response

```typescript
interface ExportCountResponse {
    total: number // Total users matching base criteria
    filtered: number // Users after applying filters
}
```

### Bulk Delete Response

```typescript
interface BulkDeleteResponse {
    success: true
    deleted: number
    missing: string[] // User IDs not found
    forbidden: string[] // User IDs that cannot be deleted
}
```

### Bulk Update Response

```typescript
interface BulkUpdateResponse {
    success: true
    updated: number
    missing: string[] // User IDs not found
}
```

### Bulk Create Response

```typescript
interface BulkCreateResponse {
    success: true
    results: CreatedUser[]
}
```

---

## Common Validation Rules

### Email

- Format: RFC 5322 compliant
- Must be unique across all users
- Case-insensitive comparison
- No length limit (reasonable database limit applies)

### Password

- Minimum length: 8 characters
- No maximum (reasonable limit)
- Stored as hash (never plaintext)

### Name

- Required field
- Max length: 255 characters
- Any UTF-8 characters allowed

### Allergens

- Max length: 500 characters
- Optional field
- Free-text format
- UTF-8 encoded

### UUID Format

- Standard UUID v4 for database IDs
- Custom NFC UUID for NFC links
- Both formats use hyphen separators

### Date/Time Format

- Stored as PostgreSQL TIMESTAMP
- Returned as ISO 8601 string
- Example: `2024-01-15T10:30:00.000Z`
- Timezone: UTC

---

## Type Guards

Useful TypeScript type guards for runtime validation:

```typescript
// Type reminder
type UserRole = "user" | "security" | "overseer" | "admin"
type DietType = "veg" | "nonveg"

// Check if string is valid UserRole
function isUserRole(value: string): value is UserRole {
    return ["user", "security", "overseer", "admin"].includes(value);
}

// Check if string is valid DietType
function isDietType(value: string): value is DietType {
    return ["veg", "nonveg"].includes(value);
}

// Check if string is valid NFC UUID format
function isValidNfcUuid(uuid: string): boolean {
    const regex = /^[a-z0-9]+-[a-z0-9]+$/i;
    return regex.test(uuid) && uuid.length >= 10 && uuid.length <= 50;
}

// Check if string is valid email
function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Check if value is valid UUID v4
function isValidUuid(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}
```

---

## Example Usage

### Creating a User (TypeScript)

```typescript
import type {CreateUserData, CreatedUser} from '@/types/api';

const userData: CreateUserData = {
    name: "John Doe",
    email: "john@example.com",
    diet: "veg",
    allergens: "peanuts"
};

const response = await fetch('/api/users/create-data-only', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify(userData)
});

const result: CreatedUser = await response.json();
if (result.success) {
    console.log(`Created user: ${result.user?.id}`);
}
```

### Updating User Profile (TypeScript)

```typescript
import type {UpdateUserRequest} from '@/types/api';

const updates: UpdateUserRequest = {
    diet: "veg",
    allergens: "gluten, dairy",
    bags_checked: true,
    attendance: true
};

await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify(updates)
});
```

### Type-Safe Audit Log Query

```typescript
import type {AuditLogParams, AuditLogsResponse} from '@/types/api';

const params: AuditLogParams = {
    limit: 50,
    offset: 0,
    action: 'nfc_scan',
    search: 'john@example.com'
};

const queryString = new URLSearchParams(
    Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
).toString();

const response = await fetch(`/api/audit?${queryString}`, {
    credentials: 'include'
});

const data: AuditLogsResponse = await response.json();
console.log(`Found ${data.total} logs`);
```

