# NFC APIs

This document covers all NFC-related API endpoints for scanning and updating user profiles via NFC links.

---

## GET /api/nfc/[uuid]

Retrieves user information by NFC UUID and increments scan count.

### Authentication

Required: Yes  
Special Behavior: Returns 204 No Content if not authenticated (security feature)

### Request

**Headers:**

```
Cookie: session_token=<token>
```

**URL Parameters:**

- `uuid` (string, required): NFC UUID or numeric user ID

### UUID Format

The system accepts two formats:

1. **NFC UUID Format:** `kptfal4nobb-esj3nkod5g`
    - Base36 alphanumeric strings separated by hyphen
    - Each part: 10-13 characters
    - Total length: 10-50 characters
    - Pattern: `^[a-z0-9]+-[a-z0-9]+$`

2. **Numeric User ID:** `123` (auto-redirects to NFC UUID)
    - Returns 307 redirect with correct UUID
    - Less secure, but supported for compatibility

### Response (NFC UUID)

**Success (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "image": null,
    "role": {
      "id": 1,
      "name": "user",
      "description": "Regular conference attendee"
    }
  },
  "profile": {
    "id": "profile-id",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bags_checked": false,
    "attendance": true,
    "received_food": false,
    "diet": "nonveg",
    "allergens": "peanuts",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "nfc_link": {
    "id": "nfc-id",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid": "kptfal4nobb-esj3nkod5g",
    "created_at": "2024-01-15T10:30:00Z",
    "last_scanned_at": "2024-01-20T14:20:00Z",
    "scan_count": 6
  }
}
```

**Response (Numeric User ID - Redirect):**

```json
{
  "redirect": true,
  "correctUuid": "kptfal4nobb-esj3nkod5g",
  "message": "Redirecting to NFC UUID"
}
```

Status: 307 Temporary Redirect

**Error (204 No Content):**
No response body if user is not authenticated (security feature).

**Error (400 Bad Request):**

```json
{
  "error": "Invalid NFC identifier"
}
```

```json
{
  "error": "Invalid UUID format"
}
```

**Error (404 Not Found):**

```json
{
  "error": "NFC link not found"
}
```

```json
{
  "error": "User not approved"
}
```

### Side Effects

1. **Scan Count:** Increments `scan_count` by 1
2. **Last Scanned:** Updates `last_scanned_at` to current timestamp
3. **Audit Log:** Creates audit log entry with action "nfc_scan"
4. **IP/User Agent:** Records IP address and user agent in audit log

### Notes

- Only returns approved users (`approval_status: "approved"`)
- Anonymous access returns 204 (no auth popup)
- Scan is counted even if user data is only viewed
- Returns complete user profile including dietary information
- IP address extracted from `x-forwarded-for` or `x-real-ip` headers
- UUID validation prevents injection attacks

---

## PATCH /api/nfc/[uuid]/update

Updates user profile via NFC UUID (role-based field access).

### Authentication

Required: Yes  
Required Permissions: Varies by field (see Field Permissions below)

### Request

**Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**URL Parameters:**

- `uuid` (string, required): NFC UUID (not numeric user ID)

**Body:**

```json
{
  "bags_checked": true,
  "attendance": true,
  "received_food": false,
  "diet": "veg",
  "allergens": "gluten, dairy"
}
```

**Parameters (all optional):**

- `bags_checked` (boolean): Bag check status
- `attendance` (boolean): Attendance/check-in status
- `received_food` (boolean): Food receipt status
- `diet` (string): Diet preference ("veg" or "nonveg")
- `allergens` (string): Allergen information (max 500 chars)

### Field Permissions

| Field         | Security | Overseer | Admin |
|---------------|----------|----------|-------|
| bags_checked  | ✅        | ❌        | ✅     |
| attendance    | ✅        | ❌        | ✅     |
| received_food | ❌        | ❌        | ✅     |
| diet          | ❌        | ❌        | ✅     |
| allergens     | ❌        | ❌        | ✅     |

**Permission Mapping:**

- `bags_checked` → `canUpdateBagsChecked`
- `attendance` → `canUpdateAttendance`
- `received_food` → `canUpdateDiet`
- `diet` → `canUpdateDiet`
- `allergens` → `canUpdateAllergens`

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
  "error": "Use NFC UUID instead of user ID"
}
```

