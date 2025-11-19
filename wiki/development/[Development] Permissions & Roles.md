# Permissions & Roles

This document describes the role-based access control (RBAC) system and permissions in NFC WESMUN.

---

## User Roles

The system has four distinct user roles, each with specific permissions and capabilities.

> NOTE: All permissions are based on the defaults, you can change anything in `permissions.ts` file

### 1. User (Delegate)

**Role Name:** `user`  
**Description:** Regular conference attendee/delegate

**Permissions:**

- ❌ Cannot view own profile
- ❌ Cannot update own profile
- ❌ Cannot view other users
- ❌ Cannot update any fields
- ❌ Cannot manage users
- ❌ Cannot view audit logs
- ❌ Cannot approve users

> Purely data-only

**Use Cases:**

- Conference delegates/attendees data tracking
- Default role for registered users
- Zero system access
- Primarily data subjects, not system users

**Notes:**

- Most restrictive role
- Cannot make any modifications
- Profile updates must be done by admins

---

### 2. Security

**Role Name:** `security`  
**Description:** Security personnel with scanning and check-in privileges

**Permissions:**

- ✅ Can view all users
- ✅ Can update bags_checked field
- ✅ Can update attendance field
- ✅ Can update food received field
- ❌ Cannot update diet
- ❌ Cannot update allergens
- ❌ Cannot manage users (delete/modify roles)
- ❌ Cannot view audit logs
- ❌ Cannot approve users

**Use Cases:**

- Security checkpoint staff
- Bag check operations
- Attendance/check-in scanning
- Entry point monitoring

**Typical Workflow:**

1. Scan delegate's NFC tag at entrance
2. Mark bags_checked if bags inspected
3. Mark attendance to confirm check-in
4. View delegate information for verification

**Notes:**

- Cannot modify dietary or allergen information
- Cannot create or delete users
- Limited to operational fields only
- Ideal for front-line staff

---

### 3. Overseer

**Role Name:** `overseer`  
**Description:** Observer role with read-only access to user data

**Permissions:**

- ✅ Can view all users
- ✅ Can READ-ONLY bags_checked status
- ✅ Can READ-ONLY attendance status
- ✅ Can READ-ONLY diet status
- ✅ Can READ-ONLY allergens status
- ❌ Cannot manage users
- ❌ Cannot view audit logs
- ❌ Cannot approve users

**Use Cases:**

- Conference organizers (read-only)
- Monitoring/reporting staff
- External observers
- Quality assurance personnel

**Typical Workflow:**

1. View user lists and statistics
2. Monitor attendance and check-in rates
3. No modification capabilities

**Notes:**

- Pure read-only role
- Cannot make any modifications
- Useful for delegation without risk

---

### 4. Admin

**Role Name:** `admin`  
**Description:** System administrator with full access

**Permissions:**

- ✅ Can view own profile
- ✅ Can update own profile
- ✅ Can view all users
- ✅ Can update bags_checked field
- ✅ Can update attendance field
- ✅ Can update diet field
- ✅ Can update allergens field
- ✅ Can manage users (create, update, delete)
- ❌ Cannot view audit logs
- ✅ Can approve users

**Use Cases:**

- System administrators
- Conference IT staff
- User management
- Full system control

**Typical Workflow:**

1. Approve pending user registrations
2. Create data-only users (bulk import)
3. Modify user profiles and roles
4. Manage NFC links
5. Delete users if needed
6. Export data for reporting

**Notes:**

- Most powerful regular role
- Cannot view audit logs (security measure)
- Can perform bulk operations
- Can change roles (for @wesmun.com emails only)

---

### 5. Emergency Admin

**Special Role:** Not a database role, but a permission level

**Identification:**

- Email matches `EMERGENCY_ADMIN_USERNAME` environment variable
- OR name is "Emergency Admin"

**Additional Permissions:**

- ✅ All admin permissions
- ✅ Can view audit logs
- ✅ Can delete audit logs
- ✅ Can bulk delete audit logs

**Use Cases:**

- Emergency system access
- Security investigations
- Compliance requests (GDPR)
- Audit log management

**Notes:**

- Bypass normal permission checks
- Should be used sparingly
- Consider two-factor authentication
- Log all emergency admin actions

---

## Field-Level Permissions

Different roles have different permissions for updating specific profile fields.

This is all set in the `permissions.ts` file and controls role-permissions.

### bags_checked

**Permission:** `canUpdateBagsChecked`

**Use Case:** Mark when bags have been checked at security checkpoint

**Typical Values:**

- `false` - Bags not checked (default)
- `true` - Bags checked and cleared

---

### attendance

**Permission:** `canUpdateAttendance`

**Use Case:** Mark when user has checked in to the event

**Typical Values:**

