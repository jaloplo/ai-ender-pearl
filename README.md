# URL Shortener - Intranet from the Trenches

## Business Overview

The URL Shortener is a lightweight internal tool designed to simplify sharing of long intranet and external links within corporate environments. It enables employees to create memorable, short URLs that redirect to lengthy resources, improving communication efficiency and reducing errors when distributing links via email, chat, or documents.

### Key Business Benefits
- **Link Management**: Centralized shortening and tracking of URLs used across the organization.
- **Access Analytics**: Built-in statistics for monitoring link usage, including timestamps, IP addresses, and referrers (admin-only).
- **Secure Access**: Protected listing and stats pages require authentication to maintain data privacy.
- **Retro Corporate Styling**: Matches the classic "Intranet from the Trenches" aesthetic for seamless integration with legacy internal portals.
- **Flexible Persistence**: Supports both local file storage for small teams and MongoDB API via Cosmos DB for scalable deployments.

### Core Features (User-Facing)
- Shorten any valid URL with a single click, generating unique 6-character codes.
- View and search all shortened URLs (with pagination and browser caching for performance).
- Direct 302 redirects via short codes.
- Login/logout with hardcoded admin credentials for demo purposes.
- Stats dashboard showing access logs per shortened URL.

This tool is ideal for internal teams needing quick, auditable link management without external SaaS dependencies.

## Technical Information

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18 with client components
- **Styling**: Custom CSS replicating Intranet from the Trenches (navy #003366, beige tones)
- **Persistence**:
  - Local JSON file (`data/urls.json`) by default
  - Optional MongoDB driver for Cosmos DB (via `COSMOS_MONGODB_URI`)
- **Auth**: Cookie-based basic auth (admin/admin) with Next.js middleware protection
- **Other**: Node.js fs/promises, no external UI libraries

### Architecture
- **Pages**:
  - `/`: Public URL shortening form
  - `/list`: Auth-protected list with search, paging (50/100/200), cache controls
  - `/login`: Simple auth form
  - `/stats/[short]`: Access log viewer (admin)
  - `/[short]`: Dynamic redirect handler
- **APIs** (`app/api`):
  - `POST /api/shorten`
  - `GET /api/urls`
  - `POST /api/auth/login`, `GET /api/auth/logout`
  - `GET /api/redirect/[short]`
- **Data Layer** (`app/lib/urls.js`): Unified interface delegating to file or Cosmos storage. Includes duplicate detection, unique code generation, and access logging.
- **Middleware** (`middleware.js`): Enforces auth on protected routes.

### Setup & Running
1. `npm install`
2. (Optional) Configure `.env` with `COSMOS_MONGODB_URI`
3. `npm run dev`
4. Access at http://localhost:3000 (login with admin/admin for list/stats)

See `ADR.md` for historical decisions and `app/globals.css` + `ui-rules.md` for styling details.

```mermaid
flowchart TD
    A[User] -->|Shorten| B[Home Page]
    A -->|List & Search| C[List Page - Auth]
    B --> D[POST /api/shorten]
    C --> E[GET /api/urls]
    D & E --> F[urls.js Layer]
    F --> G[File Storage or Cosmos MongoDB]
    H[Short Link] --> I[GET /[short] → 302 Redirect]
```
