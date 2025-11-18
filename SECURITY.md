# 🔒 Security Policy

## Overview

NFC WESMUN implements **enterprise-grade security measures** to protect user data, prevent unauthorized access, and maintain system integrity. This document outlines our security architecture, best practices, and vulnerability reporting procedures.

---

## 📋 Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Session Management](#session-management)
- [Password Security](#password-security)
- [Role-Based Access Control](#role-based-access-control)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Database Security](#database-security)
- [Audit & Compliance](#audit--compliance)
- [Security Headers](#security-headers)
- [Vulnerability Reporting](#vulnerability-reporting)
- [Security Best Practices](#security-best-practices)

---

## 🔐 Authentication & Authorization

### Multi-Layer Authentication

Our system implements a **defense-in-depth** approach to authentication:

#### 1. User Registration & Approval
- **Two-Step Process**: Registration followed by admin approval
- **Pending Status**: New users cannot access system until approved
- **Admin Review**: Admins manually verify each registration
- **Rejection Handling**: Rejected users remain in database but cannot login
- **Email Verification**: Future enhancement planned

```typescript
// Registration creates pending user
POST /api/auth/register
{
  "email": "user@wesmun.com",
  "password": "securepass123",
  "name": "John Doe"
}
// Status: "pending" - cannot login yet

// Admin approves
POST /api/admin/approve-user
{
  "userId": "uuid",
  "approved": true
}
// Status: "approved" - can now login
```

#### 2. Email Domain Restrictions

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

#### 3. Login Process

**Security Measures:**
- ✅ Rate limiting on login attempts (IP-based)
- ✅ Secure password verification with bcrypt
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
Password Verification (bcrypt)
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

## 🍪 Session Management

### Secure Session Architecture

#### Session Token Generation
```typescript
// Cryptographically secure random token
const token = crypto.randomBytes(32).toString('hex');
// 64-character hexadecimal string
```

#### Cookie Security Configuration

```typescript
{
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

#### Session Storage

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

#### Session Validation

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

#### Session Cleanup

Expired sessions are automatically cleaned:
- On user logout (immediate deletion)
- On user deletion (cascade delete)
- Periodic cleanup job (recommended)

---

## 🔑 Password Security

### Hashing Algorithm

**bcrypt with cost factor 10**

```typescript
import bcrypt from 'bcrypt';

// Hash password on registration
const hash = await bcrypt.hash(password, 10);

// Verify password on login
const valid = await bcrypt.compare(password, hash);
```

**Why bcrypt?**
- ✅ Industry standard for password hashing
- ✅ Adaptive function - can increase cost over time
- ✅ Built-in salt generation
- ✅ Resistant to rainbow table attacks
- ✅ Slow by design (prevents brute force)

### Password Requirements

**Minimum Requirements:**
- ✅ At least 8 characters
- ✅ No maximum length (within reason)
- ✅ All character types allowed

**Recommended:**
- 12+ characters
- Mix of uppercase, lowercase, numbers, symbols
- No common passwords (future enhancement)
- No reused passwords (future enhancement)

### Password Storage

**What We Store:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- bcrypt hash (nullable for data-only users)
  ...
);
```

**What We NEVER Store:**
- ❌ Plaintext passwords
- ❌ Reversibly encrypted passwords
- ❌ Weak hashes (MD5, SHA1)
- ❌ Password hints or questions

---

## 👥 Role-Based Access Control (RBAC)

### Role Hierarchy

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

| Permission | User | Security | Overseer | Admin | E-Admin |
|------------|------|----------|----------|-------|---------|
| **Authentication** |
| Login/Logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile Access** |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own profile | ❌ | ❌ | ❌ | ✅ | ✅ |
| View all profiles | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Field Updates** |
| bags_checked | ❌ | ✅ | ❌ | ✅ | ✅ |
| attendance | ❌ | ✅ | ❌ | ✅ | ✅ |
| received_food | ❌ | ❌ | ❌ | ✅ | ✅ |
| diet | ❌ | ❌ | ❌ | ✅ | ✅ |
| allergens | ❌ | ❌ | ❌ | ✅ | ✅ |
| **User Management** |
| Create users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Bulk operations | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Role Management** |
| View roles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign roles | ❌ | ❌ | ❌ | ✅ | ✅ |
| **NFC Operations** |
| Scan NFC | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create NFC links | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Admin Functions** |
| Approve users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Export data | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Audit & Logging** |
| View audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |

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

## 🛡️ Data Protection

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

**Additional measures:**
- State parameter for OAuth flows
- Origin header validation
- Referer header checking

---

## 🔌 API Security

### Authentication Required

**All API endpoints (except auth) require authentication:**

```typescript
// Public endpoints (no auth)
POST /api/auth/login
POST /api/auth/register

// Protected endpoints (auth required)
GET /api/users          // + canViewAllUsers permission
GET /api/nfc/[uuid]     // Returns 204 if not authenticated
PATCH /api/users/[id]   // + canManageUsers permission
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

**Future enhancements:**
- API-wide rate limiting
- User-based rate limits
- Exponential backoff
- CAPTCHA integration

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

## 🗄️ Database Security

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
ALTER TABLE sessions 
ADD CONSTRAINT valid_expiry 
CHECK (expires_at > created_at);
```

### Indexing for Performance

```sql
-- Frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_nfc_links_uuid ON nfc_links(uuid);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### Backup & Recovery

**Recommended practices:**
- Daily automated backups
- Point-in-time recovery enabled
- Backup encryption at rest
- Regular restore testing
- Offsite backup storage

---

## 📊 Audit & Compliance

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

### GDPR Compliance

**Right to be Forgotten:**

```typescript
// Bulk delete user's audit logs
DELETE /api/audit/bulk-delete
{
  "logIds": [1, 2, 3, ...]
}

// Delete user account (cascades to profiles, sessions, NFC links)
DELETE /api/users/[userId]
```

**Data Export:**

```typescript
// Export user data in machine-readable format
GET /api/users/export?format=csv&search=user@example.com
```

**Data Minimization:**
- Only collect necessary data
- Allergens field optional
- Images optional
- No tracking beyond audit logs

---

## 🔐 Security Headers

**Recommended security headers:**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Prevent MIME sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block' // XSS protection
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

---

## 🚨 Vulnerability Reporting

### Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

**Instead, please report via:**
- **Email**: security@wesmun.com
- **Subject**: `[SECURITY] Brief description`
- **Include**:
  - Description of the vulnerability
  - Steps to reproduce
  - Potential impact
  - Suggested fix (if any)

### What to Expect

1. **Acknowledgment**: Within 48 hours
2. **Investigation**: 3-5 business days
3. **Fix & Release**: ASAP (depends on severity)
4. **Credit**: Public acknowledgment (if desired)

### Severity Levels

| Level | Response Time | Example |
|-------|---------------|---------|
| **Critical** | 24 hours | Authentication bypass, SQL injection |
| **High** | 3 days | XSS vulnerabilities, privilege escalation |
| **Medium** | 1 week | Information disclosure, CSRF |
| **Low** | 2 weeks | Minor information leaks |

---

## ✅ Security Best Practices

### For Administrators

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of character types
   - Unique per service
   - Use password manager

2. **Enable 2FA** (when available)
   - Reduces account compromise risk
   - Required for Emergency Admin

3. **Review Audit Logs**
   - Check weekly for suspicious activity
   - Monitor failed login attempts
   - Review role changes

4. **Keep Software Updated**
   - Update dependencies regularly
   - Monitor security advisories
   - Apply patches promptly

5. **Limit Admin Accounts**
   - Create admin accounts only when necessary
   - Use principle of least privilege
   - Remove inactive admin accounts

### For Developers

1. **Never Commit Secrets**
   - Use `.env.local` (gitignored)
   - Rotate secrets regularly
   - Use environment variables

2. **Validate All Inputs**
   - Server-side validation required
   - Client-side validation optional
   - Never trust user input

3. **Use Parameterized Queries**
   - Always use `$1, $2` parameters
   - Never concatenate SQL strings
   - Review all database queries

4. **Handle Errors Securely**
   - Generic messages in production
   - Detailed logs server-side only
   - No stack traces to users

5. **Code Review**
   - Security-focused reviews
   - Check for common vulnerabilities
   - Follow OWASP guidelines

### For Users

1. **Choose Strong Passwords**
   - At least 8 characters (12+ recommended)
   - Don't reuse passwords
   - Change if compromised

2. **Logout After Use**
   - Especially on shared devices
   - Sessions expire after 3 days

3. **Report Suspicious Activity**
   - Unusual login notifications
   - Unauthorized profile changes
   - Contact administrators

---

## 📚 Additional Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP Cheat Sheets**: https://cheatsheetseries.owasp.org/
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/
- **Next.js Security**: https://nextjs.org/docs/pages/building-your-application/configuring/content-security-policy

---

## 📝 Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] SESSION_SECRET is cryptographically random
- [ ] DATABASE_URL uses SSL/TLS
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error messages generic
- [ ] Admin account secured
- [ ] Database backups configured
- [ ] Audit logs reviewed

### Post-Deployment

- [ ] Monitor failed login attempts
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate SESSION_SECRET quarterly
- [ ] Test backup restoration quarterly
- [ ] Security audit annually
- [ ] Penetration testing as needed

---

<div align="center">

**Security is an ongoing process, not a one-time task.**

For questions or concerns, contact: **security@wesmun.com**

[⬆ Back to Top](#-security-policy)

</div>
- Update bags_checked and attendance fields
- View all user profiles (read-only for other fields)

**Overseer:**

- View all user data (read-only)
- Access audit logs
- No modification permissions

**User:**

- View own profile only
- No modification permissions

## API Security

### Input Validation

- All user inputs are validated and sanitized
- Maximum length constraints on text fields
- Type checking on all parameters
- UUID format validation

### SQL Injection Prevention

- Parameterized queries used throughout
- No string concatenation in SQL statements
- Database constraints enforce data integrity

### Rate Limiting

- Login attempts limited to 5 per 15 minutes per email
- Prevents brute force attacks
- Automatic lockout after threshold exceeded

### CSRF Protection

- HTTP-only cookies prevent token theft
- SameSite cookie attribute set to 'lax'
- Origin validation on sensitive operations

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

- No credit card or payment information stored
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

## Recommendations for Production

1. **Upgrade Password Hashing:**
    - Replace SHA-256 with bcrypt or argon2
    - Implement password complexity requirements
    - Add password history to prevent reuse

2. **Enable Database RLS:**
    - Implement Row Level Security policies
    - Restrict direct database access
    - Use connection pooling

3. **Add 2FA:**
    - Implement TOTP-based 2FA for admin accounts
    - Require 2FA for sensitive operations

4. **Enhanced Rate Limiting:**
    - Implement API-wide rate limiting
    - Use Redis for distributed rate limiting
    - Add CAPTCHA for repeated failures

5. **Security Headers:**
    - Add Content-Security-Policy
    - Enable HSTS with preload
    - Set X-Frame-Options to DENY

6. **Monitoring & Alerts:**
    - Set up real-time alerts for suspicious activity
    - Monitor failed login attempts
    - Track unusual access patterns

7. **Regular Security Audits:**
    - Conduct penetration testing
    - Review audit logs regularly
    - Update dependencies frequently

## Incident Response

If a security incident is detected:

1. Immediately revoke all active sessions
2. Review audit logs for affected users
3. Notify affected users via email
4. Change database credentials
5. Investigate root cause
6. Implement additional safeguards
7. Document incident and response

## Contact

For security concerns or to report vulnerabilities, contact the system administrator immediately.