```json
{
  "error": "Invalid UUID format"
}
```

```json
{
  "error": "No valid fields to update"
}
```

```json
{
  "error": "Allergens field too long"
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
  "error": "Forbidden: Cannot update bags_checked"
}
```

**Error (404 Not Found):**

```json
{
  "error": "NFC link not found"
}
```

### Side Effects

1. **Profile Update:** Updates specified fields in profiles table
2. **Updated Timestamp:** Sets `updated_at` to current time
3. **Audit Log:** Creates entry with action "profile_update"
4. **Audit Details:** Includes all updated fields and UUID

### Notes

- **Security First:** Only NFC UUID accepted (not numeric ID)
- **Partial Updates:** Only specified fields are updated
- **Permission Check:** Each field checked individually before update
- **Atomic:** All updates in single transaction
- **Validation:** Allergens limited to 500 characters
- **Approved Only:** Only works for approved users
- **IP Logging:** Records IP address and user agent

---

## POST /api/nfc-links

Creates a new NFC link for a user.

### Authentication

Required: Yes  
Required Permission: `canManageUsers`  
Allowed Roles: `admin`, `security`, `overseer`

### Request

**Headers:**

```
Cookie: session_token=<token>
Content-Type: application/json
```

**Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Parameters:**

- `userId` (string, required): UUID of the user

### Response

**Success (200 OK):**

```json
{
  "uuid": "kptfal4nobb-esj3nkod5g"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Invalid userId"
}
```

