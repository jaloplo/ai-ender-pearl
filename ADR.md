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
