<div align="center">

# NFC WESMUN

### Professional NFC-Based Conference Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

**A comprehensive, production-ready NFC-based user management system for Model United Nations conferences and
large-scale events.**

</div>

---

## Overview

NFC WESMUN is a cutting-edge conference management platform designed specifically for Model United Nations events. It
leverages NFC technology to streamline delegate check-ins, bag verification, attendance tracking, and dietary
management—all through a secure, role-based system.

### Why NFC WESMUN?

- ⚡ **Lightning Fast**: Instant delegate identification via NFC tags
- 🔒 **Enterprise Security**: Multi-layer security with audit logging
- 📱 **Mobile Optimized**: Perfect for on-the-go security personnel
- 🎨 **Modern UI**: Beautiful, responsive interface built with shadcn/ui
- 📊 **Rich Analytics**: Export and analyze data in CSV/PDF formats
- 🌍 **Scalable**: Handles hundreds of delegates efficiently

---

## Key Features

### NFC Card Integration

- **Unique UUID Assignment**: Each delegate receives a unique NFC identifier
- **Instant Recognition**: Fast delegate lookup and verification
- **Custom UUID Format**: Base36 encoding for compact, URL-safe identifiers

### Advanced User Management

- **User Registration & Approval**: Multi-step approval workflow for new users
- **Bulk Operations**: Create, update, and delete users in bulk
- **Data-Only Users**: Import delegate lists without login credentials
- **Profile Management**: Comprehensive delegate profiles with dietary info
- **Role Assignment**: Granular permission control with 4 distinct roles
- **Email Domain Restrictions**: Elevated roles limited to @wesmun.com emails

### Role-Based Access Control (RBAC)

Four specialized roles with distinct permissions:

| Role         | Use Case               |
|--------------|------------------------|
| **User**     | Conference delegates   |
| **Security** | Security checkpoints   |
| **Overseer** | Monitoring & reporting |
| **Admin**    | Conference organizers  |

*Plus: Emergency Admin role for audit log access and setup*

### Real-Time Status Tracking

- **Bag Check**: Mark when security screening is complete
- **Attendance**: Track delegate check-in/check-out
- **Food Distribution**: Monitor meal allocation status
- **Dietary Preferences**: Veg/Non-veg with allergen tracking
- **Scan History**: View complete interaction timeline
- **Live Updates**: Real-time synchronization across devices

### Comprehensive Audit System

- **Complete Activity Trail**: Every action logged with actor and target
- **IP & User Agent Tracking**: Enhanced security monitoring
- **Historical Snapshots**: Preserve user data even after changes
- **Advanced Filtering**: Search by action, user, date, or IP
- **Emergency Admin Access**: Dedicated role for audit review

### Export & Reporting

- **Multiple Formats**: Export to CSV or PDF
- **Advanced Filtering**: Filter by attendance, diet, bags, etc.
- **Count Queries**: Get statistics without downloading data
- **Custom Columns**: Include NFC links, scan counts, allergens
- **Date Stamping**: Auto-generated filenames with timestamps
- **Bulk Data**: Handle hundreds of records efficiently

### Mobile Supported UI

- **Responsive Layout**: Optimized for phones, tablets, and desktops
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Dark Mode**: Reduce eye strain during long events
- **Fast Loading**: Optimized bundle sizes for mobile networks
- **Scanner View**: Dedicated interface for security/overseer/admin personnel

### Enterprise Security

- **Session-Based Auth**: Secure HTTP-only cookies
- **Rate Limiting**: Prevent brute force attacks
- **SQL Injection Protection**: Parameterized queries throughout
- **XSS Prevention**: Content Security Policy headers

---

## Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm/pnpm/yarn**: Latest version
- **PostgreSQL**: v15.0 or higher (local or hosted)
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DefinetlyNotAI/WESMUN_NFC
   cd nfc-wesmun
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://user:password@host:5432/database
   
   # Session Secret (generate with: openssl rand -base64 32)
   SESSION_SECRET=your-super-secret-session-key-here

   # Emergency Admin
    EMERGENCY_ADMIN_USERNAME=username@wesmun.com
    EMERGENCY_ADMIN_PASSWORD=your-password-here
   ```

4. **Set up the database**
   ```bash
   # Use the Python script
   python scripts/setupSQL.py
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. **Login in via emergency admin** and setup new admin accounts to share
2. **Create NFC links** for delegates in the admin panel
3. **Start scanning** NFC tags at your event