- `false` - Not checked in (default)
- `true` - Checked in and present

---

### received_food

**Permission:** `canUpdateDiet` (shared with diet)

**Use Case:** Track food distribution

**Typical Values:**

- `false` - Food not received (default)
- `true` - Food received

**Note:** Grouped with diet permission for administrative control

---

### diet

**Permission:** `canUpdateDiet`

**Use Case:** Manage dietary preferences for food planning

**Allowed Values:**

- `"veg"` - Vegetarian
- `"nonveg"` - Non-vegetarian

**Default:** `"nonveg"`

---

### allergens

**Permission:** `canUpdateAllergens`

**Use Case:** Track allergen information for safety

**Format:** Free text (max 500 characters)

**Examples:**

- `"peanuts, tree nuts"`
- `"gluten, dairy"`
- `"shellfish"`
- `null` - No allergens

---

## Permission Helper Functions

### hasPermission Function

```typescript
function hasPermission(
    role: UserRole,
    permission: keyof typeof PERMISSIONS.admin
): boolean {}
```

**Usage:**

```typescript
if (hasPermission(user.role, "canManageUsers")) {
    // User can manage users
}
```

**Available Permissions:**

* `canViewOwnProfile`: User can view their own profile details (e.g., on /users/me) and related API reads.
* `canUpdateOwnProfile`: User can update their own profile fields (non-admin self-service edits only).
* `canViewAllUsers`: Can view the full users list and read other users' profiles (e.g., Users page, GET /api/users).
* `canUpdateBagsChecked`: Can update the "bags_checked" field for users (bag check/scan operations in Security flow).
* `canUpdateAttendance`: Can update attendance status for users (check-in/out scanning or manual updates).
* `canUpdateDiet`: Can modify user diet information (e.g., dietary preferences [Vegan status, Food received?] or needs data field).
* `canUpdateAllergens`: Can modify user allergen information (medical/safety data field).
* `canManageUsers`: Full user management actions (create, update, delete, bulk ops, role changes where allowed).
* `canViewAuditLogs`: Can read audit logs (Audit Logs page and /api/audit endpoints).
* `canApproveUsers`: Can approve or reject pending users (Admin approval queue and related endpoints).

---

### canUpdateField Function

```typescript
function canUpdateField(
    role: UserRole,
    field: "bags_checked" | "attendance" | "received_food" | "diet" | "allergens"
): boolean {}
```

**Usage:**

```typescript
if (canUpdateField(user.role, "bags_checked")) {
    // User can update bags_checked field
}
```

**Field to Permission Mapping:**

- `bags_checked` → `canUpdateBagsChecked`
- `attendance` → `canUpdateAttendance`
- `received_food` → `canUpdateDiet`
- `diet` → `canUpdateDiet`
- `allergens` → `canUpdateAllergens`

---

## API Endpoint Permissions

### Authentication Endpoints

| Endpoint                | Required Auth     | Required Permission |
|-------------------------|-------------------|---------------------|
| POST /api/auth/login    | ❌                 | None                |
| POST /api/auth/register | ❌                 | None                |
| POST /api/auth/logout   | ⚠️ Uses to delete | None                |
| GET  /api/auth/validate | ✅                 | None                |
| POST /api/auth/validate | ❌                 | None                |

---

### User Management Endpoints

| Endpoint                              | Required Auth | Required Permission |
|---------------------------------------|---------------|---------------------|
| GET /api/users                        | ✅             | canViewAllUsers     |
| PATCH /api/users/[userId]             | ✅             | canManageUsers      |
| DELETE /api/users/[userId]            | ✅             | canManageUsers      |
| PATCH /api/users/bulk-update          | ✅             | canManageUsers      |
| POST /api/users/bulk-delete           | ✅             | canManageUsers      |
| GET /api/users/export                 | ✅             | canViewAllUsers     |
| POST /api/users/export                | ✅             | canViewAllUsers     |
| POST /api/users/create-data-only      | ✅             | Admin only          |
| POST /api/users/create-data-only/bulk | ✅             | Admin only          |

---

### Admin Endpoints

| Endpoint                     | Required Auth | Required Permission |
|------------------------------|---------------|---------------------|
| GET /api/admin/pending-users | ✅             | canManageUsers      |
| POST /api/admin/approve-user | ✅             | canManageUsers      |

---

### NFC Endpoints

| Endpoint                     | Required Auth | Required Permission           |
|------------------------------|---------------|-------------------------------|
| GET /api/nfc/[uuid]          | ✅             | Any (Returns 204 if not auth) |
| PATCH /api/nfc/[uuid]/update | ✅             | Field-specific (see below)    |
| POST /api/nfc-links          | ✅             | canManageUsers                |

**Field-specific permissions for PATCH /api/nfc/[uuid]/update:**

