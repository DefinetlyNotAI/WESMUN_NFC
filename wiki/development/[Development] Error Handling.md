# Error Handling

This document describes error handling patterns, status codes, and best practices throughout the NFC WESMUN API.

---

## HTTP Status Codes

### Success Codes (2xx)

#### 200 OK

**Meaning:** Request succeeded  
**When Used:**

- Successful data retrieval
- Successful updates
- Successful deletions
- Most successful operations

**Example Response:**

```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

---

#### 201 Created

**Meaning:** Resource created successfully  
**When Used:**

- User registration (not currently used)
- Resource creation endpoints

**Example Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "...": "..."
  }
}
```

---

#### 204 No Content

**Meaning:** Success with no response body  
**When Used:**

- Unauthenticated NFC scan (security feature)

**Example:**

```
GET /api/nfc/[uuid] (not authenticated)
→ 204 No Content
(Empty response body)
```

**Purpose:** Prevents exposing authentication requirement to scanners

---

### Client Error Codes (4xx)

#### 400 Bad Request

**Meaning:** Invalid request parameters or data  
**When Used:**

- Missing required fields
- Invalid field values
- Malformed JSON
- Validation failures

**Common Scenarios:**

**Missing Required Fields:**

```json
{
  "error": "Email and password are required"
}
```

**Validation Failure:**

```json
{
  "error": "Password must be at least 8 characters long"
}
```

**Invalid UUID Format:**

```json
{
  "error": "Invalid UUID format"
}
```

**Invalid Parameter Range:**

```json
{
  "error": "Invalid limit parameter"
}
```

---

#### 401 Unauthorized

**Meaning:** Authentication required or failed  
**When Used:**

- No session token provided
- Session token invalid or expired
- Wrong credentials

**Common Scenarios:**

**Not Authenticated:**

```json
{
  "error": "Unauthorized"
}
```

**Invalid Credentials:**

```json
{
  "error": "Invalid email or password"
}
```

**Session Expired:**

```json
{
  "error": "Not authenticated"
}
```

**Invalid Session:**

```json
{
  "error": "Invalid session"
}
```

---

#### 403 Forbidden

**Meaning:** Authenticated but insufficient permissions  
**When Used:**

- User lacks required role
- User lacks required permission
- Action not allowed for this user

**Common Scenarios:**

**Insufficient Permissions:**

```json
{
  "error": "Forbidden"
}
```

**Specific Permission Denial:**

```json
{
  "error": "Forbidden: Cannot update bags_checked"
}
```

**Role Restriction:**

```json
{
  "error": "Role changes are only allowed for @wesmun.com email accounts"
}
```

**Self-Action Prevention:**

```json
{
  "error": "Cannot delete your own account"
}
```

---

#### 404 Not Found

**Meaning:** Requested resource does not exist  
**When Used:**

- User ID not found
- NFC UUID not found
- Audit log not found

**Common Scenarios:**

**Resource Not Found:**

```json
{
  "error": "User not found"
}
```

**NFC Link Not Found:**

```json
{
  "error": "NFC link not found"
}
```

**With Additional Context:**

```json
{
  "error": "User not found or not approved"
}
```

**Audit Log Not Found:**

```json
{
  "error": "Log not found"
}
```

---

#### 307 Temporary Redirect

**Meaning:** Resource temporarily at different location  
**When Used:**

- Numeric user ID provided instead of NFC UUID

**Response:**

```json
{
  "redirect": true,
  "correctUuid": "kptfal4nobb-esj3nkod5g",
  "message": "Redirecting to NFC UUID"
}
```

**Client Handling:**

```javascript
const response = await fetch(`/api/nfc/${id}`);
const data = await response.json();

if (data.redirect) {
    // Make new request with correct UUID
    return fetch(`/api/nfc/${data.correctUuid}`);
}
```

---

### Server Error Codes (5xx)

#### 500 Internal Server Error

**Meaning:** Unexpected server error  
**When Used:**

- Database errors
- Unexpected exceptions
- Unhandled errors

**Production Response:**

```json
{
  "error": "Internal server error"
}
```

**Development Response:**

```json
{
  "error": "Database connection failed",
  "errorType": "DatabaseError",
  "details": "Connection timeout after 5000ms",
  "timestamp": "2024-01-20T14:30:00.000Z"
}
```

---

## Error Response Format

### Standard Error Response

```typescript
interface ErrorResponse {
    error: string // Human-readable error message (required)
    details?: string // Additional details (development only)
    errorType?: string // Error class name (development only)
    timestamp?: string // ISO 8601 timestamp (some endpoints)
}
```

### Examples

**Simple Error:**

```json
{
  "error": "User not found"
}
```

**Detailed Error (Development):**

```json
{
  "error": "Failed to create user",
  "errorType": "PostgresError",
  "details": "duplicate key value violates unique constraint \"users_email_key\"",
  "timestamp": "2024-01-20T14:30:00.000Z"
}
```

