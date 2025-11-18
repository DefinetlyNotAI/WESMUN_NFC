<div align="center">

# 🎫 NFC WESMUN

### Professional NFC-Based Conference Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

**A comprehensive, production-ready NFC-based user management system for Model United Nations conferences and
large-scale events.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Security](#-security)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [System Architecture](#-system-architecture)
- [User Roles](#-user-roles)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

NFC WESMUN is a cutting-edge conference management platform designed specifically for Model United Nations events. It
leverages NFC technology to streamline delegate check-ins, bag verification, attendance tracking, and dietary
management—all through a secure, role-based system.

### Why NFC WESMUN?

- ⚡ **Lightning Fast**: Instant delegate identification via NFC tags
- 🔒 **Enterprise Security**: Multi-layer security with audit logging
- 📱 **Mobile Optimized**: Perfect for on-the-go security personnel
- 🎨 **Modern UI**: Beautiful, responsive interface built with shadcn/ui
- 📊 **Rich Analytics**: Export and analyze data in CSV/PDF formats
- 🔄 **Real-time Updates**: Live status tracking across all checkpoints
- 🌍 **Scalable**: Handles hundreds of delegates efficiently

---

## ✨ Key Features

### 🎴 NFC Card Integration

- **Unique UUID Assignment**: Each delegate receives a unique NFC identifier
- **QR Code Support**: Alternative scanning method for compatibility
- **Instant Recognition**: Sub-second delegate lookup and verification
- **Offline Capability**: Core scanning functions work without constant connectivity
- **Custom UUID Format**: Base36 encoding for compact, URL-safe identifiers

### 👥 Advanced User Management

- **User Registration & Approval**: Multi-step approval workflow for new users
- **Bulk Operations**: Create, update, and delete users in bulk
- **Data-Only Users**: Import delegate lists without login credentials
- **Profile Management**: Comprehensive delegate profiles with dietary info
- **Role Assignment**: Granular permission control with 4 distinct roles
- **Email Domain Restrictions**: Elevated roles limited to @wesmun.com emails

### 🔐 Role-Based Access Control (RBAC)

Four specialized roles with distinct permissions:

| Role         | Capabilities                     | Use Case               |
|--------------|----------------------------------|------------------------|
| **User**     | View own profile                 | Conference delegates   |
| **Security** | Scan NFC, update bags/attendance | Security checkpoints   |
| **Overseer** | Read-only access to all data     | Monitoring & reporting |
| **Admin**    | Full system management           | Conference organizers  |

*Plus: Emergency Admin role for audit log access*

### 📊 Real-Time Status Tracking

- **Bag Check**: Mark when security screening is complete
- **Attendance**: Track delegate check-in/check-out
- **Food Distribution**: Monitor meal allocation status
- **Dietary Preferences**: Veg/Non-veg with allergen tracking
- **Scan History**: View complete interaction timeline
- **Live Updates**: Real-time synchronization across devices

### 🔍 Comprehensive Audit System

- **Complete Activity Trail**: Every action logged with actor and target
- **IP & User Agent Tracking**: Enhanced security monitoring
- **Historical Snapshots**: Preserve user data even after changes
- **Advanced Filtering**: Search by action, user, date, or IP
- **Emergency Admin Access**: Dedicated role for audit review
- **GDPR Compliance**: Bulk deletion for data removal requests

### 📤 Export & Reporting

- **Multiple Formats**: Export to CSV or PDF
- **Advanced Filtering**: Filter by attendance, diet, bags, etc.
- **Count Queries**: Get statistics without downloading data
- **Custom Columns**: Include NFC links, scan counts, allergens
- **Date Stamping**: Auto-generated filenames with timestamps
- **Bulk Data**: Handle hundreds of records efficiently

### 📱 Mobile-First Design

- **Responsive Layout**: Optimized for phones, tablets, and desktops
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Dark Mode**: Reduce eye strain during long events
- **Fast Loading**: Optimized bundle sizes for mobile networks
- **PWA Support**: Install as an app on mobile devices
- **Scanner View**: Dedicated interface for security personnel

### 🛡️ Enterprise Security

- **Session-Based Auth**: Secure HTTP-only cookies
- **Password Hashing**: bcrypt with configurable cost factor
- **Rate Limiting**: Prevent brute force attacks
- **SQL Injection Protection**: Parameterized queries throughout
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: SameSite cookie attributes

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) for dark mode
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)

### Backend