- `bags_checked`: canUpdateBagsChecked
- `attendance`: canUpdateAttendance
- `received_food`: canUpdateDiet
- `diet`: canUpdateDiet
- `allergens`: canUpdateAllergens

---

### Audit Endpoints

| Endpoint                      | Required Auth | Required Permission  |
|-------------------------------|---------------|----------------------|
| GET /api/audit                | ✅             | Emergency Admin only |
| DELETE /api/audit/[id]        | ✅             | Emergency Admin only |
| DELETE /api/audit/bulk-delete | ✅             | Emergency Admin only |

---

## Role Assignment Rules

### Default Role

- All new registrations: `user`
- Cannot be changed during registration
- Must be changed by admin after approval

### Role Changes

**Restrictions:**

1. Only admins can change roles
2. Only users with @wesmun.com email can have non-user roles
3. Cannot change own role (must be done by another admin)

**API Validation:**

```typescript
// Check if email is eligible for role change
const isWesmunEmail = email.toLowerCase().endsWith("@wesmun.com");

if (!isWesmunEmail && newRole !== "user") {
    throw new Error("Only @wesmun.com emails can have elevated roles");
}
```

---

## Security Considerations

### Principle of 'Least Privilege'

- Users get minimum permissions needed for their role
- No role has unnecessary access
- Separate roles for different operational needs

### Defense in Depth

1. **Authentication:** Session-based with HTTP-only cookies
2. **Authorization:** Role-based permission checks
3. **Field-Level:** Granular permissions per field
4. **Audit Logging:** All actions logged
5. **Email Restrictions:** Elevated roles require @wesmun.com email

### Permission Check Order

1. **Authentication:** Is user logged in?
2. **Session Valid:** Is session not expired?
3. **User Approved:** Is user approval_status = "approved"?
4. **Role Permission:** Does role have required permission?
5. **Field Permission:** (If applicable) Can role update this field?
6. **Resource Access:** Does user have access to this specific resource?

---

## Common Permission Patterns

### Check User Can View All Users

```typescript
import {getCurrentUser} from '@/lib/session';
import {hasPermission} from '@/lib/permissions';

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    if (!hasPermission(user.role, "canViewAllUsers")) {
        return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    // Proceed with logic
}
```

### Check Multiple Field Permissions

```typescript
import {canUpdateField} from '@/lib/permissions';

const updates: UpdateProfileRequest = await request.json();

// Check each field individually
if (updates.bags_checked !== undefined) {
    if (!canUpdateField(user.role, "bags_checked")) {
        return NextResponse.json(
            {error: "Forbidden: Cannot update bags_checked"},
            {status: 403}
        );
    }
}

if (updates.diet !== undefined) {
    if (!canUpdateField(user.role, "diet")) {
        return NextResponse.json(
            {error: "Forbidden: Cannot update diet"},
            {status: 403}
        );
    }
}
```

### Check Emergency Admin

```typescript
const isEmergencyAdmin =
    user.email === process.env.EMERGENCY_ADMIN_USERNAME ||
    user.name === "Emergency Admin";

if (!isEmergencyAdmin) {
    return NextResponse.json({error: "Forbidden"}, {status: 403});
}
```

---

## Best Practices

### For API Development

1. **Always Authenticate First:** Check authentication before authorization
2. **Explicit Denials:** Return 403 for permission failures (not 404)
3. **Audit All Actions:** Log permission-gated operations
4. **Test All Roles:** Verify each role's access in tests
5. **Document Permissions:** Clearly state required permissions in API docs

### For Frontend Development

1. **Hide Unavailable Actions:** Don't show buttons users can't use
2. **Client-Side Checks:** Mirror server permissions in UI
3. **Graceful Degradation:** Handle 403 errors appropriately
4. **Role-Based Rendering:** Show different UI for different roles

### For System Administration

1. **Regular Audits:** Review user roles periodically
2. **Minimal Escalation:** Don't give admin unless necessary
3. **Email Verification:** Verify @wesmun.com emails before role changes
4. **Document Decisions:** Keep records of why roles were assigned
5. **Emergency Admin Sparingly:** Use only when absolutely necessary

---

## Migration & Setup

### Initial Roles Setup

```sql
INSERT INTO roles (name, description)
VALUES ('user', 'Regular conference attendee/delegate'),
       ('security', 'Security personnel with scanning privileges'),
       ('overseer', 'Observer with read-only access'),
       ('admin', 'System administrator with full access');
```

### Promote User to Admin

```sql
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'admin@wesmun.com';
```

### Find Users by Role

```sql
SELECT u.email, u.name, r.name as role
FROM users u
         JOIN roles r ON u.role_id = r.id
WHERE r.name = 'admin';
```

---

