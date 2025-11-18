# Security Documentation

## Authentication & Authorization

Our system implements a **defense-in-depth** approach to authentication:

### 1. User Registration & Approval
- **Two-Step Process**: Registration followed by admin approval
- **Pending Status**: New users cannot access system until approved
- **Admin Review**: Admins manually verify each registration
- **Rejection Handling**: Rejected users remain in database but cannot log in

#### Registration creates pending user

**POST** `/api/auth/register`

Request body:
```json
{
  "email": "user@example.com",
  "password": "secure_pass123",
  "name": "John Doe"
}
```

Result:

```
Status: "pending"  // cannot login yet
```

#### Admin approves user

**POST** `/api/admin/approve-user`

Request body:

```json
{
  "userId": "uuid",
  "approved": true
}
```

Result:

```
Status: "approved"  // can now login
```

### 2. Email Domain Restrictions

**For Elevated Roles** (security, overseer, admin):
- ✅ **@wesmun.com emails only** can have elevated roles
- ✅ Validation at API level before role changes
- ✅ Database constraint prevents bypassing
- ✅ Regular users can have any email domain

```typescript
// Role changes restricted
if (!email.endsWith('@wesmun.com') && newRole !== 'user') {
  throw new Error('Only @wesmun.com emails can have elevated roles');
}
```

### 3. Login Process

**Security Measures:**
- ✅ Rate limiting on login attempts (IP-based)
- ✅ Secure password verification
- ✅ Approval status check before session creation
- ✅ Failed attempt logging for monitoring
- ✅ IP address and user agent capture

**Login Flow:**
```
User Submits Credentials
    ↓
Rate Limit Check (per IP)
    ↓
Email & Password Validation
    ↓
User Exists Check
    ↓
Password Verification
    ↓
Approval Status Check
    ↓
Session Token Generation
    ↓
HTTP-Only Cookie Set
    ↓
Audit Log Created
    ↓
Success Response
```

---

---

## Session Management

### Session Token Generation
```typescript
// Cryptographically secure random token
const token = crypto.randomBytes(32).toString('hex');
// 64-character hexadecimal string
```

### Cookie Security Configuration

```typescript
export const sessionCookieOptions = {
  httpOnly: true,              // Prevents JavaScript access (XSS protection)
  secure: true,                // HTTPS only in production
  sameSite: 'lax',            // CSRF protection
  maxAge: 3 * 24 * 60 * 60,   // 3 days
  path: '/',                   // Available to all routes
}
```

**Security Benefits:**
- ✅ **httpOnly**: Prevents XSS attacks from stealing tokens
- ✅ **secure**: Ensures transmission only over HTTPS
- ✅ **sameSite**: Protects against CSRF attacks
- ✅ **maxAge**: Automatic expiration after 3 days
- ✅ **Path**: Scoped to entire application

### Session Storage

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);
```

**Security Features:**
- ✅ Tokens stored in database (server-side)
- ✅ Automatic cascade delete when user deleted
- ✅ Indexed for fast lookups
- ✅ Expiration timestamp validation
- ✅ One-to-many relationship (multiple devices)

### Session Validation

Every protected endpoint validates sessions:

```typescript
const user = await getCurrentUser(); // Extracts token from cookie
if (!user) {
  return new Response('Unauthorized', { status: 401 });
}

// Checks:
// 1. Token exists in database
// 2. Token hasn't expired
// 3. User still exists and is approved
// 4. User role has required permissions
```

### Session Cleanup

Expired sessions are automatically cleaned:
- On user logout (immediate deletion)
- On user deletion (cascade delete)
- Periodic cleanup job (recommended)

---

## Password Security

### Password Requirements

**Minimum Requirements:**
- ✅ At least 8 characters
- ✅ No maximum length (within reason)
- ✅ All character types allowed

**Recommended:**
- 12+ characters
- Mix of uppercase, lowercase, numbers, symbols

### Password Storage

**What We Store:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) -- Hash (nullable for data-only users)
  -- etc
);
```

**What We NEVER Store:**
- ❌ Plaintext passwords
- ❌ Reversibly encrypted passwords
- ❌ Weak hashes (MD5, SHA1)
- ❌ Password hints or questions

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

> Even though Security has more permissions than Overseer, the role ID is inverted