- **Runtime**: Node.js 18+
- **Database**: [PostgreSQL 15+](https://www.postgresql.org/)
- **ORM**: Raw SQL with [node-postgres (pg)](https://node-postgres.com/)
- **Authentication**: Custom session-based auth with bcrypt
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)

### DevOps

- **Hosting**: [Vercel](https://vercel.com/) (recommended) or any Node.js host
- **Database Hosting**: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or self-hosted PostgreSQL
- **Version Control**: Git
- **CI/CD**: Vercel automatic deployments

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm/pnpm/yarn**: Latest version
- **PostgreSQL**: v15.0 or higher (local or hosted)
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nfc-wesmun.git
   cd nfc-wesmun
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://user:password@host:5432/database
   
   # Session Secret (generate with: openssl rand -base64 32)
   SESSION_SECRET=your-super-secret-session-key-here
   
   # Base URL
   NEXT_PUBLIC_BASE_URL=https://nfc.wesmun.com
   
   # Emergency Admin (optional but recommended)
   EMERGENCY_ADMIN_USERNAME=admin@wesmun.com
   ```

4. **Set up the database**
   ```bash
   # Connect to your PostgreSQL database
   psql $DATABASE_URL
   
   # Run the schema setup script
   \i scripts/setupSQL.sql
   
   # Or use Python script
   python scripts/setupSQL.py
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. **Register an admin account** with an @wesmun.com email
2. **Promote to admin** via database:
   ```sql
   UPDATE users 
   SET role_id = (SELECT id FROM roles WHERE name = 'admin')
   WHERE email = 'your-email@wesmun.com';
   ```
3. **Create NFC links** for delegates in the admin panel
4. **Start scanning** NFC tags at your event

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Auth    │  Users   │   NFC    │  Admin   │  Audit   │  │
│  │  Pages   │  Mgmt    │  Scan    │  Panel   │  Logs    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                           ↕ HTTP                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes (/api/*)                      │  │
│  │  • Authentication  • Users  • NFC  • Admin  • Audit  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Business Logic Layer (lib/)                   │  │
│  │  • auth.ts  • db.ts  • permissions.ts  • audit.ts    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ↕
              ┌────────────────────────┐
              │   PostgreSQL Database   │
              │  • users  • profiles    │
              │  • nfc_links  • roles   │
              │  • audit_logs           │
              └────────────────────────┘
```

### Data Flow

1. **Authentication**: User logs in → Session created → Cookie set
2. **NFC Scan**: QR/NFC scanned → UUID sent to API → User data fetched → Profile updated
3. **Audit Log**: Action performed → Log entry created with actor, target, details
4. **Permissions**: Request received → User authenticated → Role checked → Permission verified

---

## 👥 User Roles

### 🎯 User (Delegate)

**Default role for all registered users**

- View own profile information
- Cannot modify any data
- Used primarily as data subjects in the system

### 🛡️ Security

**For checkpoint personnel**

- ✅ Scan NFC tags and view delegate info
- ✅ Mark bags as checked
- ✅ Update attendance status
- ❌ Cannot modify dietary information
- ❌ Cannot manage users or roles

**Ideal for**: Entry checkpoints, bag screening stations

### 👁️ Overseer

**Read-only administrative access**

- ✅ View all users and their profiles
- ✅ Export data for reporting
- ❌ Cannot modify any information
- ❌ Cannot approve users or manage system

**Ideal for**: Conference coordinators, observers, reporting staff

### 👑 Admin

**Full system control**

- ✅ All Security and Overseer capabilities
- ✅ Approve/reject user registrations
- ✅ Create and manage users (including bulk operations)
- ✅ Assign roles (for @wesmun.com emails only)
- ✅ Update all profile fields (diet, allergens, etc.)
- ✅ Create NFC links for delegates
- ✅ Export data in multiple formats

**Ideal for**: Conference organizers, IT administrators

### 🚨 Emergency Admin

**Special elevated access**

- ✅ All Admin capabilities
- ✅ View complete audit logs
- ✅ Delete audit entries (for compliance)
- Set via environment variable

**Ideal for**: Security investigations, GDPR compliance

---

## 📚 API Reference

### Quick Links

- **[Complete API Documentation](./wiki/README.md)** - Full API guide
- **[Quick Reference](./wiki/quick-reference.md)** - Common operations
- **[Authentication API](./wiki/authentication-api.md)** - Login & sessions
- **[User Management API](./wiki/user-management-api.md)** - CRUD operations
- **[NFC API](./wiki/nfc-api.md)** - Scanning & updates
- **[Admin API](./wiki/admin-api.md)** - Approvals
- **[Audit API](./wiki/audit-api.md)** - Activity logs
- **[Data Types](./wiki/data-types.md)** - TypeScript interfaces
- **[Permissions](./wiki/permissions-roles.md)** - RBAC details
- **[Error Handling](./wiki/error-handling.md)** - Error codes

### API Endpoints Overview

| Category  | Endpoints   | Description                       |
|-----------|-------------|-----------------------------------|
| **Auth**  | 4 endpoints | Login, register, logout, validate |
| **Users** | 9 endpoints | CRUD, bulk operations, exports    |
| **Admin** | 2 endpoints | User approval workflow            |
| **NFC**   | 3 endpoints | Scanning and profile updates      |
| **Audit** | 3 endpoints | Log viewing and management        |

**Total**: 21 RESTful API endpoints

### Example Usage

```typescript
// Login
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
        email: 'user@wesmun.com',
        password: 'password123'
    })
});

// Scan NFC
const userData = await fetch(`/api/nfc/${uuid}`, {
    credentials: 'include'
}).then(res => res.json());

// Update profile
await fetch(`/api/nfc/${uuid}/update`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({
        bags_checked: true,
        attendance: true
    })
});
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
    - Go to [vercel.com/new](https://vercel.com/new)
    - Import your repository
    - Configure environment variables
    - Deploy!

3. **Set Environment Variables** in Vercel Dashboard:
    - `DATABASE_URL`
    - `SESSION_SECRET`
    - `NEXT_PUBLIC_BASE_URL`
    - `EMERGENCY_ADMIN_USERNAME`

### Deploy to Other Platforms

**Docker** (coming soon)

```bash
docker build -t nfc-wesmun .
docker run -p 3000:3000 nfc-wesmun
```

**Node.js Server**

```bash
npm run build
npm start
```

---

## 🔒 Security

This system implements **enterprise-grade security** measures:

### Authentication & Sessions

- ✅ HTTP-only cookies prevent XSS attacks
- ✅ bcrypt password hashing (cost factor 10)
- ✅ Session tokens hashed with SHA-256
- ✅ 3-day session expiry with auto-renewal
- ✅ Rate limiting on login attempts

### Authorization

- ✅ Role-based access control (RBAC)
- ✅ Field-level permissions
- ✅ Email domain restrictions for elevated roles
- ✅ Permission checks on every API call
- ✅ Cannot delete own admin account

### Data Protection

- ✅ Parameterized SQL queries (no SQL injection)
- ✅ Input validation on all endpoints
- ✅ CSRF protection via SameSite cookies
- ✅ Secure password requirements (8+ chars)
- ✅ Audit logging for all sensitive actions

### Database Security

- ✅ Foreign key constraints
- ✅ Unique constraints on emails/UUIDs
- ✅ Cascading deletes for data integrity
- ✅ Indexed queries for performance
- ✅ Connection pooling

### Compliance

- ✅ GDPR-ready with bulk deletion
- ✅ Complete audit trail
- ✅ Historical data preservation
- ✅ IP address logging
- ✅ User consent workflows

📄 **[Read Full Security Documentation](./SECURITY.md)**

---

## 📖 Documentation

Comprehensive documentation is available in the `wiki/` directory:

- **[Main Documentation](./wiki/README.md)** - Start here
- **[API Reference](./wiki/INDEX.md)** - Complete API index
- **[Quick Reference](./wiki/quick-reference.md)** - Quick lookups
- **[Deployment Guide](./wiki/README.md#deployment)** - Production setup
- **[Security Guide](./SECURITY.md)** - Security best practices

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Write TypeScript with strict mode
- Add JSDoc comments for functions
- Test all API endpoints
- Update documentation for new features

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful component primitives
- **Vercel** for hosting and deployment platform
- **Neon** for serverless PostgreSQL
- **WESMUN Team** for project requirements and testing

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/nfc-wesmun/issues)
- **Documentation**: [Wiki](./wiki/)
- **Security**: See [SECURITY.md](./SECURITY.md)

---

<div align="center">

**[⬆ Back to Top](#-nfc-wesmun)**

Made with ❤️ for WESMUN Conferences

**Star ⭐ this repository if you find it helpful!**

</div>

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
