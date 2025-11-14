# Security Documentation

## Overview

This NFC-based MUN management system implements comprehensive security measures to protect user data and prevent unauthorized access.

## Authentication & Authorization

### Email Domain Restriction
- Only `@wesmun.com` email addresses are allowed to register
- Domain validation occurs at both client and server levels
- Database constraint enforces email domain at the data layer

### User Approval Workflow
- New registrations require admin approval
- Users remain in "pending" status until approved
- Only approved users can sign in and access the system
- Rejected users cannot access the system

### Session Management
- Secure HTTP-only cookies prevent XSS attacks
- Session tokens are hashed using SHA-256 before storage
- Sessions expire after 7 days of inactivity
- Automatic cleanup of expired sessions

### Password Security
- Minimum 8 characters required
- Passwords are hashed using SHA-256 (upgrade to bcrypt/argon2 in production)
- No plaintext passwords stored in database

## Role-Based Access Control (RBAC)

### Roles & Permissions

**Admin:**
- Full system access
- Approve/reject user registrations
- Manage user roles
- Create NFC links
- Update all profile fields
- View audit logs

**Security:**
- Scan NFC cards
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
