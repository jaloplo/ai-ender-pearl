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

## 7. Switch Cosmos DB Package to MongoDB Driver
* **Date:** 2024-10-21
* **Context:** User request to "change the CosmosDB package for the one that uses MongoDB in CosmosDB". The project previously used the native @azure/cosmos SDK (SQL API) for persistence when configured via env vars. Cosmos DB supports the MongoDB wire protocol/API, allowing use of the standard `mongodb` driver.
* **Decision:** Replaced dependency `@azure/cosmos` with `mongodb` (^6.8.0) in package.json. Rewrote app/lib/cosmos.js to use MongoClient from 'mongodb' instead of CosmosClient. Updated detection in app/lib/urls.js to check for COSMOS_MONGODB_URI. Updated .env with new connection string format and documentation. Minor text update in app/list/page.js. The abstraction layer (readUrls, addShortUrl, etc.) and file-based fallback remain unchanged.
* **Consequences:** Developers now use familiar MongoDB query style and connection strings (obtained from Azure portal under MongoDB API). Maintains full compatibility with existing app code and data shapes. Requires `npm install` to update packages. Loses some Azure-specific SDK features but gains simplicity. File storage fallback and all APIs continue to work identically. Existing Cosmos accounts must provide the MongoDB connection string.

## 8. URL List Page Enhancements (Search, Paging, Page Size, Browser Cache)
* **Date:** 2026-07-17
* **Context:** User request to implement in the URLs listing page: a search box for original URLs, options to get 50/100/200 items, paging options, and cache the URL items in the browser for faster management.
* **Decision:** Updated `app/list/page.js` (client component) with React state for searchTerm, pageSize, currentPage. Implemented client-side filtering, slicing for pagination, and localStorage-based caching (5-min TTL) with manual refresh/clear options. No changes to API, backend, or styles required. Preserved existing auth, retro "Intranet from the Trenches" UI, and data sources (file/Cosmos).
* **Consequences:** Significantly better UX for browsing large lists (search + pagination). Browser cache reduces repeated API calls and improves perceived speed. All logic stays client-side keeping server simple. Cache can be cleared explicitly. No breaking changes; backward compatible with existing data and flows. Added reasoning.md documenting the work.

## 9. README.md Generation
* **Date:** 2024-10-22
* **Context:** User request to "generate the README.md file focus on business information first, and then technical information".
* **Decision:** Created comprehensive README.md prioritizing business overview, benefits, and user features before technical stack, architecture, and setup. Used Mermaid diagram and aligned with project memory + ADR history.
* **Consequences:** Provides clear entry point for stakeholders (business) and developers (technical). Documentation now complete and consistent with Intranet from the Trenches theme and all implemented features.

## 10. Hero Section and Prominent URL Input Enhancements
* **Date:** 2024-10-23
* **Context:** User request to implement two landing page features: (1) Hero Section with Value Proposition (headline, tagline, feature highlights) and (2) Prominent and Visually Distinct URL Input Section (enhanced form styling, larger input, card treatment, visible CTA). Goal: transform bare functional page into engaging experience while using current styles with slight retro corporate adaptations.
* **Decision:** Updated `app/page.js` to wrap existing form logic in new `<section class="hero">` + `<section class="shorten-section">` with prominent-form, prominent-input, and prominent-button classes. Appended dedicated CSS block to `app/globals.css` leveraging existing CSS variables, typography, and Substack/intranet palette (added subtle beige hero tint and stronger borders for distinction). No changes to layout.js, APIs, auth, list page, or core shortening logic.
* **Consequences:** Delivers compelling first-time visitor experience and focal-point input per acceptance criteria and business rationale. Maintains full backward compatibility and visual consistency. Slight design tweaks (beige tint, 2px borders) enhance prominence without deviating from established editorial/retro theme. Added reasoning.md and this ADR entry.

## 11. Trust Signals and Feature Highlights
* **Date:** 2024-10-24
* **Context:** User request to implement "Trust Signals and Feature Highlights" feature per user story: As a potential user evaluating the tool, I want to see quick highlights of key benefits and security notes so that I feel confident using the application for my links. Business rationale: Builds credibility and promotes the app's strengths (security, speed, internal focus). Technical blueprint: Add a new "Why Use Ender Pearl?" section in `app/page.js` with 3-4 bullet points or icons. Extend `app/globals.css` with supporting styles. Acceptance: Three+ benefit highlights (e.g. "Secure internal access", "Instant 302 redirects", "Trackable analytics"), appears below shortening form, static/no auth.
* **Decision:** Added a new static `<section className="trust-signals">` (with h2 title, intro p, and grid of 4 `.highlight` cards using emoji icons) to `app/page.js` immediately after the existing shorten-section. Appended a dedicated CSS block to the end of `app/globals.css` (`.trust-signals`, `.highlights` responsive grid, `.highlight` bordered cards leveraging existing CSS vars, typography, and retro corporate palette). Preserved all prior code (hero, form logic, results, auth, list page, etc.). No backend, data, or layout changes.
* **Consequences:** Meets all acceptance criteria exactly and fulfills the business goal of building visitor confidence on the public homepage. Maintains 100% backward compatibility and visual consistency with Substack/intranet styles. Introduces reusable static highlight pattern for future landing expansions. Minor increase in homepage markup/CSS size (negligible). Added reasoning.md and this ADR entry.