```
Emergency Admin (env variable)
    ↓
Admin (role_id: 4)
    ↓
Overseer (role_id: 3)
    ↓
Security (role_id: 2)
    ↓
User (role_id: 1)
```

### Detailed Permission Matrix

> This can be changed at any time via the `permissions.ts` file

> ❌ => No Read/Write access
> 📖 => Read access only
> ✅ => Read and Write access

| Permission                    | User | Security | Overseer | Admin | E-Admin |
|-------------------------------|------|----------|----------|-------|---------|
| **Authentication**            |
| Login/Logout                  | ❌    | ✅        | ✅        | ✅     | ✅       |
| **Profile Access**            |
| Update own profile            | ❌    | ❌        | ❌        | ✅     | ✅       |
| View other profiles (Not NFC) | ❌    | ❌        | ❌        | ✅     | ✅       |
| **Field Updates**             |
| bags_checked                  | ❌    | ✅        | 📖       | ✅     | ✅       |
| attendance                    | ❌    | ✅        | 📖       | ✅     | ✅       |
| received_food                 | ❌    | ✅        | 📖       | ✅     | ✅       |
| diet                          | ❌    | 📖       | 📖       | ✅     | ✅       |
| allergens                     | ❌    | 📖       | 📖       | ✅     | ✅       |
| **User Management**           |
| Create users                  | ❌    | ❌        | ❌        | ✅     | ✅       |
| Delete users                  | ❌    | ❌        | ❌        | ✅     | ✅       |
| Bulk user operations          | ❌    | ❌        | ❌        | ✅     | ✅       |
| **Role Management**           |
| Assign roles                  | ❌    | ❌        | ❌        | ✅     | ✅       |
| **NFC Operations**            |
| Scan NFC                      | ❌    | ✅        | 📖       | ✅     | ✅       |
| Create NFC links              | ❌    | ❌        | ❌        | ✅     | ✅       |
| **Admin Functions**           |
| Approve users                 | ❌    | ❌        | ❌        | ✅     | ✅       |
| Export users data             | ❌    | ❌        | ❌        | ✅     | ✅       |
| **Audit & Logging**           |
| View audit logs               | ❌    | ❌        | ❌        | ❌     | ✅       |
| Delete audit logs             | ❌    | ❌        | ❌        | ❌     | ✅       |

### Permission Enforcement

**Every API endpoint checks permissions:**

```typescript
// 1. Authenticate
const user = await getCurrentUser();
if (!user) return unauthorized();

// 2. Check role permission
if (!hasPermission(user.role, 'canManageUsers')) {
  return forbidden();
}

// 3. Check field-level permission (if applicable)
if (updates.diet && !canUpdateField(user.role, 'diet')) {
  return forbidden('Cannot update diet');
}

// 4. Check resource ownership (if applicable)
if (targetUserId === user.id && action === 'delete') {
  return forbidden('Cannot delete own account');
}

// 5. Proceed with operation
```

### Role Assignment Rules

**Restrictions:**
1. ✅ Only admins can assign roles
2. ✅ Only @wesmun.com emails can have elevated roles
3. ✅ Cannot assign role to self
4. ✅ Cannot demote last admin (recommended safeguard)
5. ✅ All role changes logged in audit trail

---

## Data Protection

### Input Validation

**All inputs validated at multiple levels:**

```typescript
// 1. Type validation (TypeScript)
interface LoginRequest {
  email: string;
  password: string;
}

// 2. Required field validation
if (!email || !password) {
  return badRequest('Email and password required');
}

// 3. Format validation
if (!isValidEmail(email)) {
  return badRequest('Invalid email format');
}

// 4. Length validation
if (password.length < 8) {
  return badRequest('Password must be at least 8 characters');
}

// 5. Sanitization
const sanitizedEmail = email.trim().toLowerCase();
```

### SQL Injection Prevention

**Parameterized queries throughout:**

```typescript
// ✅ SAFE - Parameterized
await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ UNSAFE - String concatenation (NEVER DO THIS)
await query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**All queries use pg parameterization:**
- Automatic escaping
- Type coercion
- Prepared statements
- No SQL injection possible

### XSS Prevention

**Multiple protection layers:**

1. **HTTP-Only Cookies**: Session tokens inaccessible to JavaScript
2. **Content Security Policy**: Restricts script execution
3. **Input Sanitization**: User inputs escaped
4. **React Automatic Escaping**: JSX prevents injection
5. **Validation**: Reject malicious inputs

### CSRF Protection

**SameSite Cookie Attribute:**

```typescript
sameSite: 'lax'  // Cookies not sent on cross-site POST requests
```

---

## API Security

### Authentication Required

**All API endpoints (except auth) require authentication:**

```
// Public endpoints (no auth)
POST /api/auth/login
POST /api/auth/register

