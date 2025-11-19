# Authentication APIs

This document covers all authentication-related API endpoints.

---

## POST /api/auth/login

Authenticates a user and creates a session.

### Request

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Parameters:**

- `email` (string, required): User's email address
- `password` (string, required): User's password

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Invalid email or password"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Email and password are required"
}
```

### Notes

- Sets an HTTP-only session cookie (`session_token`) that expires in 3 days
- Cookie is secure in production (HTTPS only)
- IP address is logged for rate limiting and audit purposes
- Failed login attempts are rate-limited per IP address

### Implementation Details

- Session token is generated using secure random bytes
- Password verification uses hashing
- User approval status must be "approved" to login
- Automatically creates audit log entry for login attempts

---

## POST /api/auth/register

Registers a new user account (requires approval before login).

### Request

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "Jane Smith"
}
```

**Parameters:**

- `email` (string, required): User's email address (must be unique)
- `password` (string, required): User's password (minimum 8 characters)
- `name` (string, required): User's full name

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Registration successful. Please wait for admin approval."
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Password must be at least 8 characters long"
}
```

```json
{
  "error": "Email already exists"
}
```

### Notes

- New users are created with `approval_status: "pending"`
- Password is hashed before storage
- User cannot login until approved by an admin
- Default role is "user"
- Email must be unique across all users

### Password Requirements

- Minimum length: 8 characters
- No maximum length (reasonable limits enforced by database)

---

## POST /api/auth/logout

Logs out the current user and invalidates the session.

### Request

**Headers:**

```
Cookie: session_token=<token>
```

**Body:** None

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Internal server error"
}
```

### Notes

- Deletes the session from the database
- Clears the session cookie from the browser
- Safe to call even if session is already invalid
- Does not require valid session to execute (no 401 errors)

---

## GET /api/auth/validate

Validates the current session and returns user information.

### Request

**Headers:**

```
Cookie: session_token=<token>
```

### Response

**Success (200 OK):**

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "image": null
  }
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Not authenticated"
}
```

### Notes

- Used to verify session validity on protected pages
- Returns full user profile information
- Session must be valid and not expired
- User must have approval status "approved"

---

## POST /api/auth/validate

Alternative validation endpoint that accepts token in request body.

### Request

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "token": "session_token_value"
}
```

### Response

**Success (200 OK):**

```json
{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "image": null
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Invalid session"
}
```

```json
{
  "error": "No token provided"
}
```

### Notes

- Primarily used for programmatic session validation
- Less common than GET endpoint
- Token must be valid and not expired

---

## Session Management

### Session Token Format

- Cryptographically secure random string
- Stored as HTTP-only cookie
- Valid for 3 days from creation
- Automatically renewed on activity

### Session Security

- **HTTP-only:** Cannot be accessed by JavaScript
- **Secure:** HTTPS-only in production
- **SameSite: Lax:** CSRF protection
- **Path: /** Available to all routes

### Session Storage

Sessions are stored in the PostgreSQL database in the `sessions` table with the following schema:

```sql
CREATE TABLE sessions
(
    id         SERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users (id) ON DELETE CASCADE,
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Session Cleanup

- Expired sessions are automatically cleaned up
- Manual logout deletes session immediately
- User deletion cascades to delete all user sessions

---

## Authentication Flow

1. **User Registration**
    - User submits registration form
    - System creates user with `pending` approval status
    - User cannot login until approved

2. **Admin Approval**
    - Admin reviews pending users
    - Admin approves or rejects user
    - User receives notification (if implemented)

3. **User Login**
    - User submits credentials
    - System validates credentials and approval status
    - Session token generated and set as cookie
    - User redirected to dashboard

4. **Session Validation**
    - Each protected route validates session token
    - Token checked against database
    - User role and permissions verified
    - Expired sessions automatically rejected

5. **User Logout**
    - User initiates logout
    - Session deleted from database
    - Cookie cleared from browser
    - User redirected to login page

---

## Error Codes

| Status Code | Error Message                                 | Description                         |
|-------------|-----------------------------------------------|-------------------------------------|
| 400         | "Email and password are required"             | Missing required fields             |
| 400         | "Password must be at least 8 characters long" | Password too short                  |
| 400         | "Email already exists"                        | Duplicate email during registration |
| 401         | "Invalid email or password"                   | Authentication failed               |
| 401         | "Not authenticated"                           | No valid session                    |
| 401         | "Invalid session"                             | Session token invalid or expired    |
| 500         | "Internal server error"                       | Unexpected server error             |

---

## Code Examples

### Login Example (JavaScript)

```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'mypassword',
    }),
    credentials: 'include', // Important: include cookies
});

if (response.ok) {
    const data = await response.json();
    console.log('Login successful:', data.user);
} else {
    const error = await response.json();
    console.error('Login failed:', error.error);
}
```

### Register Example (JavaScript)

```javascript
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'securepass123',
        name: 'John Doe',
    }),
});

const data = await response.json();
if (data.success) {
    console.log('Registration successful, awaiting approval');
} else {
    console.error('Registration failed:', data.error);
}
```

### Logout Example (JavaScript)

```javascript
const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
});

if (response.ok) {
    window.location.href = '/auth/signin';
}
```

### Validate Session Example (JavaScript)

```javascript
const response = await fetch('/api/auth/validate', {
    credentials: 'include',
});

if (response.ok) {
    const data = await response.json();
    console.log('Current user:', data.user);
} else {
    // Redirect to login
    window.location.href = '/auth/signin';
}
```