```json
{
  "error": "User already has an NFC link"
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

**Error (404 Not Found):**

```json
{
  "error": "User not found or not approved"
}
```

### Side Effects

1. **NFC Link Creation:** Inserts new record in nfc_links table
2. **UUID Generation:** Generates cryptographically secure random UUID
3. **Audit Log:** Creates entry with action "nfc_link_create"
4. **Initial Values:** Sets scan_count to 0, last_scanned_at to null

### Notes

- Each user can have only one NFC link
- Attempting to create duplicate returns 400 error
- UUID is generated using Node.js `crypto.randomUUID()`
- Only works for approved users
- NFC link is permanent (no deletion endpoint)
- Can be used immediately after creation

---

## NFC UUID Format Specification

### Format Details

```
Base36 Encoding: 0-9, a-z (36 characters)
Format: [segment1]-[segment2]
Example: kptfal4nobb-esj3nkod5g
Length: 10-50 characters total
Pattern: ^[a-z0-9]+-[a-z0-9]+$
```

### Validation Logic

```javascript
function isValidUUID(uuid) {
    const nfcUuidRegex = /^[a-z0-9]+-[a-z0-9]+$/i;
    return nfcUuidRegex.test(uuid) &&
        uuid.length >= 10 &&
        uuid.length <= 50;
}
```

### Security Considerations

1. **Unpredictable:** Cryptographically secure random generation
2. **Sufficient Entropy:** 36^20+ combinations (depending on length)
3. **URL-Safe:** Only alphanumeric and hyphen characters
4. **Case-Insensitive:** Lowercase recommended but uppercase accepted
5. **No Special Chars:** Prevents injection attacks

---

## NFC Scanning Workflow

### Typical Scanning Flow

1. **User Arrives at Station**
    - Security/Staff member has scanning device open
    - Device camera/NFC reader ready

2. **Scan NFC Tag/QR Code**
    - System reads UUID from NFC tag or QR code
    - Redirects to `/nfc/[uuid]` page

3. **Display User Info**
    - GET request to `/api/nfc/[uuid]`
    - User profile displayed on screen
    - Scan count incremented

4. **Update Profile (If Needed)**
    - Staff checks bags → PATCH with `bags_checked: true`
    - Mark attendance → PATCH with `attendance: true`
    - Issue food → PATCH with `received_food: true`

5. **Confirmation**
    - Visual confirmation on screen
    - User proceeds through checkpoint

### Example Scanning Component

```javascript
const NFCScanView = ({uuid}) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user data
        fetch(`/api/nfc/${uuid}`, {
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                setUserData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Scan failed:', error);
                setLoading(false);
            });
    }, [uuid]);

    const updateProfile = async (updates) => {
        const response = await fetch(`/api/nfc/${uuid}/update`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates),
        });

        if (response.ok) {
            // Refresh data
            window.location.reload();
        }
    };

    if (loading) return <div>Scanning...</div>;
    if (!userData) return <div>User not found</div>;

    return (
        <div>
            <h1>{userData.user.name}</h1>
            <p>{userData.user.email}</p>

            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={userData.profile.bags_checked}
                        onChange={(e) =>
                            updateProfile({bags_checked: e.target.checked})
                        }
                    />
                    Bags Checked
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={userData.profile.attendance}
                        onChange={(e) =>
                            updateProfile({attendance: e.target.checked})
                        }
                    />
                    Present
                </label>
            </div>

            <p>Diet: {userData.profile.diet}</p>
            <p>Allergens: {userData.profile.allergens || 'None'}</p>
            <p>Scans: {userData.nfc_link.scan_count}</p>
        </div>
    );
};
```

---

## Code Examples

### Scan NFC Link

```javascript
const scanNFC = async (uuid) => {
    const response = await fetch(`/api/nfc/${uuid}`, {
        credentials: 'include',
    });

    if (response.status === 204) {
        // Not authenticated
        window.location.href = '/auth/signin';
        return null;
    }

    if (response.ok) {
        const data = await response.json();

        if (data.redirect) {
            // Got numeric ID, redirect to UUID
            return scanNFC(data.correctUuid);
        }

        return data;
    }

    throw new Error('Scan failed');
};
```

### Update via NFC

```javascript
const updateViaUUID = async (uuid, updates) => {
    const response = await fetch(`/api/nfc/${uuid}/update`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    return await response.json();
};

// Usage
await updateViaUUID('kptfal4nobb-esj3nkod5g', {
    bags_checked: true,
    attendance: true,
});
```

### Create NFC Link

```javascript
const createNFCLink = async (userId) => {
    const response = await fetch('/api/nfc-links', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({userId}),
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Created NFC UUID:', data.uuid);
        return data.uuid;
    } else {
        const error = await response.json();
        console.error('Failed:', error.error);
        return null;
    }
};
```

### Handle All NFC Errors

```javascript
const safeNFCScan = async (uuid) => {
    try {
        const response = await fetch(`/api/nfc/${uuid}`, {
            credentials: 'include',
        });

        if (response.status === 204) {
            return {error: 'NOT_AUTHENTICATED'};
        }

        if (response.status === 404) {
            return {error: 'NOT_FOUND'};
        }

        if (response.status === 400) {
            return {error: 'INVALID_UUID'};
        }

        if (!response.ok) {
            return {error: 'UNKNOWN_ERROR'};
        }

        const data = await response.json();

        if (data.redirect) {
            // Auto-redirect to correct UUID
            return safeNFCScan(data.correctUuid);
        }

        return {data};
    } catch (error) {
        return {error: 'NETWORK_ERROR'};
    }
};
```

---

## Integration Guide

### QR Code Generation

```javascript
import QRCode from 'qrcode';

const generateNFCQRCode = async (uuid) => {
    const url = `https://nfc.wesmun.com/nfc/${uuid}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
    return qrCodeDataUrl;
};
```

### NFC Tag Writing

```javascript
// Using Web NFC API (Chrome Android)
const writeNFCTag = async (uuid) => {
    if ('NDEFReader' in window) {
        const ndef = new NDEFReader();
        await ndef.write({
            records: [
                {
                    recordType: 'url',
                    data: `https://nfc.wesmun.com/nfc/${uuid}`,
                },
            ],
        });
        console.log('NFC tag written successfully');
    } else {
        console.error('Web NFC not supported');
    }
};
```

