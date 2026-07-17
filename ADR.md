## 1. URL Shortener Implementation
* **Date:** 2024-10-18
* **Context:** Need to build a URL Shortener web app using Next.js with specific pages, API endpoints, local file storage, and "Intranet from the Trenches" UI style.
* **Decision:** Use Next.js App Router with file-based API routes, a shared lib for data persistence in data/urls.json, two client pages (/ and /list), and custom CSS mimicking old intranet design (navy #003366, beige backgrounds, bordered tables).
* **Consequences:** Provides a fully functional, self-contained app with persistence. Simple file-based storage is easy to inspect but not suitable for concurrent high-load production use. UI matches requested retro style exactly.

## 2. Data Storage Approach
* **Date:** 2024-10-18
* **Context:** Requirement to "Save information about urls, and shorten in a local file".
* **Decision:** Use JSON file with fs/promises in app/lib/urls.js for CRUD operations on shortened URLs. Initial empty file created in data/.
* **Consequences:** Simple, no external DB needed. Data survives server restarts. Easy to edit manually. May have race conditions under heavy concurrent writes (acceptable for this scope).

## 3. API and Routing Design
* **Date:** 2024-10-18
* **Context:** Need dedicated endpoints for shortening, listing, and redirecting.
* **Decision:** 
  - POST /api/shorten for creation
  - GET /api/urls for listing
  - GET /api/redirect/[short] for 302 redirects
* **Consequences:** Clean separation. Redirect endpoint allows direct use of short links. List endpoint enriches data with full short URLs.

## 4. UI Styling
* **Date:** 2024-10-18
* **Context:** "Use the 'Intranet from the Trenches' style and colors for the UI".
* **Decision:** Implement custom CSS with specific colors (#003366 navy, #f0f0e8 background, #e8e4d9 accents), Arial font, heavy borders, simple tables, no gradients or modern effects.
* **Consequences:** Achieves the exact retro corporate intranet look requested. Consistent across layout, forms, and tables.

## 5. Basic Authentication Implementation
* **Date:** 2024-10-19
* **Context:** Requirement to "implement a basic authentication page. the unique account is admin and the password to validate is admin" and "the user accesing the the URL list page must be authenticated".
* **Decision:** Implemented a simple login page at /login using hardcoded credentials (admin/admin). Created POST /api/auth/login to validate and set httpOnly 'auth' cookie. Added GET /api/auth/logout. Used Next.js middleware.js to protect /list and /api/urls (redirect unauthenticated to /login). Updated root layout.js to conditionally show nav links based on server cookie. Enhanced list page with logout button. No external auth libs; pure Next.js cookie + middleware approach.
* **Consequences:** List page and its API are now protected as required. Shorten and redirect remain public. Simple demo auth (no hashing, single user). Cookie provides basic session persistence across requests. Middleware ensures server-side enforcement. UI remains consistent with Intranet style. Easy to extend but not production-grade security.

## 6. Substack Header Replication
* **Date:** 2024-10-20
* **Context:** User request to "Replicate the style, layout, design, and colours of the header item (mainly the logo) of the https://intranetfromthetrenches.substack.com/ page".
* **Decision:** Replaced the legacy header/nav in app/layout.js with a pixel-perfect 88px sticky top-bar using 3-column flex (left: 32px avatar + hamburger; center: wordmark logo; right: icons + primary/tertiary buttons). Added matching CSS rules in app/globals.css (`.top-bar`, `.logo-small`, `.wordmark`, `.btn-primary` using #66cd7a green). Used text-based wordmark + "IFT" initials for self-contained logo replication. Preserved all prior editorial styles from ui-rules.md and existing app functionality.
* **Consequences:** Header now matches the target page's exact layout, height, colours, and logo treatment. Improved visual fidelity to the requested brand. No functional regressions; auth-aware links integrated into header. Text logo used instead of external image (lightweight and maintainable).

