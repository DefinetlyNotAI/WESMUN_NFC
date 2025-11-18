# NFC WESMUN API Documentation

Welcome to the NFC WESMUN API documentation. This wiki provides comprehensive documentation for all available APIs in
the NFC WESMUN system.

## Table of Contents

1. [Authentication APIs](./authentication-api.md)
2. [User Management APIs](./user-management-api.md)
3. [Admin APIs](./admin-api.md)
4. [NFC APIs](./nfc-api.md)
5. [Audit APIs](./audit-api.md)
6. [Data Types](./data-types.md)
7. [Permissions & Roles](./permissions-roles.md)
8. [Error Handling](./error-handling.md)

## Overview

The NFC WESMUN system is a Next.js application that provides NFC-based user management for the WESMUN conference. It
includes:

- User authentication and authorization
- Role-based access control (RBAC)
- NFC link generation and scanning
- User profile management
- Audit logging
- Bulk operations support
- CSV/PDF export functionality

## Base URL

```
Production: https://nfc.wesmun.com
Development: http://localhost:3000
```

## Authentication

All API endpoints (except login and register) require authentication via HTTP-only session cookies. The session token is
set automatically after successful login.

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    ...
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Additional error details (dev only)"
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Login attempts are rate-limited by IP address to prevent brute force attacks.

## Getting Started

1. Review the [Authentication APIs](./authentication-api.md) to understand how to authenticate users
2. Check [Permissions & Roles](./permissions-roles.md) to understand access control
3. Explore specific API categories based on your needs

## Quick Links

- [User Roles](./permissions-roles.md#user-roles)
- [Data Types](./data-types.md)
- [Bulk Operations](./user-management-api.md#bulk-operations)
- [Export Functionality](./user-management-api.md#export-users)