// Protected endpoints (auth required), Returns 204 if not authenticated
GET /api/users          // + canViewAllUsers permission
GET /api/nfc/[uuid]
PATCH /api/users/[id]   // + canManageUsers permission
// etc
```

### Rate Limiting

**Login attempts rate-limited by IP:**

```typescript
// Track failed attempts per IP
const attempts = await getLoginAttempts(ipAddress);
if (attempts > 5) {
  return tooManyRequests('Too many login attempts');
}
```

### Error Handling

**Secure error messages:**

```typescript
// ✅ GOOD - Generic message
return { error: 'Invalid credentials' };

// ❌ BAD - Reveals information
return { error: 'Password incorrect for user@example.com' };
```

**Environment-specific:**
- **Production**: Generic error messages
- **Development**: Detailed stack traces

---

## Database Security

### Connection Security

```typescript
// SSL/TLS connection
const connectionString = process.env.DATABASE_URL;
// postgresql://user:pass@host:5432/db?sslmode=require
```

### Schema Security

**Foreign Key Constraints:**

```sql
CREATE TABLE profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE nfc_links (
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);
```

**Unique Constraints:**

```sql
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE nfc_links ADD CONSTRAINT nfc_links_uuid_key UNIQUE (uuid);
ALTER TABLE nfc_links ADD CONSTRAINT nfc_links_user_id_key UNIQUE (user_id);
```

**Check Constraints:**

```sql
ALTER TABLE session_tokens 
ADD CONSTRAINT valid_expiry 
CHECK (expires_at > created_at);
```

### Indexing for Performance

```sql
-- Frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_sessions_token ON session_tokens(token_hash);
CREATE INDEX idx_nfc_links_uuid ON nfc_links(uuid);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## Audit Security

### Comprehensive Audit Logging

**Every sensitive action logged:**

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id UUID,                    -- Who did it
  actor_name VARCHAR(255),          -- Historical snapshot
  actor_email VARCHAR(255),         -- Historical snapshot
  target_user_id UUID,              -- Whom it affected
  target_user_name VARCHAR(255),    -- Historical snapshot
  target_user_email VARCHAR(255),   -- Historical snapshot
  action VARCHAR(100) NOT NULL,     -- What was done
  details JSONB,                    -- Additional context
  ip_address INET,                  -- From where
  user_agent TEXT,                  -- With what
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Logged Actions

- `login` / `logout` - Authentication events
- `user_approved` / `user_rejected` - Approval decisions
- `user_delete` - User deletions
- `role_update` - Role changes
- `profile_update` - Profile modifications
- `nfc_scan` - NFC scans
- `nfc_link_create` - NFC link creation

---

## Network Security

### HTTPS Enforcement

- Middleware forces HTTPS in production
- Automatic redirect from HTTP to HTTPS
- Secure cookie flag enabled in production

### Headers Security

- X-Forwarded-For and X-Real-IP tracked for audit logs
- User-Agent logging for forensic analysis

## Audit Logging

### Logged Actions

- User login/logout
- User approval/rejection
- Role changes
- Profile updates
- NFC link creation
- NFC card scans
- User deletion

### Audit Log Data

- Actor (who performed the action)
- Target user (who was affected)
- Action type
- Timestamp
- IP address
- User agent
- Additional details (JSON)

## Data Protection

### Database Security

- Row Level Security (RLS) recommended for production
- Foreign key constraints maintain referential integrity
- Cascade deletes prevent orphaned records
- Indexes optimize query performance

### Sensitive Data

- Allergen information encrypted in transit (HTTPS)
- Email addresses visible only to authorized roles

## NFC Security

### Unauthenticated Scans

- Return 204 No Content (no data leaked)
- Prevents enumeration attacks
- Requires authentication to view user data

### UUID Generation

- Cryptographically secure random UUIDs
- Unpredictable and non-sequential
- Prevents guessing attacks

---
