# Type Organization

This document describes the organization of TypeScript types in the WESMUN NFC system.

## Type Files

All types are organized in the `/lib/types` directory:

### `database.ts`
Database schema types that match the PostgreSQL database structure.
- `UserRole` - User role types: user, security, overseer, admin
- `DietType` - Dietary preference types: veg, nonveg
- `Role`, `User`, `Profile`, `NfcLink` - Database table interfaces

### `auth.ts`
Authentication and session-related types.
- `SessionUser` - Current user session data
- `LoginRequest`, `LoginResponse` - Login API types
- `RegisterRequest`, `RegisterResponse` - Registration API types
- `ValidateTokenRequest`, `ValidateTokenResponse` - Token validation types

### `api.ts`
API request and response types for all endpoints.
- `UpdateUserRequest`, `BulkUpdateBody` - User update operations
- `ExportParams`, `ExportRow` - Data export functionality
- `AuditLogParams`, `CreateAuditLogParams` - Audit logging
- `CreatedUser`, `CreateUserData` - User creation
- `NfcUpdateRequest` - NFC card updates
- `ApprovalRequest`, `PendingUser` - User approval workflow

### `components.ts`
React component prop types and UI-related types.
- `User`, `UserData`, `UserActionUser` - User display types
- `UserEditDialogProps`, `UserActionsProps`, `UserManagementProps` - User management components
- `NfcScanViewProps` - NFC scanning component
- `HomePageClientProps`, `DebugModeProps` - Dashboard components
- `AuditLog` - Audit log display type
- `StatusIconProps` - UI component types

### `ui.ts` (Backward Compatibility)
Re-exports types from other files for backward compatibility with existing code.
**Note:** For new code, import directly from the specific type file or use `@/lib/types`.

### `index.ts`
Central export point that re-exports all types from all files.
Provides convenient access to any type in the system.

## Usage Examples

### Import from specific type file:
```typescript
import type { UserRole, DietType } from "@/lib/types/database"
import type { SessionUser } from "@/lib/types/auth"
import type { UpdateUserRequest } from "@/lib/types/api"
import type { User, AuditLog } from "@/lib/types/components"
```

### Import from central index (recommended for multiple types):
```typescript
import type { 
  UserRole, 
  SessionUser, 
  UpdateUserRequest, 
  User,
  AuditLog 
} from "@/lib/types"
```

### Backward compatibility (existing code):
```typescript
import type { User, AuditLog } from "@/lib/types/ui"
```

## Best Practices

1. **New Code**: Import from `@/lib/types` or the specific type file
2. **API Routes**: Use types from `api.ts` for request/response bodies
3. **Components**: Use types from `components.ts` for prop types
4. **Database Operations**: Use types from `database.ts` for DB queries
5. **Auth Logic**: Use types from `auth.ts` for session/auth operations

## Type Naming Conventions

- **Interfaces**: Use descriptive names ending in meaningful suffixes
  - `*Request` - API request bodies
  - `*Response` - API response bodies
  - `*Props` - React component props
  - `*Params` - Function parameters or query params
  - `*Data` - Data transfer objects

- **Types**: Use for unions, primitives, and type aliases
  - `UserRole` - Union types
  - `DietType` - Enum-like types

## Migration Guide

If you see the following import:
```typescript
import type { SomeType } from "@/lib/types/ui"
```

Update it to:
```typescript
import type { SomeType } from "@/lib/types"
```

Or for better organization:
```typescript
import type { SomeType } from "@/lib/types/[specific-file]"
```

Where `[specific-file]` is one of: `database`, `auth`, `api`, or `components`.