## 12. Header Responsiveness Review (Home Page Focus)
* **Date:** 2024-10-25
* **Context:** User request to "make a review of the home page to make it responsive, specifically for the header+". The existing Substack-replicated header (ADR #6) used fixed 88px height and non-responsive flex layout, risking overflow on mobile. Homepage enhancements (hero, form, trust signals) had partial responsive rules but header was the priority.
* **Decision:** Updated `app/layout.js` (added responsive class to logo Image, replaced inline spacer with `.header-spacer` class) and `app/globals.css` (changed top-bar to auto/min-height, added `.logo-image` responsive rules, flex-wrap for actions, new @media queries at 768px and 480px for header/spacer/logo/buttons). No changes to `app/page.js`, auth logic, APIs, or other pages. Preserved exact prior visual design on desktop.
* **Consequences:** Header is now fully responsive (scales logo, wraps actions, adapts height/spacer on mobile). Home page renders cleanly across devices without clipping or horizontal scroll. Maintains 100% backward compatibility with existing features, Substack/intranet styling, and retro aesthetic. Minor CSS size increase. Added reasoning.md and this ADR entry.

## 13. Logo Image Sizing by Resolution
* **Date:** 2024-10-26
* **Context:** User request to "make the logo image bigger in normal and higher resolutions, meanwhile, smaller in low resolutions". Prior header work (ADR #6 replication + ADR #12 responsiveness) used fixed-ish max-heights (36px desktop, 28px/24px mobile) that didn't differentiate normal vs high-res desktops or make low-res sufficiently compact relative to larger base.
* **Decision:** Updated `app/globals.css` only: increased base `.logo-image` max-height to 48px (normal desktop), added `@media (min-width: 1200px)` for 52px (higher res), tuned low-res media queries to 32px (≤768px) and 26px (≤480px) for smaller footprint. Adjusted `.top-bar`/`.top-bar-inner` min-heights and `.header-spacer` (96px base, 100px high-res, 72px/60px mobile) to accommodate without overlap. No changes to `app/layout.js`, logo asset, or other files.
* **Consequences:** Logo now more prominent and impactful on standard + high-resolution screens (better branding visibility); remains compact and non-intrusive on low-res/mobile to preserve layout integrity and usability. Maintains aspect ratio, Substack/intranet retro style, full responsiveness, and 100% backward compatibility. Minor CSS additions only. Added reasoning.md and this ADR entry.

## 14. Homepage Project Introduction
* **Date:** 2024-10-27
* **Context:** User request to "Add some information as the introduction telling this page is part of the 'Intranet from the Trenches' project. Include a link to the 'Intranet from the Trenches' blog (https://intranetfromthetrenches.substack.com/)".
* **Decision:** Added a new static introductory block (`.project-intro`) at the top of the public homepage in `app/page.js` containing the required statement and a properly attributed external link. Extended `app/globals.css` with dedicated styles (`.project-intro`) that reuse existing CSS variables, retro editorial palette, and Substack-replicated design language for seamless integration. No modifications to layout, auth, APIs, list page, or any functional logic.
* **Consequences:** Homepage now explicitly identifies itself as part of the "Intranet from the Trenches" project and provides a direct link to the source Substack blog, improving project context and cross-promotion. Fully backward compatible; no regressions to shortening flow, results, responsiveness, or prior enhancements (hero/trust/header work). Maintains strict adherence to the established visual identity from ui-rules.md and ADRs #6/#10-13. Minor, low-risk presentational change only.

## 15. Homepage Split Layout for Name/Description and Form
* **Date:** 2024-10-28
* **Context:** User request to restructure the home page: place the app name ("URL Shortener for 'Intranet from the Trenches'") and description/purpose on the left side; place the textbox, button, and shortening result on the right side; center everything in the middle of the page.
* **Decision:** Refactored `app/page.js` to use a flex-based split layout (`.home-split` with `.left-panel` and `.right-panel`). Moved descriptive content (h1 name + multiple purpose paragraphs) to left, form + result display to right. Added supporting CSS in `app/globals.css` (`.home-centered`, split rules, panel styles, responsive stack on mobile). Preserved all shortening logic, state, error handling, and result rendering. Removed prior section wrappers that conflicted with new layout. No changes to layout.js, APIs, auth, or other pages.
* **Consequences:** Achieves the exact requested visual structure (left info, right interactive + results, overall centered). Maintains full functionality and retro "Intranet from the Trenches" styling. Responsive fallback stacks panels vertically on small screens. Minor presentational change only; backward compatible with existing features. Added reasoning.md and this ADR entry.