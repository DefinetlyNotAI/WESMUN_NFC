# MUN NFC Management System

A comprehensive NFC-based user management system for Model United Nations events, built with Next.js, TypeScript, and PostgreSQL.

## Features

- **NFC Card Integration**: Unique UUID-based NFC cards for each user
- **Role-Based Access Control**: Four distinct roles (User, Security, Overseer, Admin)
- **Real-time Status Tracking**: Bags checked, attendance, dietary preferences, and allergens
- **Comprehensive Audit Logging**: Complete activity trail of all system actions
- **Mobile-First Design**: Optimized for security personnel on mobile devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL (via Neon)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL=url_here

# Session Configuration
SESSION_SECRET=strong_secret_here

EMERGENCY_ADMIN_USERNAME=USERNAME@wesmun.com
EMERGENCY_ADMIN_PASSWORD=password_here

```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the database setup script:
    ```bash
    python setupSQL.py
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

## Database Schema

The system uses five main tables:

- **roles**: User role definitions (user, security, overseer, admin)
- **users**: User accounts with Google OAuth integration
- **profiles**: User profile data (bags, attendance, diet, allergens)
- **nfc_links**: NFC card UUID mappings to users
- **audit_logs**: Complete activity trail

## User Roles & Permissions

### User
- View own profile
- Wait for NFC card scanning at event

### Security
- View all user profiles
- Update bags_checked status
- Mark attendance

### Overseer
- View all user profiles (read-only)
- View audit logs

### Admin
- Full system access
- Manage users and assign roles
- Update all profile fields
- Create NFC links
- View complete audit trail

## NFC Card Flow

1. Each user gets a unique NFC card with URL: `https://domain.com/nfc/<UUID>`
2. When scanned by authenticated staff:
   - User profile is displayed
   - Security/Admin can update bags_checked and attendance
   - All actions are logged in audit trail
3. Unauthenticated scans return 204 No Content (security feature)

## API Routes

- `GET /api/nfc/[uuid]` - Fetch user data by NFC UUID
- `PATCH /api/nfc/[uuid]/update` - Update user profile via NFC scan
- `GET /api/users` - List all users (Security+)
- `PATCH /api/users/[userId]` - Update user role/profile (Admin)
- `DELETE /api/users/[userId]` - Delete user (Admin)
- `POST /api/nfc-links` - Create NFC link for user (Admin)
- `GET /api/audit` - Fetch audit logs (Overseer+)

## Security Features

- HTTPS-only in production
- HTTP-only cookies for session management
- Role-based permission checks on all API routes
- Complete audit logging with IP addresses
- CSRF protection
- 204 responses for unauthenticated NFC scans

## Deployment

Deploy to Vercel with one click:

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

The system will automatically:
- Use Vercel's edge network
- Enable HTTPS
- Configure proper security headers
