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

## 16. Homepage Wider Columns, Borderless Shortener Box, and Stats Row
* **Date:** 2024-10-29
* **Context:** User request to enhance the home page split layout: make both columns wider for higher resolution screens, remove the border line from the shortener box (prominent-form), and add a new row after the main split containing a component that shows the number of URLs already shortened plus one example of a shortened URL.
* **Decision:** 
  - Updated `app/page.js` to include React state/effect for fetching public stats, refresh after shorten, and render a new `.stats-row` component below the `.home-split`.
  - Created new public API endpoint `app/api/public-stats/route.js` (GET) that returns `{ count, example }` using existing `readUrls()` (file or Cosmos) and security helpers.
  - Appended targeted CSS rules to `app/globals.css` for wider container (1280px), adjusted flex proportions/gaps, `border: none` on `.prominent-form`, and full styling for the new stats row (with responsive rules).
  - Preserved all shortening logic, prior split layout, retro "Intranet from the Trenches" styling, and auth/API boundaries.
* **Consequences:** 
  - Homepage now feels more spacious on high-res displays while remaining responsive.
  - Shortener form is cleaner (no border).
  - New public teaser stats row provides immediate social proof and example usage (auto-refreshes on shorten).
  - Lightweight new API follows existing patterns (security, lib abstraction) without requiring auth.
  - Minor increase in client-side fetches and CSS size; fully backward compatible. No impact on list page, auth, or backend.
  - Added reasoning.md and this ADR entry #16. New reusable "public stats teaser" pattern established for landing pages.

