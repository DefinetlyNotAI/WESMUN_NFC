# Security Policy

## Overview

NFC WESMUN implements **enterprise-grade security measures** to protect user data, 
prevent unauthorized access, and maintain system integrity. 
This document outlines our security architecture, best practices, and vulnerability reporting procedures.

---

## Vulnerability Reporting

### Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

**Instead, please report via:**
- **Email**: it@wesmun.com
- **Subject**: `[SECURITY] <Brief description>`
- **Include**:
    - Description of the vulnerability
    - Steps to reproduce
    - Potential impact
    - Suggested fix (if any)

### What to Expect

1. **Acknowledgment**: Within 48 hours
2. **Investigation**: 3-4 business days
3. **Fix & Release**: ASAP (depends on severity)
4. **Credit**: Public acknowledgment (if desired)

---

## Security Best Practices

### For Administrators

1. **Use Strong Passwords**
    - Mix of character types
    - Unique per service
    - Use password manager

2. **Review Audit Logs**
    - Check weekly for suspicious activity
    - Monitor failed login attempts
    - Review role changes

3. **Keep Software Updated**
    - Update dependencies regularly
    - Monitor security advisories
    - Apply patches promptly

4. **Limit Admin Accounts**
    - Create admin accounts only when necessary
    - Use principle of 'least privilege'
    - Remove inactive admin/security/overseer accounts

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

#### Security Headers

**Recommended security headers:**

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
        typescript: {
            ignoreBuildErrors: true
        },
        images: {
            unoptimized: true
        },

        async headers() {
            return [
                {
                    source: '/(.*)',
                    headers: [
                        { key: 'X-Frame-Options', value: 'DENY' },
                        { key: 'X-Content-Type-Options', value: 'nosniff' },
                        { key: 'X-XSS-Protection', value: '1; mode=block' },
                        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                        {
                            key: 'Permissions-Policy',
                            value: 'camera=(), microphone=(), geolocation=()'
                        }
                    ]
                }
            ]
        }
    }

export default nextConfig
```

#### Security Checklist

##### Pre-Deployment

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

##### Post-Deployment

- [ ] Monitor failed login attempts
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate SESSION_SECRET quarterly
- [ ] Test backup restoration quarterly
- [ ] Security audit annually
- [ ] Penetration testing as needed

### For other roles

1. **Choose Strong Passwords**
    - At least 8 characters (12+ recommended)
    - Don't reuse passwords
    - Change if compromised

2. **Logout After Use**
    - Especially on shared devices
    - Sessions expire after 3 days automatically

3. **Report Suspicious Activity**
    - Contact administrators

---

## Incident Response

If a security incident is detected:

1. Immediately revoke all active sessions
2. Review audit logs for affected users
3. Notify affected users via email
4. Change database credentials
5. Investigate root cause
6. Implement additional safeguards
7. Document incident and response