**Validation Error with Context:**

```json
{
  "error": "Role changes only allowed for @wesmun.com accounts",
  "invalid": [
    "user@example.com",
    "another@example.com"
  ]
}
```

---

## Common Error Scenarios

### Authentication Errors

#### Missing Session Token

```
Request: GET /api/users
Headers: (no Cookie header)

Response: 401 Unauthorized
{
  "error": "Unauthorized"
}
```

#### Expired Session

```
Request: GET /api/users
Headers: Cookie: session_token=expired_token

Response: 401 Unauthorized
{
  "error": "Not authenticated"
}
```

#### Wrong Credentials

```
Request: POST /api/auth/login
Body: { "email": "user@example.com", "password": "wrong" }

Response: 401 Unauthorized
{
  "error": "Invalid email or password"
}
```

---

### Authorization Errors

#### Insufficient Permissions

```
Request: GET /api/users
User Role: user (not security/overseer/admin)

Response: 403 Forbidden
{
  "error": "Forbidden"
}
```

#### Field Update Denied

```
Request: PATCH /api/nfc/[uuid]/update
Body: { "diet": "veg" }
User Role: security

Response: 403 Forbidden
{
  "error": "Forbidden: Cannot update diet"
}
```

---

### Validation Errors

#### Missing Required Fields

```
Request: POST /api/auth/login
Body: { "email": "user@example.com" }

Response: 400 Bad Request
{
  "error": "Email and password are required"
}
```

#### Password Too Short

```
Request: POST /api/auth/register
Body: { "email": "...", "password": "short", "name": "..." }

Response: 400 Bad Request
{
  "error": "Password must be at least 8 characters long"
}
```

#### Field Too Long

```
Request: PATCH /api/nfc/[uuid]/update
Body: { "allergens": "very long string exceeding 500 characters..." }

Response: 400 Bad Request
{
  "error": "Allergens field too long"
}
```

---

### Resource Not Found Errors

#### User Not Found

```
Request: PATCH /api/users/invalid-uuid
Body: { ... }

Response: 404 Not Found
{
  "error": "User not found"
}
```

#### NFC Link Not Found

```
Request: GET /api/nfc/invalid-uuid

Response: 404 Not Found
{
  "error": "NFC link not found"
}
```

---

### Database Errors

#### Duplicate Email

```
Request: POST /api/auth/register
Body: { "email": "existing@example.com", ... }

Response: 400 Bad Request
{
  "error": "Email already exists"
}
```

#### Duplicate NFC Link

```
Request: POST /api/nfc-links
Body: { "userId": "user-with-existing-link" }

Response: 400 Bad Request
{
  "error": "User already has an NFC link"
}
```

#### Foreign Key Violation

```
Request: POST /api/nfc-links
Body: { "userId": "non-existent-user-id" }

Response: 404 Not Found
{
  "error": "User not found or not approved"
}
```

---

## Error Handling Patterns

### Try-Catch Pattern

All API routes follow this pattern:

```typescript
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }

        // 2. Authorize
        if (!hasPermission(user.role, "requiredPermission")) {
            return NextResponse.json(
                {error: "Forbidden"},
                {status: 403}
            );
        }

        // 3. Validate
        const params = await validateParams(request);

        // 4. Execute
        const result = await performOperation(params);

        // 5. Respond
        return NextResponse.json({success: true, data: result});

    } catch (error) {
        console.error("[WESMUN] Error:", error);

        // Development: detailed errors
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json(
                {
                    error: error instanceof Error ? error.message : "Unknown error",
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    details: error instanceof Error ? error.stack : undefined,
                },
                {status: 500}
            );
        }

        // Production: generic error
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        );
    }
}
```

---

### Validation Pattern

```typescript
// Validate input
if (!email || !password) {
    return NextResponse.json(
        {error: "Email and password are required"},
        {status: 400}
    );
}

if (password.length < 8) {
    return NextResponse.json(
        {error: "Password must be at least 8 characters long"},
        {status: 400}
    );
}

if (allergens && allergens.length > 500) {
    return NextResponse.json(
        {error: "Allergens field too long"},
        {status: 400}
    );
}
```

---

### Database Error Handling

```typescript
try {
    await query("INSERT INTO users ...", values);
} catch (error) {
    // Handle specific database errors
    if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
            return NextResponse.json(
                {error: "Email already exists"},
                {status: 400}
            );
        }

        if (error.message.includes("foreign key")) {
            return NextResponse.json(
                {error: "Referenced resource not found"},
                {status: 404}
            );
        }
    }

    // Re-throw for generic handler
    throw error;
}
```

---

## Client-Side Error Handling

### Basic Fetch Error Handling

```javascript
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new APIError(error.error, response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof APIError) {
            // Handle API errors
            console.error(`API Error (${error.status}):`, error.message);
            throw error;
        }

        // Handle network errors
        console.error('Network Error:', error);
        throw new Error('Network request failed');
    }
}
```

---