## 17. Recent Public Shortened URLs and Anonymous Usage Stats Dashboard Teaser
* **Date:** 2024-10-29
* **Context:** User request to implement two new public homepage features for anonymous visitors: (1) "Recent Public Shortened URLs" (list of up to 5 most recent short links with originals + timestamps) and (2) "Anonymous Usage Stats Dashboard Teaser" (aggregated public stats: total links, unique domains, monthly growth teaser). Business goals: engagement, social proof, trust without auth. Technical blueprint specified modifying app/page.js + extending /api/public-stats (or reuse); add sections below existing stats-row using current CSS classes.
* **Decision:** 
  - Enhanced `app/api/public-stats/route.js` (GET) to return extended payload: `{ count, recent: [{id,original,shortUrl,created}, ...] (top 5 by created desc), uniqueDomains, thisMonth }`. Reuses `readUrls()` (file + Cosmos), adds sorting/domain extraction/month calc. Security unchanged.
  - Updated `app/page.js`: extended stats state + fetchStats() to consume new fields; kept existing `.stats-row` for count; added two new `.stats-row` sections below it (`.stats-teaser` with 3 `.stat-card` grid for totals/domains/month; `.recent-section` with `.recent-list` of short→original+timestamp). Dynamic refresh via fetch after successful shorten. Zero-data graceful messages. Pure JSX, no new components.
  - Appended targeted CSS to `app/globals.css` (`.stats-cards`, `.stat-card`, `.recent-list`/`.recent-item`) reusing existing vars, .stats-content, .metadata, .short-url for visual consistency with retro/Substack style.
  - Preserved 100% of prior homepage (split layout ADR#15, stats ADR#16, shortening, responsiveness, auth boundaries).
* **Consequences:** 
  - Homepage now delivers both requested features to unauthenticated users with dynamic updates and zero-state handling.
  - Lightweight extension of existing public-stats API and client fetch pattern (reusable for future teasers).
  - Full visual/functional consistency; no impact on protected /list, auth, or backend storage.
  - Minor increase in API response size and client markup/CSS.
  - Added reasoning.md and this ADR entry #17. Establishes "public stats + recent list" pattern for landing pages.
## 18. Maximize Logo in QR Codes + Switch to Brand Logo Asset
* **Date:** 2024-10-30
* **Context:** User request to "Integrate the logo in the QR code to occupy as much space as possible" and "Don't use the qr_logo.png image if not needed".
* **Decision:** Modified `app/lib/qr.js` (the QR generator using qrcode + jimp): switched from `public/qr_logo.png` to the existing project `public/brand_logo.png` (used in header). Maximized logo footprint to ~33% of QR width (was 22%), increased base QR width to 400px, and introduced a white square background pad composited underneath the logo to clear modules and allow larger safe overlay. Updated QR preview size + caption in `app/page.js`. All generation paths (file + Cosmos via urls.js/cosmos.js) benefit automatically. No changes to other files or behavior.
* **Consequences:** QR codes now feature a much larger, more prominent logo (visually dominant center) while remaining scannable thanks to high ECC level 'H' and padding. Eliminates dependency on dedicated qr_logo.png (uses shared brand asset for consistency). Display updated to showcase the change. Fully backward compatible; no impact on shortening, stats, auth, UI layout, or retro styling. Minor increase in QR image resolution. Added reasoning.md + this ADR entry #18.

## 19. URL Visibility Toggle Button in List Page
* **Date:** 2024-10-31
* **Context:** User request to "Include a new button in the URLs list page for each URL to change it to public or private. It must be a unique button that will save the new status automatically." Prior work had introduced the `private` flag for creation and display (ADR #19 context), but no post-creation toggle existed in the protected list UI.
* **Decision:** 
  - Extended data layer: added `updateUrlVisibility(short, isPrivate)` to `app/lib/urls.js` (file impl) and `app/lib/cosmos.js` (Mongo update + re-fetch).
  - Created new protected PATCH endpoint `app/api/urls/[id]/route.js` (validates origin/security, accepts boolean `private`, returns enriched item).
  - Updated `app/list/page.js`: added `updatingId` state, `handleToggleVisibility` async handler (PATCH call, optimistic state + localStorage cache sync, auth redirect on 401/403), and unique per-row `<button>` in Actions column ("Make Public" / "Make Private" text, disabled during save).
  - Reused existing styles, error handling, and list enhancements (search/paging).
* **Consequences:** 
  - Admins can now instantly toggle visibility for any URL directly from the list (auto-saves, no extra UI steps).
  - Immediate UI feedback and cache consistency; private flag now fully mutable post-creation.
  - Public stats/recent lists continue to exclude private URLs (unchanged).
  - Fully backward compatible; no impact on shorten flow, redirects, auth, or other pages.
  - New pattern: PATCH update endpoint + per-item mutation buttons for list UIs.
  - Added reasoning.md and this ADR entry #19. All prior ADRs and retro "Intranet from the Trenches" styling preserved.

## 20. Homepage Clicks Box, Private Checkbox Visual, Title Fetching, Recent Titles + Copy Buttons
* **Date:** 2024-11-01
* **Context:** User request to enhance homepage and shortening flow: (1) new box showing total clicks across all shortened URLs, (2) visual background color change on privacy checkbox when selected (private), (3) fetch and persist web page title when shortening a URL, (4) display title (if exists) for items in Recent Public Shortened URLs, (5) add Copy to clipboard button per recent shortened URL.
* **Decision:** 
  - Added `totalClicks` aggregation (sum of stats.length over public URLs) to GET /api/public-stats and exposed in homepage stats cards.
  - Enhanced privacy checkbox wrapper in app/page.js with conditional red-tinted background (#fef2f2) + border when `isPrivate` true.
  - Added server-side `getPageTitle` helper (fetch + regex title extraction, 5s timeout) in app/api/shorten/route.js; pass title to addShortUrl.
  - Extended data layer (app/lib/urls.js + app/lib/cosmos.js) to store/return `title` field (null-safe).
  - Updated public-stats to include `title` in recent items and totalClicks in response.
  - Updated homepage recent list JSX to render title (if present) and per-item "Copy" button (clipboard API + fallback).
  - Minor result display update to show title post-shorten.
  - No changes to auth, list page, or other flows.
* **Consequences:** 
  - Homepage now surfaces aggregate clicks + visual private intent + richer recent list (titles + easy copy).
  - Titles are best-effort (may be null for non-HTML or timeouts) and stored on creation.
  - Public stats/recent continue to exclude private URLs.
  - Fully backward compatible; new fields are optional.
  - Added reasoning.md and this ADR entry #20. Preserves retro "Intranet from the Trenches" styling and prior patterns (public-stats, split layout, etc.).

## 21. List and Stats Page Enhancements (Sorting, Column Selector, Icon Actions, Styled Properties)
* **Date:** 2024-11-02
* **Context:** User request to enhance the protected list page (/list) and individual stats page (/stats/[short]): (1) allow ordering lists by clicking column headers with alternating sort order, (2) add a button to select which columns are shown (all existing columns available), (3) convert Actions column items to icon buttons using interface-style icons from flaticon.com for stats and privacy, (4) in stats page change the "Access Statistics for" slug to title or original URL, (5) style remaining properties like the homepage stats cards, (6) make Access Log sortable by headers with alternating order.
* **Decision:** 
  - Updated `app/list/page.js`: introduced client-side `sortColumn`/`sortDirection` state + `handleSort` (alternating on header click), dynamic `visibleColumns` state + "Select Columns" toggle panel with checkboxes for all columns (Short Code, Shortened URL, Original URL, Title, Created, Visibility, Accesses, Actions), rendered table cells conditionally. Replaced Actions text with compact SVG icon buttons (bar-chart for stats, lock/unlock for privacy) using new `.action-btn` CSS. Extended search to titles. Preserved all prior pagination/search/cache/visibility logic.
  - Updated `app/stats/[short]/page.js`: header now uses `title || original` for display name. Replaced plain property divs with `.stats-row .stats-cards` grid (reusing homepage stat-card styles for Access Count, Short Code, Original URL, Title, Created). Added identical client-side sorting to Access Log table (headers clickable, alternating, indicators).
  - Updated `app/api/stats/[short]/route.js` to return `title` field.
  - Extended `app/globals.css` with sortable header hover styles and `.action-btn` retro-flat icon button rules.
  - No backend or auth changes; all new behavior is client-side for consistency with prior list work.
* **Consequences:** 
  - Significantly improved usability on list (sortable + customizable columns + icon affordances) and stats (richer header + consistent visual language + sortable logs).
  - Maintains 100% backward compatibility, retro "Intranet from the Trenches" styling, browser cache, auth, dual storage.
  - Icons are inline SVGs (self-contained, flaticon-inspired clean line style) avoiding external assets.
  - New patterns: reusable header-sort logic and column-visibility dropdown for future tables.
  - Added reasoning.md + this ADR entry #21. Minor increase in client JS/CSS size.
  
## 22. Alias or Custom Slug Functionality
* **Date:** 2024-11-03
* **Context:** User request to implement "Alias or Custom Slug" feature: allow users to manually define the ending segment of a shortened URL (replacing the default random 6-char string) with a custom descriptive word/phrase. Goal: make links readable, memorable, intuitive for presentation, marketing campaigns, branding, and trust-building across digital/print channels.
* **Decision:** 
  - Added shared `isValidCustomSlug(slug)` validator in both `app/lib/urls.js` (file) and `app/lib/cosmos.js` (Mongo): 1-64 chars, `^[a-zA-Z0-9_-]+$` only, rejects reserved system paths (api/login/list/stats/etc.).
  - Extended `addShortUrl(..., customSlug = null)` in both storage layers: if valid custom provided use it (after uniqueness check); else generate random. Throws descriptive errors for invalid/duplicate.
  - Updated `app/api/shorten/route.js` to accept `customSlug` in body, forward to addShortUrl, and return specific 400 errors for alias issues.
  - Enhanced `app/page.js`: new optional "Custom alias" input field (under URL, before privacy), client-side pre-validation, conditional payload, reset on success. Reuses existing prominent form styles + metadata hints.
  - No changes to redirect (`app/[short]/route.js`), list, stats, public-stats, visibility, QR, title fetching, or auth. Custom slugs stored in same `id` field.
* **Consequences:** 
  - Users can now create highly readable custom short links (e.g. /product-launch) while random codes remain default.
  - Improves UX for campaigns/branding without affecting existing data or flows.
  - Centralized validation + clear error messages.
  - 100% backward compatible; dual file/Cosmos parity maintained.
  - New optional pattern for creation params established.
  - Added reasoning.md + this ADR entry #22. All prior retro "Intranet from the Trenches" styling, split layout, stats, etc. preserved.
## 23. Login-Gated Advanced Options + Unified Styling on Homepage
* **Date:** 2024-11-04
* **Context:** User request: "Make private", "Custom Alias" and "Link Expiration" options are only available for users that have been login. So, show all three options but greyed out for anonymous users. For anonymous users, make sure that none of these three features are sent when shortening a URL. Keep the style and design for the "Original URL" field. Unify the style and design of the "Make private", "Custom Alias" and "Link Expiration" options.
* **Decision:** 
  - Created new public endpoint `app/api/auth/status/route.js` (GET) that returns `{ authenticated: boolean }` based on the httpOnly 'auth' cookie (lightweight status probe, no middleware protection).
  - Updated `app/page.js`: added `isAuthenticated` state + fetch on mount; guarded all client validation and payload construction (`private`, `customSlug`, `expiresAt`, `maxClicks`) behind `if (isAuthenticated)` so anonymous users never send the fields; disabled the three option inputs with `!isAuthenticated`; restructured the options into a new `.advanced-options` wrapper with per-option `.option` + conditional `.greyed` classes; appended "(login required)" hints for anon; preserved exact `.prominent-input` for Original URL and all prior homepage logic (split layout, stats, recent, QR, title, etc.).
  - Extended `app/globals.css` with unified retro styles: `.advanced-options`, `.option` (shared beige card treatment), `.option-input`, `.greyed` (opacity + disabled visuals), `.expiration-fields`, `.private-active` (reuses prior red tint). Original URL styles untouched.
  - No changes to backend shorten logic, lib/urls.js, cosmos.js, layout, middleware, or other pages (they already default the fields safely).
* **Consequences:** 
  - Anonymous users see the three options (visible affordance) but cannot interact or activate the features; payload is strictly limited to basic URL only.
  - Logged-in users retain full functionality with no visual or behavioral change.
  - Styles now unified across the three advanced options while "Original URL" remains prominent and distinct.
  - Maintains 100% backward compatibility, auth boundaries, retro "Intranet from the Trenches" design, and all prior features (public stats, QR, expiration enforcement for auth users, etc.).
  - Added lightweight public auth status pattern for future client-side gating needs.
  - Files impacted: app/page.js, app/globals.css, app/api/auth/status/route.js (new), reasoning.md, ADR.md #23.
  - Positive: clearer UX distinction, consistent design language, security by omission for anon.
  
## 24. Homepage Advanced Options Collapsible Box
* **Date:** 2024-11-05
* **Context:** User request to group the "Make private", "Custom Alias" and "Link Expiration" options (previously unified in ADR #23) into an "Advanced Options" box or similar that the user can collapse or expand on the home page. Goal: reduce visual clutter on the primary shorten form while keeping the three features discoverable and grouped.
* **Decision:** 
  - In `app/page.js`: Introduced `advancedOpen` React state (default closed). Wrapped the existing advanced options markup inside a new `.advanced-box` container. Added a clickable `.advanced-header` (with "Advanced Options" label + +/- toggle icon) that toggles visibility of the inner content via `onClick` + keyboard support (`Enter`/`Space`) and `aria-expanded`. The inner options block is conditionally rendered only when open. All prior logic (auth gating via `isAuthenticated`, disabled inputs for anon, payload filtering, validation, private visual tint, resets) preserved exactly. "Original URL" field remains outside the box.
  - In `app/globals.css`: Appended new rules for `.advanced-box`, `.advanced-header` (retro beige header with hover/focus), `.toggle-icon`, and integration overrides so existing `.option` cards render cleanly inside the collapsible without double borders.
  - No changes to backend, lib files, auth, stats, result display, or any other functionality.
* **Consequences:** 
  - Homepage form is now cleaner by default (advanced features hidden until user expands the box).
  - Users can still access all three options with a single click; grouping is explicit.
  - Maintains 100% backward compatibility, login-gating behavior, retro "Intranet from the Trenches"/Substack styling, and all prior homepage features (split layout, public stats, recent URLs, QR, etc.).
  - Accessibility improved with ARIA and keyboard handling for the toggle.
  - Minor increase in client state and CSS; purely presentational/UX change.
  - reasoning.md created documenting the steps. Aligns with ADR #23 and all previous homepage evolution patterns.
## 25. Decay Link (Burn After Reading) Feature
* **Date:** 2024-11-06
* **Context:** User request to implement "Decay Link" specialized mode per detailed Functional & UX Specification: single-use self-destructing short URLs that are automatically deleted from the database after first access. Must be private by default, never appear in public stats/recent lists, provide a custom "destroyed" status page (not generic 404), protect against crawler/preview bots via User-Agent, and deliver a tabbed UI on the homepage with visual warm/reddish feedback, info banner, streamlined form (hiding non-applicable options), and special button/result states.
* **Decision:** 
  - Extended data model with `decay: boolean` flag (forced private, no custom/exp for decay links) in app/lib/urls.js + app/lib/cosmos.js. Added `deleteShortUrl()` helper.
  - Updated creation: app/api/shorten/route.js accepts and forwards `decay`.
  - Core burn logic in app/[short]/route.js: crawler UA filter list, early safe redirect for bots on decay, log-then-delete on first human access, render dedicated 🔥 "Confidential Link Destroyed" page (410) for subsequent or burned accesses. Preserved all expiration logic.
  - Homepage (app/page.js): introduced `mode` state + tab selector (Standard vs Decay), conditional rendering of banner/form/button/result, decay-specific payload, visual classes.
  - Styling: appended decay-specific CSS in app/globals.css (tabs, warm tones, banner, button, warning note).
  - Admin surfaces: app/list/page.js now shows "Type" column (🔥 Decay badge), updated docs.
  - Ensured decay links are excluded from public-stats/recent (via private flag) and never leak.
  - All changes maintain dual storage parity, auth boundaries, QR, titles, existing expiration, and retro "Intranet from the Trenches" design.
* **Consequences:** 
  - Delivers complete privacy-focused single-use link capability matching the spec exactly.
  - Strong bot protection prevents accidental burns from link previews.
  - Clean UX with immediate visual mode distinction and reduced cognitive load in decay mode.
  - Decay links appear in admin list (for management) but are auto-removed after use.
  - 100% backward compatible; no impact on standard shortening flows or prior features (ADRs 1-24).
  - New pattern: creation-time "mode" flags with specialized redirect handling (reusable for future ephemeral link types).
  - Added reasoning.md + this ADR entry. Project memory updated.
## 26. Unify Styles of Standard Link and Decay Link Tabs
* **Date:** 2024-11-07
* **Context:** User request to unify the visual design of the "Standard Link" and "Decay Link" tabs (and related options) so they feel like two choices inside a single form rather than two distinct modes. Prior implementation (ADR #25) used separate tab classes and decay-specific form/button/result styles (warm orange tints, special borders), making the tabs visually different even in active/inactive states.
* **Decision:** 
  - Moved tab buttons inside the single `.prominent-form` container in `app/page.js`.
  - Removed all decay-specific class conditionals from form, button, and result elements.
  - Rewrote tab CSS in `app/globals.css` so `.mode-tab` (and container) rules are identical for both tabs: same hover, same active state (using shared brand accent underline), same backgrounds/borders.
  - Only kept functional/contextual decay elements (banner, warning note) that do not affect tab appearance.
  - Tabs now blend into the form top edge for a "one form" perception.
* **Consequences:** 
  - Both tabs now render and transition with exactly the same styles in selected and unselected states.
  - Stronger sense of a unified shortening form with mode choice at the top.
  - Functional decay behaviors (hidden advanced options, special payload, self-destruct messaging) preserved.
  - No new colors or breaking changes; fully aligned with retro Intranet/Substack palette and prior homepage evolution (ADRs #23-25).
  - Added reasoning.md and this ADR entry #26. Project memory will be synced.
## 27. Tab Visual Adjustments for Standard Link and Decay Link
* **Date:** 2024-11-08
* **Context:** User request to refine the "Standard Link" and "Decay Link" tabs/option box: remove green border on selected tab, remove rounded corners, make tabs adapt full width to the option box below, and apply red warning background color specifically to the "Decay Link" option box.
* **Decision:** 
  - In `app/page.js`: Added conditional `decay-mode` class to the `.mode-tabs` container (`className={`mode-tabs ${isDecayMode ? 'decay-mode' : ''}`}`) to enable targeted styling for decay without altering logic.
  - In `app/globals.css`: Appended new CSS block with overrides:
    - `.mode-tabs { margin: 0 0 16px 0 !important; border-radius: 0 !important; }` (full width alignment + square corners).
    - `.mode-tab.active { box-shadow: none !important; }` (removes green selection border).
    - `.mode-tabs.decay-mode { background-color: #fee2e2 !important; ... }` (red warning tint for Decay Link).
    - Responsive and active-state refinements included.
  - Preserved all prior tab unification (ADR #26), decay functionality, retro styling, and no changes to JS logic, backend, or other UI.
* **Consequences:** 
  - Tabs now render with square corners, flush width matching the form inputs/options below, and no green border on selection.
  - Decay Link tab area receives explicit red warning background when active (soft red #fee2e2).
  - Visual request fully met with minimal, isolated CSS + one class toggle.
  - 100% backward compatible; no regressions to shortening flows, auth, stats, or prior ADRs.
  - Added reasoning.md documenting steps. New pattern for mode-specific warning backgrounds established for future ephemeral features.
  - Files impacted: app/page.js, app/globals.css, ADR.md (this entry #27), reasoning.md.
## 28. Separate Standard Link and Decay Link Forms (Remove Tabs)
* **Date:** 2024-11-09
* **Context:** User request to split the "Standard Link" and "Decay Link" into two different forms (Decay below Standard), remove the tabs entirely, use the titles as section titles + bottom buttons, while keeping identical styles, colors, fonts, and overall design as the rest of the web app (Intranet from the Trenches retro/Substack palette).
* **Decision:** 
  - Refactored `app/page.js` to use two independent `<form>` elements inside the right panel of the split layout (no shared `mode` state or tab UI).
  - Separate controlled inputs (`standardUrl`, `decayUrl`).
  - `handleSubmit` generalized to accept specific URL value + decay flag.
  - Standard form retains full Advanced Options collapsible + login gating.
  - Decay form is streamlined (banner + input + dedicated button).
  - Added `.form-section-title` CSS class (reusing Georgia serif + existing text colors) and spacing rule between the two forms.
  - Preserved `.decay-banner` / `.decay-warning` as contextual (non-tab) elements.
  - All prior prominent-form, button, option, result, stats, and retro styling rules left untouched.
* **Consequences:** 
  - Tabs completely removed; two distinct titled forms stacked vertically.
  - UX improved for independent use of each link type.
  - 100% visual and functional consistency with existing design system (no new colors, fonts, or layout patterns).
  - Decay backend behavior, auth gating, result display, QR, public stats, etc. fully preserved.
  - Added reasoning.md + this ADR entry #28. Minor client-only change; no backend impact.
  - Aligns with prior homepage evolution (ADRs #15 split layout, #23-27 advanced/decay work).
## 29. Clear Differentiation + Grey-Out Between Standard and Decay Forms + Retain Decay Records for Stats
* **Date:** 2024-11-10
* **Context:** User request to improve discoverability and focus: make "Standard Link" the primary eye-catcher while ensuring users notice the "Decay Link" option. When one shortening action is in progress the other form must be greyed out (visually disabled) without changing the inactive button's text. Additionally, Decay (burn-after-reading) links must no longer be deleted from the database after first use; they must be kept permanently for internal statistics and access logs.
* **Decision:** 
  - Refactored homepage forms in `app/page.js` with separate loading flags (`standardLoading`, `decayLoading`) and `anyLoading` guard. Applied conditional `greyed-out` class to the inactive form. Inputs/buttons disabled when anyLoading. Buttons retain original labels.
  - Added visual differentiation in `app/globals.css`: Standard form gets "Recommended" badge; Decay form receives left red accent bar + warm background tint + reddish title. New `.greyed-out` rules (opacity 0.42, pointer-events none, forced grey button).
  - Removed `deleteShortUrl` call from `app/[short]/route.js` for decay links (first human access now only logs + redirects; subsequent accesses still show 410 destroyed page via stats check). Updated destroyed page copy to mention records are retained for stats. Removed unused import.
  - Minor clarification text update in `app/list/page.js`.
  - Preserved all prior decay protections (bot UA filter, private flag, hasBeenAccessed guard), dual storage, auth, QR, public stats exclusion, retro styling, and split-form layout.
* **Consequences:** 
  - Users' eyes are drawn first to Standard Link; Decay is clearly secondary but discoverable.
  - Mutual exclusion during shortening prevents confusion; inactive button text never changes.
  - Decay links now persist forever in DB (file or Cosmos) for admin stats/listing while remaining single-use for visitors.
  - No breaking changes to existing data or APIs. 100% backward compatible with prior ADRs (esp. #25-28 decay work).
  - Added reasoning.md + this ADR entry #29. Files impacted: app/page.js, app/globals.css, app/[short]/route.js, app/list/page.js.
## 30. Decay Link Re-creation for Previously Used (Closed) URLs
* **Date:** 2024-11-11
* **Context:** User request for "Decay Link" functionality: If a URL has already been shortened as a decay link and has been used (now closed), requesting the same URL again for a Decay Link must insert a *new* record in the database instead of reusing the old one.
* **Decision:** Updated duplicate/original-URL lookup logic inside `addShortUrl` (file impl in `app/lib/urls.js` and Mongo/Cosmos impl in `app/lib/cosmos.js`). For decay mode only: reuse an existing decay record *only* if it has never been accessed (`stats.length === 0`). Otherwise generate a fresh short code and insert a brand-new record. Standard (non-decay) links retain original reuse behavior. Minor clarification added to list page description. No changes to shorten API, redirect handler, UI forms, or data model.
* **Consequences:** 
  - Users can now obtain fresh single-use decay links for the same original URL after a prior decay instance has been consumed.
  - Each decay record remains independently burnable (first access logs + redirects; later accesses show 410 destroyed page).
  - All prior decay guarantees preserved (always private, bot protection, exclusion from public stats/recent, permanent retention for analytics).
  - Storage backend parity maintained (file + Cosmos).
  - No impact on standard links, expiration, custom slugs, or other features.
  - Backward compatible; existing data and behavior unchanged.
  - Added reasoning.md + this ADR entry 
    
  ## 31. Decay Link Section UX Implementation (Full-Width Independent Module)
* **Date:** 2024-11-12
* **Context:** User request to implement the "Decay Link" section per detailed UX Specification: secondary independent full-width single-column module placed directly below page title + primary Standard shortener. Warm amber/red borders, 🔥 icon, exact title + microcopy, streamlined single input (placeholder "Paste your confidential URL here..."), no advanced options, prominent red/orange "Create Self-Destructing Link" CTA.
* **Decision:** Refactored homepage layout in app/page.js so Decay form lives outside the .home-split (after it) to achieve full-width placement below title/Standard. Added exact microcopy, labels, placeholder, and CTA per spec. Extended app/globals.css with dedicated .decay-form styling (amber border #b45309, warm bg, red .decay-cta button). Preserved all prior decay backend, grey-out mutual exclusion, result display, retro styling, and split layout for primary Standard form. No backend changes.
* **Consequences:** Delivers exact UX layout and visual cues requested. Clear spatial separation between Standard (primary) and Decay (secondary security module). Warm tones signal purpose shift while maintaining overall Intranet/Substack retro theme. Streamlined input reduces cognitive load. All existing single-use decay features (bot protection, 410 page, permanent retention) remain fully functional. Minor presentational change only; 100% backward compatible with ADRs #15, #23–#30.

## 32. Last 50 Visits Audit Log + Bot Identification + QR Code in Detail View
* **Date:** 2024-11-13
* **Context:** User request to implement three features: (1) dedicated section in /app/list/page.js showing strictly the last 50 visit records (LIMIT 50, chrono descending) for real-time audit/traffic analysis; (2) server-side User-Agent bot/crawler detection (Googlebot, Bingbot, Slackbot, Twitterbot, LinkedInBot, WhatsApp, etc.) during redirect, persisted as `is_bot`, with visual badges in both the visits list and the stats access log; (3) display of the generated QR code (always encoding the shortened URL) in the per-URL detail view (`/stats/[short]`) together with Download QR and Copy Short Link actions.
* **Decision:** 
  - Added lightweight centralized `isBotUserAgent()` + maintainable `BOT_PATTERNS` list in `app/lib/urls.js` (exported).
  - Updated redirect handler (`app/[short]/route.js`) to classify visits using the shared detector and pass `isBot` to `logAccess()`.
  - Extended both storage layers (`app/lib/urls.js` file + `app/lib/cosmos.js`): persist `is_bot` on stats, normalize on read, added `getRecentVisits(limit)` (strict server-side LIMIT + sort desc).
  - New protected API `app/api/visits/route.js` returning exactly the last 50 visits.
  - Updated `app/list/page.js`: added visits fetch + full audit table (Timestamp, Short, Original, IP, UA, Referer, Visitor Type) with `BotBadge` (🤖 Bot / 👤 Human) and refresh integration.
  - Updated `app/stats/[short]/page.js`: added identical `BotBadge` + "Visitor Type" sortable column to Access Log; new QR section rendering the stored QR (short URL), Download PNG button, and Copy Short Link button with clipboard + feedback.
  - `app/api/stats/[short]/route.js` and existing data flows automatically surface the new fields.
  - Preserved all prior features (decay, expiration, auth, dual storage, retro styling, list enhancements).
* **Consequences:** 
  - Provides the requested real-time audit log limited to 50 records for performance.
  - Bot detection is fast (simple includes on lowercased UA) and does not delay redirects.
  - Consistent visual badges across list and stats pages.
  - QR always encodes the short link (correct analytics path) and is now previewable/downloadable directly from detail view.
  - Full storage parity (file + Cosmos/Mongo). New `getRecentVisits` helper reusable.
  - Added reasoning.md and this ADR entry #32. 100% backward compatible; no breaking changes to existing records or flows.
  
## 33. QR Code Regeneration Option on Stats Page
* **Date:** 2024-11-14
* **Context:** User request to "Provide the option to generate a new QR code when visiting the stats of a URL" on the /stats/[short] page. Previously QR was only generated at creation time (ADR #18, #32) and displayed in the detail view.
* **Decision:** Added POST handler to app/api/stats/[short]/route.js that calls new regenerateQrCode() helpers in app/lib/urls.js (file) and app/lib/cosmos.js (Mongo). Updated app/stats/[short]/page.js with a "🔄 Regenerate QR Code" button (secondary style), loading state, success feedback, and immediate UI refresh via setData(). Reuses existing generateQrCodeWithLogo, security (middleware + origin), and styling.
* **Consequences:** Users (authenticated) can now refresh the QR image on demand from the stats view (e.g. after logo updates or for fresh copies). Instant client update, no reload. Full parity between file and Cosmos storage. Preserves all prior features, retro styling, and security. Minor addition to API surface and client state. Added reasoning.md documenting the implementation.


## 34. Recent Public Shortened URL Two-Column Layout
* **Date:** 2026-08-14
* **Context:** The homepage's "Recent Public Shortened URLs" items needed a clearer left-to-right reading order, stronger metadata hierarchy, QR visibility, and explicit actions for opening or copying each shortened URL.
* **Decision:** Updated `app/page.js` to render each recent item as a horizontal two-column layout: QR code first, then optional bold title, source URL/date metadata, accent-colored shortened URL link, and Open/Copy actions. Extended `app/api/public-stats/route.js` to expose stored `qrCode` values and added responsive styling in `app/globals.css`, stacking columns on narrow screens.
* **Consequences:** Recent links are easier to scan and act upon, with the short URL visibly emphasized and safely opened in a new tab. Copy remains available through the existing clipboard fallback. Items without QR data remain backward compatible through a clear placeholder, and mobile users receive a single-column fallback.

## 35. Display Shortening Results Beneath Their Respective Forms
* **Date:** 2026-08-14
* **Context:** The homepage used one shared result state and rendered the shortening result after both forms, making it unclear whether a result came from Standard Link or Decay Link.
* **Decision:** Updated `app/page.js` with separate `standardResult` and `decayResult` state, separate form-scoped error state, and a shared result renderer. Each result is now rendered directly below its originating form: Standard Link below the standard form and Decay Link below the decay form.
* **Consequences:** Users can immediately associate each shortened URL with the correct form. Existing result metadata, QR rendering, validation, loading behavior, and backend requests remain unchanged. Errors are also scoped to the form that produced them.

## 36. Analytics Dashboards for All Links and Individual Links
* **Date:** 2026-09-21
* **Context:** The `/list` experience needed analytics for all links, while each `/stats/[short]` view needed human/bot charts over selectable periods. Requested visualizations included percentages, daily bars, stacked accumulation, weekday/hour heatmap, browsers, and traffic origins.
* **Decision:** Added the shared server aggregation module `app/lib/analytics.js`, protected `GET /api/analytics` endpoint, reusable `app/components/AnalyticsDashboard.js`, and nested layouts for `/list` and `/stats/[short]`. The implementation uses existing persisted visit metadata, supports 1 week, 1 month, 3 months, and all-time ranges, and renders responsive SVG/CSS charts without a third-party chart dependency.
* **Consequences:** Both pages now expose consistent interactive analytics with file/Cosmos parity and no data migration. A small custom visualization layer avoids dependency/bundle cost, but it has fewer advanced features than a full chart library. Legacy records without bot classification remain treated as human.

## 37. English Translation of the `/list` Experience
* **Date:** 2026-09-21
* **Context:** The `/list` page needed to be fully presented in English. The page itself was mostly English, but the nested analytics dashboard still exposed Spanish labels, messages, chart legends, tooltips, and accessibility text.
* **Decision:** Translated all user-facing strings in `app/components/AnalyticsDashboard.js` and reviewed/normalized visible copy in `app/list/page.js`. Preserved all existing list, audit, analytics, authentication, caching, sorting, filtering, and pagination behavior.
* **Consequences:** The protected `/list` experience is now consistent for English-speaking users, including analytics loading, empty, error, chart, range, and screen-reader text. No backend or data changes were required.

## 38. List Analytics Range and Chart Refinements
* **Date:** 2026-09-21
* **Context:** The `/list` analytics dashboard needed a simpler presentation and time-aware visualizations: remove Daily Accumulation, show reference lines on Clicks per Day, aggregate 3-month-or-longer data weekly, and ensure the heatmap follows the selected range.
* **Decision:** Updated `app/components/AnalyticsDashboard.js` to remove the Daily Accumulation card and render horizontal scale lines based on the tallest Clicks per Day bar. Updated `app/lib/analytics.js` so quarter and all-time results use Monday-based weekly buckets while week/month remain daily; the existing range filter feeds the heatmap, browser, and source aggregations.
* **Consequences:** The dashboard is less redundant, easier to read, and remains responsive to selected time ranges. Weekly aggregation reduces visual noise for long periods. No API contract, persistence, or dependency changes were required.

## 39. Paginated Recent Visit Audit on `/list`
* **Date:** 2026-09-21
* **Context:** The Last 50 Visited URLs audit table made `/list` excessively long because all records were rendered at once.
* **Decision:** Added `app/components/RecentVisitsPager.js`, which consumes the existing server-limited `/api/visits` response and renders ten records per page with first, previous, next, and last controls. Mounted it in `app/list/layout.js` and suppressed the former unpaged audit block to prevent duplicate content.
* **Consequences:** The audit remains capped at the latest 50 records while the initial view is limited to ten rows. Users can navigate the remaining records without a backend or data-model change.

## 40. Stats Page Analytics Placement and Paginated Recent Access Log
* **Date:** 2026-09-21
* **Context:** The `/stats/[short]` page needed the complete analytics section positioned between the QR Code and Access Log components. The Access Log also needed ten records per page and newest visits first.
* **Decision:** Removed the automatic analytics mount from `app/stats/[short]/layout.js` and rendered `AnalyticsDashboard` explicitly in `app/stats/[short]/page.js` after QR Code and before Access Log. Added client-side pagination with a fixed page size of 10, navigation controls, page range metadata, and timestamp-descending initial sorting. Added focused styles in `app/globals.css` for the QR panel, visitor badges, and controls.
* **Consequences:** Stats users see analytics in the requested order and can browse long access logs without an excessively tall page. The existing analytics API, QR behavior, authentication, storage, and sort options remain unchanged; pagination operates on the already-fetched stats data.

## 41. Stats Link Detail Two-Column Layout
* **Date:** 2026-09-21
* **Context:** The `/stats/[short]` page needed a clearer information hierarchy: title first, link metadata beside QR actions, analytics next, and the access log last. The page navigator should follow the established list URL navigation pattern.
* **Decision:** Updated `app/stats/[short]/page.js` to render the requested `{title || original} data content` heading, a responsive left details table/right QR row, `AnalyticsDashboard`, and then the paginated Access Log. Added `app/components/PageNavigator.js` as the shared navigation pattern and focused responsive stats styles in `app/globals.css`.
* **Consequences:** Link metadata is scannable in one table, QR actions remain grouped beside it, and the requested page order is explicit. Desktop gets a two-column layout and mobile stacks the panels. Existing analytics, QR, sorting, authentication, and access-log behavior remain intact.

## 42. Horizontal Clicks-per-Bot Chart
* **Date:** 2026-09-21
* **Context:** The `/list` and `/stats/[short]` analytics dashboards needed a horizontal bar chart showing total clicks per identified bot, constrained to the selected time range.
* **Decision:** Extended `app/lib/analytics.js` to aggregate bot User-Agent names within the existing range-filtered visit set and exposed the ranking through the analytics API. Added a reusable horizontal chart to `app/components/AnalyticsDashboard.js`; since the dashboard is mounted on both pages, both surfaces receive the feature. Added responsive chart styling to `app/globals.css`.
* **Consequences:** Bot click totals now update whenever users select week, month, quarter, or all-time. The chart is dependency-free and responsive, while unidentified bot traffic is grouped under a safe fallback label. No storage schema or API endpoint changes were required beyond the additive response field.

## 43. Stats Link Details, Title Refresh, and Shared H2 Styling
* **Date:** 2026-09-21
* **Context:** The stats view needed a clear Link Details grouping, a way to reread the original page title, and consistent H2 presentation across protected list and stats pages matching Analytics.
* **Decision:** Added the `Link Details` H2 and title-refresh action to `/stats/[short]`; introduced a best-effort title fetch utility and protected title update endpoint with file/Cosmos persistence; added shared H2 CSS rules for list/stats sections.
* **Consequences:** Link metadata and QR content are more clearly grouped, titles can be updated without recreating links, and section hierarchy is consistent. Title fetching remains best-effort and may fail for inaccessible/non-HTML pages.

## 44. Correct Visit Classification, Bot Aggregation, and Shared Pagination
* **Date:** 2026-09-21
* **Context:** The `/list` and `/stats/[short]` pages showed inconsistent access totals, human/bot distinctions, bot analytics, and page navigator styling. Legacy records can omit the persisted bot flag.
* **Decision:** Normalized `is_bot` and legacy `isBot` values at the list and stats API boundaries, treated missing classification as human, and exposed explicit human/bot counts for link statistics. Updated `app/lib/analytics.js` so range-filtered bot rankings count only explicitly classified bot visits. Standardized list, recent-visit, and stats access-log pagination around the same navigator structure and CSS treatment.
* **Consequences:** Accesses are now consistently displayed as `human (bot)`, Total Clicks per Bot is range-correct and excludes human visits, and pagination has one shared visual language. Existing data remains backward compatible without migration; unidentified legacy visits intentionally remain human.

## 45. Technical Database and Bot Selection Documentation
* **Date:** 2026-09-21
* **Context:** The project needed a technical reference explaining how the runtime selects local JSON storage or Cosmos DB for development and production, and how User-Agent bot classification relates to visit logging and analytics.
* **Decision:** Created `Technical_Database.txt` documenting the `COSMOS_MONGODB_URI` backend switch, file/Cosmos adapter parity, environment configuration, production safeguards, bot detection, Decay-link protection, compatibility behavior, architecture flow, and troubleshooting guidance. No application code was changed.
* **Consequences:** Developers and operators have a single text-based reference for deployment and database selection decisions. The document clarifies that database selection and bot classification are independent, while recording the current fallback behavior and its production limitations.


## 46. Clarify Current Bot Persistence Behavior in Technical Documentation
* **Date:** 2026-09-21
* **Context:** Source review showed that `isBotUserAgent()` exists and Decay protection uses bot patterns, but the redirect does not currently pass the classification into `logAccess()` and the Cosmos adapter does not persist `is_bot`.
* **Decision:** Added an implementation-status note to `Technical_Database.txt` distinguishing intended analytics compatibility from the current persistence gap, including the precise remediation direction. Added the analysis to `reasoning.md`.
* **Consequences:** The documentation is accurate about current behavior and avoids claiming that all newly logged visits are persistently classified. Maintainers have a clear follow-up without changing runtime code in this documentation-only request.


## 47. Request-Time User-Agent Bot Classification
* **Date:** 2026-09-22
* **Context:** Bot status was being determined too late, while stats or analytics were rendered, instead of being fixed when each redirect request was received. The Cosmos statistics adapter also did not persist the classification.
* **Decision:** Classify the incoming `User-Agent` in `app/[short]/route.js` using the shared `isBotUserAgent()` helper and pass the boolean to `logAccess()`. Persist and normalize `is_bot` in both `app/lib/urls.js` (JSON) and `app/lib/cosmos.js` (MongoDB/Cosmos), including URL stats and recent visits.
* **Consequences:** Every logged visit has a stable request-time bot classification for list, stats, and analytics rendering. Existing unclassified records remain human-compatible, and Decay preview-bot protection continues to avoid logging/consuming protected previews. Storage behavior is now consistent across backends.


## 48. Consistent Bot Filtering and Assignment Across List and Stats Components
* **Date:** 2026-09-22
* **Context:** The request-time bot classification implemented for URL redirects needed to be consistently consumed by the Last 50 Visited URLs and Analytics for All Links components on `/list`, and by Link Analytics and Access Log on `/stats`.
* **Decision:** Reused the centralized `isBotUserAgent()` detector at `/api/urls` and `/api/visits` compatibility boundaries, normalized both `is_bot` and legacy `isBot`, explicitly mounted the list components in `app/list/page.js`, and updated the stats access log to use the same classification semantics. Redirect logging now passes the request-time `isBot` value to storage.
* **Consequences:** List, recent visits, analytics, and link access logs now agree on human/bot assignment, including legacy records. Existing storage and analytics contracts remain compatible, with no migration required. Explicit persisted classifications are preserved and User-Agent fallback handles older data.

## 49. Shared Visit Classification Layer for List and Stats Analytics
* **Date:** 2026-09-22
* **Context:** Bot filtering and assignment had to be reusable and consistent across Last 50 Visited URLs, Analytics for All Links, Link Analytics, and Access Log, rather than being duplicated at individual API/UI boundaries.
* **Decision:** Added `app/lib/visit-classification.js` with shared bot patterns, explicit `is_bot`/`isBot` precedence, User-Agent fallback, and normalization. Updated URL storage, APIs, analytics aggregation, and list/stats consumers to use the shared classification while retaining request-time redirect assignment.
* **Consequences:** All four components now agree on visitor type and analytics totals, including legacy records. The implementation remains backward compatible and avoids schema migration, while centralizing future bot-rule changes in one reusable module.


## 50. Standardize List and Stats Page Controls and Headings
* **Date:** 2026-09-22
* **Context:** The protected `/list` and `/stats/[short]` pages used inconsistent heading emphasis, table header treatment, and list form-control styling. The request was to standardize h2/h3 headers plus list buttons, textbox, and select controls.
* **Decision:** Added a scoped visual standardization layer to `app/globals.css`. It aligns list/stats headings with the editorial serif hierarchy, gives list sections a consistent divider, groups list controls in a bordered toolbar, styles textboxes/selects/buttons with shared dimensions, borders, focus, and hover states, and harmonizes list/stats table headers and analytics cards. Responsive stacking was added for narrow screens.
* **Consequences:** The two management surfaces now share a clearer visual system and more predictable controls while preserving all existing behavior, responsive layouts, authentication, analytics, and data flows. The change is CSS-only and introduces no migration or dependency impact.


## 51. Stats QR Generation/Clipboard Actions and Settings Menu Label
* **Date:** 2026-09-22
* **Context:** The `/stats` detail page needed controls to generate/regenerate the QR code for the current shortened URL and copy that QR image to the clipboard. The authenticated header menu also needed `List URLs` renamed to `Settings`.
* **Decision:** Updated `app/stats/[short]/page.js` to add QR generation/regeneration and image clipboard actions using the existing protected stats POST endpoint and Clipboard API. Added loading/status feedback and responsive `.qr-stats-actions` styling in `app/globals.css`. Updated `app/layout.js` to display `Settings` while retaining the existing `/list` destination.
* **Consequences:** Authenticated users can refresh and copy the current URL QR code directly from stats without leaving the page. Clipboard support depends on browser image-clipboard capability and reports a clear error when unavailable. Existing QR persistence, analytics, access logs, routing, and menu destination remain unchanged.


## 52. Group Analytics Bots by Product Name
* **Date:** 2026-10-01
* **Context:** Analytics bot rankings were grouped by complete User-Agent-derived values, causing different versions and transport/library details of the same bot to appear as separate groups. For example, Mastodon User-Agents with different versions must be shown together as `Mastodon` for every selected analytics measure.
* **Decision:** Updated `app/lib/analytics.js` to normalize bot ranking labels by known product tokens, including Mastodon, and to use a product-token fallback for unknown bots. The shared aggregation continues to filter visits by the selected range and exposes the same `bots` response shape, so all dashboards consume the grouping consistently.
* **Consequences:** Versioned User-Agents now aggregate into stable product groups across bot click rankings and related analytics measures. Analytics becomes more readable and comparable, while unknown bot formats remain visible under a sanitized product label or `Unknown bot`. No persistence, API contract, or UI component changes are required.


## 53. Restrict Clicks by Browser to Web Browsers
* **Date:** 2026-10-02
* **Context:** The analytics `Clicks by Browser` ranking could include bot/product labels because bot User-Agents were routed through browser classification. The request was to identify only web browsers for those bars.
* **Decision:** Updated `app/lib/analytics.js` so browser classification remains limited to known browser signatures and browser rankings aggregate human visits only. Bot visits continue to be represented in the dedicated `Total Clicks per Bot` ranking.
* **Consequences:** `Clicks by Browser` now contains only browser categories and no crawler/product names. Bot analytics remain available separately, while all other analytics measures, ranges, and API fields are preserved.


## 54. Social Sharing Actions and Clicks by Social Media
* **Date:** 2026-10-02
* **Context:** The protected URL list needed direct sharing actions for LinkedIn, Mastodon, X, and Notes. Shared links must identify their social source, and analytics must classify clicks by that source while retaining an `unknown` bucket for missing or unsupported values.
* **Decision:** Added four Actions-column buttons in `app/list/page.js` and a shared URL builder that appends the corresponding `source` query parameter. LinkedIn and X use intent URLs; Mastodon and Notes use Web Share when available and clipboard fallback. The redirect handler captures `source`, and both file and Cosmos visit storage persist it. Extended `app/lib/analytics.js` with range-aware social-source aggregation and added a `Clicks by Social Media` ranking card to `AnalyticsDashboard`, including `unknown`.
* **Consequences:** Users can create correctly tagged social shares directly from the list, and both all-link and individual-link dashboards expose social attribution. Existing visits remain backward compatible and are classified as unknown. Share behavior depends on browser popup, Web Share, and clipboard capabilities where applicable.


## 55. Social Action Icons and Substack Attribution
* **Date:** 2026-10-02
* **Context:** The URL list Actions column needed recognizable icons instead of text glyphs for social sharing controls, and users needed a Substack article sharing action. Each shared link must retain source attribution through the shortened URL.
* **Decision:** Updated `app/list/page.js` with inline SVG brand-style icons for LinkedIn, Mastodon, X, Notes, and Substack. The shared URL builder appends the corresponding `source` query parameter, and a Substack action was added using `source=substack`. Extended `app/lib/analytics.js` with an explicit Substack bucket while preserving `unknown` for legacy or unsupported visits. Added shared SVG action styling in `app/globals.css`.
* **Consequences:** Actions are visually recognizable, accessible through labels, and consistently attributed when clicked. Existing redirect logging and file/Cosmos persistence remain compatible because they already store `source`; historical records without attribution remain `unknown`. Inline SVGs avoid a new icon dependency, while Substack share behavior uses a share endpoint where available and browser share/clipboard fallback otherwise.


## 56. Consolidated Social Sharing Popup
* **Date:** 2026-10-02
* **Context:** The URL list Actions column exposed separate social buttons, but sharing needed a single discoverable control and a popup listing LinkedIn, Mastodon, X, Notes, and Substack with their attributed shortened URLs and copy actions.
* **Decision:** Updated `app/list/page.js` to replace the individual social buttons with one share action that opens an accessible modal. The modal generates each network URL with its `source` query parameter, offers network sharing, displays the full tagged URL, and provides clipboard copy feedback. Added responsive modal and row styles to `app/globals.css`.
* **Consequences:** Actions are less crowded while all social networks remain available in one place. Attribution remains compatible with the existing redirect, storage, and analytics pipeline. Copy and Web Share behavior still depends on browser capabilities, with clear fallback/error handling.


## 57. Copy-Only Social Popup and Analytics Range Style Restoration
* **Date:** 2026-10-02
* **Context:** The social popup presented social logos as highlighted buttons and offered a separate network action alongside Copy. Analytics range selectors for 1 week, 1 month, and related periods had lost the stronger application-wide control styling.
* **Decision:** Updated `app/list/page.js` so social logos/network names render as non-interactive labels and each popup row has only one action, the highlighted `Copy` button. Updated `app/globals.css` with consistent flat bordered analytics range controls, clear hover/focus states, dark active selection, and matching primary Copy-button styling.
* **Consequences:** The popup has a clearer single-purpose interaction and avoids falsely implying that logos are buttons. Analytics period selection is easier to scan and visually consistent with the rest of the application. Existing social attribution, sharing fallback logic, clipboard feedback, APIs, and storage remain unchanged.


## 58. Social URLs in Stats Link Details and Twitter Actions Icon
* **Date:** 2026-10-02
* **Context:** The `/stats/[short]` Link Details table needed to expose the tagged social-media URLs used by the sharing workflow. The URL list Actions column also needed a Twitter icon for its social popup control.
* **Decision:** Added LinkedIn, Mastodon, X/Twitter, Notes, and Substack rows to `app/stats/[short]/page.js`, each displaying a `source`-tagged short URL and a copy action. Reused the existing attribution format and added a Twitter bird SVG/mask for the list popup action in `app/globals.css`.
* **Consequences:** Users can inspect and copy every attributed social URL directly from link stats, while the Actions column now has a recognizable Twitter-based sharing affordance. Existing redirect attribution, analytics, storage, and popup behavior remain unchanged.

## 59. Application Style and Design Rules Guide
* **Date:** 2026-10-02
* **Context:** The application has accumulated a mature visual system across the homepage, Standard and Decay Link forms, protected list and stats pages, analytics, QR surfaces, responsive layouts, and editorial header. A single root-level guide was needed to establish consistent rules for current and future features.
* **Decision:** Created `Style_And_Design_Rules.md` in the repository root. The guide consolidates the live styles in `app/globals.css`, layout and component patterns, `ui-rules.md`, prior ADR decisions, accessibility expectations, responsive behavior, semantic content rules, Mermaid diagrams, and a future-feature implementation workflow. Also recorded the documentation analysis in `reasoning.md`.
* **Consequences:** Contributors now have one implementation-oriented reference for headings, paragraphs, links, buttons, forms, tables, figures, QR codes, charts, alerts, spacing, typography, colors, and responsive behavior. The guide improves consistency and clarifies that intentional deviations should be recorded in `ADR.md`; it adds documentation maintenance responsibility but does not change runtime behavior.

## 60. Application Style and Design Rules Alignment
* **Date:** 2026-10-02
* **Context:** The application needed a practical visual review against the active `Style_And_Design_Rules.md` guide. Existing pages already followed the editorial Intranet/Substack direction, but shared focus states, responsive behavior, form hierarchy, semantic sizing, long-content wrapping, and design tokens were inconsistent or implicit.
* **Decision:** Updated `app/globals.css` with additive shared tokens and responsive rules covering typography, controls, focus states, labels, errors, buttons, Standard/Decay forms, results, QR content, tables, analytics sections, footer, social popup, and narrow layouts. No runtime logic, API, authentication, storage, or data behavior was changed. Documented the review in `reasoning.md`.
* **Consequences:** The public, protected, analytics, stats, and sharing surfaces now more consistently follow the design guide across desktop, tablet, and mobile widths. Keyboard focus and long-content handling are clearer, and primary/secondary/danger actions have more predictable hierarchy. Existing CSS remains largely compatible, but future contributors should use the new shared tokens and avoid adding one-off visual values.


## 61. Homepage Option Guidance and Analytics Visualization Fixes
* **Date:** 2026-10-02
* **Context:** Homepage advanced-option controls needed clarifications beneath their controls, inputs needed to use the full available row, and action buttons should size to their content. On `/list`, Clicks per Day axis numbers were visually oversized and the Day and Hour Heatmap had no effective grid/cell presentation.
* **Decision:** Added an additive CSS refinement layer in `app/globals.css`: full-width advanced inputs and responsive expiration fields, helper copy for expiration/privacy, content-sized homepage buttons, smaller chart labels, and explicit heatmap grid/cell styling.
* **Consequences:** Homepage guidance and form proportions are clearer, buttons no longer consume the whole row, analytics labels match the established visual scale, and the heatmap visibly renders all day/hour cells including zero-visit periods. No runtime, API, storage, or analytics aggregation behavior changed.


## 62. Bot and Human Social Click Analytics
* **Date:** 2026-10-04
* **Context:** Analytics needed separate social-media click rankings for bot traffic and human traffic, while the recent visit audit needed to expose each visit's social origin.
* **Decision:** Extended `app/lib/analytics.js` with range-aware `socialBotSources` and `socialHumanSources` aggregations. Updated `app/components/AnalyticsDashboard.js` to rename the social card to `Clicks by Social Media (Bots)` and add `Clicks by Social Media by Human`. Updated `app/components/RecentVisitsPager.js` with a `Social Media Origin` column populated from persisted visit source attribution.
* **Consequences:** Analysts can compare bot and human social traffic without mixing visitor types, and the latest-50 audit provides direct attribution context. Existing source buckets, legacy unknown handling, APIs, storage, pagination, and styling remain compatible.


## 63. Access Log Social Media Origin Column
* **Date:** 2026-10-04
* **Context:** The `/stats/[short]` Access Log needed to expose the social network attribution captured by the existing sharing and redirect pipeline.
* **Decision:** Updated `app/stats/[short]/page.js` to add a sortable `Social Media Origin` column sourced from persisted `source` attribution, with a compatibility fallback and an em dash for missing legacy values.
* **Consequences:** Stats users can identify the social origin of each visit directly in the Access Log. Existing pagination, sorting, visitor classification, analytics, and records without attribution remain compatible.


## 64. Combined Social Analytics and Referer Audit Column
* **Date:** 2026-10-08
* **Context:** Analytics visuals needed explanatory text below each title, the two social-media visitor-type cards needed to become one comparison visual, and the Last 50 Visited URLs audit needed to expose the persisted referer.
* **Decision:** Updated `app/components/AnalyticsDashboard.js` with metadata explanations for every visual, merged social analytics into one network ranking with green human and orange bot bar segments, and retained the existing range/API data fields. Updated `app/components/RecentVisitsPager.js` with a Referer column and legacy-safe fallback. Added focused social-bar styling to `app/globals.css`.
* **Consequences:** Analytics is more understandable and social traffic can be compared in one place without backend changes. Audit users can inspect referring URLs directly. Existing persisted data, API compatibility, pagination, and responsive styling remain intact.


## 65. Separate Human and Bot Social Media Bars
* **Date:** 2026-10-08
* **Context:** The "Clicks by Social Media" visual needed to show both human and bot values as horizontal bars, with two bars vertically associated with each social network rather than overlapping values in one track.
* **Decision:** Updated `app/components/AnalyticsDashboard.js` so each social network renders a labeled Humans bar and a labeled Bots bar, each with its own numeric value and shared per-network scale. Added responsive styles in `app/globals.css` for the two-row bar layout, preserving green human and orange bot semantics and mobile stacking.
* **Consequences:** Human and bot social traffic can be compared directly and values remain readable even when one visitor type is zero. The change is presentation-only: existing analytics aggregation, API fields, range filtering, accessibility labels, and responsive behavior remain intact.