---

## Tech Stack

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
- **Authentication**: Custom session-based auth
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)

### DevOps

- **Hosting**: [Vercel](https://vercel.com/) (recommended) or any Node.js host
- **Database Hosting**: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), [Aiven](https://console.aiven.io) or self-hosted PostgreSQL
- **Version Control**: Git
- **CI/CD**: Vercel automatic deployments

### Deployment

#### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
    - Go to [vercel.com/new](https://vercel.com/new)
    - Import your repository
    - Configure environment variables
    - Deploy!

3. **Set Environment Variables** in Vercel Dashboard

#### Deploy to Other Platforms

**Node.js Server**

```bash
npm run build
npm start
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  Auth    │  Users   │   NFC    │  Admin   │  Audit   │   │
│  │  Pages   │  Mgmt    │  Scan    │  Panel   │  Logs    │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│                           ↕ HTTP                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes (/api/*)                     │   │
│  │  • Authentication  • Users  • NFC  • Admin  • Audit  │   │
│  └──────────────────────────────────────────────────────┘   │
│                             ↕                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Business Logic Layer (lib/)                  │   │
│  │  • auth.ts  • db.ts  • permissions.ts  • audit.ts    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              ↕
                  ┌─────────────────────────┐
                  │   PostgreSQL Database   │
                  │  • users  • profiles    │
                  │  • nfc_links  • roles   │
                  │  • audit_logs           │
                  └─────────────────────────┘
```

### Data Flow

1. **Authentication**: User logs in → Session created → Cookie set
2. **NFC Scan**: QR/NFC scanned → UUID sent to API → User data fetched → Profile updated
3. **Audit Log**: Action performed → Log entry created with actor, target, details
4. **Permissions**: Request received → User authenticated → Role checked → Permission verified

---

## User Roles

### User (Delegate)

**Default role for all registered users**

- Do not sign-in [Data only users]
- Used primarily as data subjects in the system, for the other roles

### Security

**For checkpoint personnel**

- ✅ Scan NFC tags and view delegate info
- ✅ Update attendance, bag and food receival status
- ❌ Cannot modify dietary information
- ❌ Cannot manage users or roles

**Ideal for**: Entry checkpoints, bag screening stations

### Overseer

**Read-only security access**

- ✅ Scan NFC tags and view delegate info
- ❌ Cannot modify any information
- ❌ Cannot approve users or manage system

**Ideal for**: Conference coordinators, observers, reporting staff

### Admin

**Full system control**

- ✅ All Security and Overseer capabilities
- ✅ Approve/reject user registrations
- ✅ Create and manage users (including bulk operations)
- ✅ Assign roles (for @wesmun.com emails only)
- ✅ Update all profile fields (diet, allergens, etc.)
- ✅ Create NFC links for delegates
- ✅ Export data in multiple formats
- ❌ No access to audit

**Ideal for**: Conference organizers, Secretary Generals

### Emergency Admin

**Special elevated access**

- ✅ All Admin capabilities
- ✅ View/Delete complete audit logs

> Set via environment variable

**Ideal for**: Security investigations, IT Department

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

---

## Acknowledgments

- **shadcn/ui** for beautiful component primitives
- **Vercel** for serverless hosting and deployment platform
- **Aiven** for PostgreSQL DB

---

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/DefinetlyNotAI/WESMUN_NFC)
- **Documentation**: [Wiki](https://github.com/DefinetlyNotAI/WESMUN_NFC/wiki)
- **Security**: See [SECURITY.md](./SECURITY.md)

### License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**[⬆ Back to Top](#nfc-wesmun)**

Made with ❤️ for WESMUN Conferences

**Star ⭐ this repository if you find it helpful!**

</div>