### Custom Error Class

```javascript
class APIError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'APIError';
        this.status = status;
    }

    isAuthError() {
        return this.status === 401;
    }

    isPermissionError() {
        return this.status === 403;
    }

    isNotFoundError() {
        return this.status === 404;
    }

    isValidationError() {
        return this.status === 400;
    }

    isServerError() {
        return this.status >= 500;
    }
}
```

---

### Error Handling by Status Code

```javascript
async function handleRequest() {
    try {
        const data = await apiRequest('/api/users');
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            switch (error.status) {
                case 401:
                    // Redirect to login
                    window.location.href = '/auth/signin';
                    break;

                case 403:
                    // Show permission error
                    showNotification('You do not have permission for this action', 'error');
                    break;

                case 404:
                    // Show not found error
                    showNotification('Resource not found', 'error');
                    break;

                case 400:
                    // Show validation error
                    showNotification(error.message, 'warning');
                    break;

                case 500:
                    // Show server error
                    showNotification('Server error. Please try again later.', 'error');
                    break;

                default:
                    showNotification('An error occurred', 'error');
            }
        } else {
            // Network error
            showNotification('Network error. Please check your connection.', 'error');
        }
    }
}
```

---

### React Hook for API Requests

```javascript
import {useState, useCallback} from 'react';

function useAPI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (url, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new APIError(error.error, response.status);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {request, loading, error};
}

// Usage
function MyComponent() {
    const {request, loading, error} = useAPI();

    const loadUsers = async () => {
        try {
            const data = await request('/api/users');
            console.log('Users:', data.users);
        } catch (err) {
            if (err instanceof APIError && err.isAuthError()) {
                // Handle auth error
            }
        }
    };

    return (
        <div>
            {loading && <Spinner/>}
            {error && <ErrorMessage error={error}/>}
            <button onClick={loadUsers}>Load Users</button>
        </div>
    );
}
```

---

## Logging Best Practices

### Server-Side Logging

```typescript
// Use consistent log prefix
console.log("[WESMUN] Operation started");
console.error("[WESMUN] Error occurred:", error);

// Log important details
console.log("[WESMUN] Login attempt for:", email);
console.log("[WESMUN] User role:", user.role);
console.log("[WESMUN] IP address:", ipAddress);

// Log full error details
console.error("[WESMUN] ===== ERROR =====");
console.error("[WESMUN] Error Type:", error.constructor.name);
console.error("[WESMUN] Error Message:", error.message);
console.error("[WESMUN] Error Stack:", error.stack);
console.error("[WESMUN] ===== END ERROR =====");

// Avoid logging sensitive data
// ❌ Don't log passwords, tokens, or PII
console.log("[WESMUN] Password:", password); // NEVER DO THIS
console.log("[WESMUN] Session token:", token); // NEVER DO THIS

// ✅ Log sanitized data
console.log("[WESMUN] Password provided:", !!password);
console.log("[WESMUN] Session exists:", !!token);
```

---

### Client-Side Logging

```javascript
// Log errors with context
console.error('API Error:', {
    url: request.url,
    method: request.method,
    status: response.status,
    error: error.message,
});

// Use appropriate log levels
console.log('Info: User logged in'); // Info
console.warn('Warning: Session expiring soon'); // Warning
console.error('Error: Request failed'); // Error

// Group related logs
console.group('API Request');
console.log('URL:', url);
console.log('Method:', method);
console.log('Body:', body);
console.groupEnd();
```

---

## Error Recovery Strategies

### Retry Logic

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);

            // Don't retry client errors (except 429 rate limit)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                throw new Error('Client error, no retry');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            // Exponential backoff
            await new Promise(resolve =>
                setTimeout(resolve, Math.pow(2, i) * 1000)
            );
        }
    }
}
```

---

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }

    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }
}

// Usage
const breaker = new CircuitBreaker();

async function safeAPICall() {
    return breaker.execute(() =>
        fetch('/api/users', {credentials: 'include'})
    );
}
```

---

## Testing Error Scenarios

### Unit Tests

```javascript
describe('POST /api/auth/login', () => {
    it('should return 400 when email is missing', async () => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: 'test123456'}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Email and password are required');
    });

    it('should return 401 for invalid credentials', async () => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: 'user@example.com',
                password: 'wrongpassword',
            }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid email or password');
    });
});
```

---

## Summary

### Key Points

1. **Consistent Format:** All errors follow standard JSON format
2. **Appropriate Status Codes:** Use correct HTTP status codes
3. **Helpful Messages:** Error messages are clear and actionable
4. **Security First:** Don't leak sensitive information in errors
5. **Development vs Production:** More details in development mode
6. **Proper Logging:** Log errors with context for debugging
7. **Client Handling:** Provide tools for client-side error handling
8. **Recovery Strategies:** Implement retry and circuit breaker patterns
9. **Test Error Cases:** Write tests for error scenarios
10. **Document Everything:** Maintain comprehensive error documentation

