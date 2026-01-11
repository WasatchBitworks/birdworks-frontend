# DATA_UPDATE

This document maps each page's charts/graphs to their data sources and explains how the data is fetched/updated.

Key implementation files:
- `src/_data/birds.js` — fetches site data from the backend API using `@11ty/eleventy-fetch`.
- `src/js/charts.js` — client-side progressive enhancement that reads build-time data (DOM / data-* attributes) and renders SVG charts.
- `src/js/live-refresh.js` — client-side live refresh for `/live` (manual and auto-refresh).
- `src/_includes/layout-birds.njk` — includes the JS files conditionally and exposes `data-api-base`.

Backend API (used by `birds.js`):
- Base: `https://cms.wasatchbitworks.com/api/birds` (overridable via `BIRDS_API_BASE`).
- Endpoints used:
  - `/:slug/latest?date=today` — today's detections (used for live feed / recent detections)
  - `/:slug/latest?limit=20` — recent detections (used by client pagination)
  - `/:slug/detections/species` — species with detection counts (top species)
  - `/:slug/daily?days=30` — daily aggregation for trends
  - `/:slug/photos` and `/photos?limit=50` — photos used on homepage/photos pages
  - `/audio/:id` — returns pre-signed S3 URL JSON for audio playback

How `src/_data/birds.js` fetches data
- Uses `EleventyFetch(url, { duration, type: 'json', fetchOptions })`.
- Current cache durations in `birds.js`: `today` => `1m`; `species` => `5m`; `daily` => `5m`.
- Result exported to templates as `birds` object with fields: `today`, `todayDate`, `species`, `daily`, `photos`, `featuredPhotos`, `generatedAt`, `apiBase`.

Per-page mapping

- Home (`/`, file: `src/index.html`)
  - Charts/visuals:
    - Daily Detections (small bar chart)
    - Top Species (top-10 list with thumbnails)
    - Detections Today (table of recent detections)
    - Featured photos
  - Data source: server-injected `birds` object (from `src/_data/birds.js`): `birds.daily`, `birds.species`, `birds.today`, `birds.photos`.
  - Update method: build-time via Eleventy. Charts are progressively enhanced client-side by `src/js/charts.js` which reads the server-rendered DOM (or `data-*` JSON when present) and renders SVG charts. The underlying data is from the last build (subject to `EleventyFetch` cache durations).

- Explore (`/explore`, file: `src/explore.html`)
  - Charts/visuals:
    - Daily Summary (species ranking + hourly heatmap)
    - Timeline extended (30 days)
    - Hourly activity (today)
    - Day-of-week averages
    - Species comparison (top 15)
  - Data source: server-injected `birds` data. Some containers include JSON attributes (e.g. `data-detections`, `data-daily`, `data-updated`) so `charts.js` can parse them directly.
  - Update method: data is fetched at build-time (EleventyFetch); `charts.js` renders charts client-side from the embedded JSON/DOM. Not live — to see new data you must rebuild (or reduce cache durations / add client fetch logic).

- Live (`/live`, file: `src/live.html`)
  - Visuals:
    - Live detections table (paginated)
    - Stats cards (unique species, counts)
  - Data source:
    - Initial table rows are rendered from `birds.today` at build time.
    - `src/js/live-refresh.js` fetches the live API endpoint `${apiBase}/wasatch-bitworks/latest?date=today` to get the up-to-date list of detections.
    - Audio playback requests pre-signed URLs by fetching the audio endpoint (server returns `{ url: ... }`).
  - Update method: live — manual `Refresh Now` and optional auto-refresh (default 60s interval, user-toggle). The live JS replaces table rows and updates pagination and stats.

- Species (`/species`, file: `src/species.html`)
  - Visuals: species index grid with detection counts and photos.
  - Data source: `birds.species`, `birds.photos` provided at build time.
  - Update method: build-time only (progressive enhancement not required).

- Photos (`/photos`, file: `src/photos.html`)
  - Visuals: photo gallery, featured photos.
  - Data source: `birds.photos` from `birds.js`.
  - Update method: build-time.

Notes and developer tips
- Build-time vs live:
  - The canonical data fetch happens in `src/_data/birds.js` during Eleventy build; that provides site-wide `birds` data used in templates.
  - `charts.js` enhances the UI by rendering SVG charts in the browser using the build-time data embedded into the HTML (or `data-*` JSON). These charts do not auto-refresh unless you add client-side fetches.
  - The `/live` page is the only page with built-in client-side live updates via `src/js/live-refresh.js` which calls the public API and replaces the table.

- To make charts live (option): either
  1. Add client-side fetches in `charts.js` to re-query the API and re-render (respect rate limits), or
  2. Lower `EleventyFetch` durations in `src/_data/birds.js` and run a scheduled rebuild (CI) so the static site updates more frequently.

- Caching: `EleventyFetch` stores responses in `.cache/` and respects `duration` strings. Local dev (`eleventy --serve`) will still use the cache unless explicitly cleared.

- Sensitive data: secrets (like `TURNSTILE_SECRET_KEY`) should be provided as environment variables (e.g., Netlify UI) and never committed. `netlify/functions/verify-turnstile.js` reads `process.env.TURNSTILE_SECRET_KEY` server-side.

If you want, I can:
- Add a short diagram or table showing exact files → endpoints → durations.
- Add client-side polling to one chart as an example.

---
Generated: January 10, 2026

Endpoint reference (exact paths and cache durations)

| Endpoint (relative) | Used by / purpose | EleventyFetch duration | Notes |
|---|---:|---:|---|
| `/:slug/latest?date=today` | `src/_data/birds.js` -> `birds.today` (live feed, detections today) | `1m` | Primary source for `/live` and recent detections; client `live-refresh.js` fetches same endpoint for live updates.
| `/:slug/latest?limit=20` | Client pagination / recent items | n/a (client fetch) | Client-side only; returns limited recent detections.
| `/:slug/detections/species` | `birds.species` (top species counts) | `5m` | Used for Top Species charts and species lists.
| `/:slug/daily?days=30` | `birds.daily` (daily aggregation for trends) | `5m` | Used for timeline and day-of-week charts.
| `/:slug/photos` and `/:slug/photos?limit=50` | `birds.photos` (featured & gallery) | `5m` | Photo metadata and variant URLs; images themselves served from API/S3.
| `/audio/:id` | Audio pre-signed URL (playback) | n/a | Client fetch by `live-refresh.js` returns `{ url: ... }` for media playback; short-lived pre-signed URLs from backend.

Notes:
- Durations above reflect current settings in `src/_data/birds.js`. To change site freshness trade-offs, edit durations there.
- Client-side polling should hit the same public endpoints (respect rate limits). Prefer server-side short-lived tokens or CORS-safe endpoints for media.

## Review & Recommended Improvements (2026)

This section captures follow-up observations and recommended refinements to the current data update strategy. The existing architecture is sound; these notes are intended to clarify expectations, reduce confusion, and provide low-effort improvements with high impact.

### 1. Make data freshness explicit in the UI
Most pages (`/`, `/explore`, `/species`, `/photos`) rely on build-time data. This is intentional and appropriate for Eleventy, but users may implicitly assume analytics-style pages are “live.”

Recommendation:
- Surface `birds.generatedAt` visibly in the UI (e.g., “Updated: Jan 10, 2026 11:42 AM”) on pages that present charts or summaries.
- This sets correct expectations without adding client-side complexity.

### 2. Clarify freshness expectations for `/explore`
The Explore page feels analytical and exploratory, which can imply real-time or near-real-time data.

Options:
- Keep `/explore` fully build-time and clearly label it as a snapshot (“Data as of last build”).
- OR selectively refresh a single dataset client-side (e.g., today’s detections or last 24h) while keeping historical aggregates static.

Either approach is valid; the key is consistency and clarity.

### 3. Add a scheduled rebuild cadence
To make the site feel “alive” without converting to a full client-rendered app:

Recommendation:
- Add a scheduled rebuild (Netlify or CI) every 5–15 minutes during active hours, or hourly for a lower-cost option.
- This upgrades the entire site to “near-live” with minimal architectural changes.

### 4. Keep media URLs out of Eleventy build artifacts
The project correctly avoids embedding presigned audio URLs in Eleventy output by fetching them client-side.

Extend this rule to images:
- Eleventy should only embed stable CMS URLs for images.
- CMS redirect endpoints generate short-lived presigned S3 URLs on demand.
- Never persist presigned URLs in Eleventy data files, HTML, or the database.

This prevents expiration bugs and simplifies long-term maintenance.

### 5. Think in cache layers, not single caches
The system benefits from layered caching:

- Build-time cache: `@11ty/eleventy-fetch` durations in `birds.js`
- Redirect cache: short-lived caching (e.g., 5 minutes) on CMS redirect responses
- Object cache: long-lived caching on S3 objects when keys are versioned or content-addressed

This layered approach balances freshness, performance, and cost.

### 6. Developer ergonomics: manage EleventyFetch cache explicitly
Eleventy’s local dev server will reuse cached API responses unless `.cache/` is cleared.

Recommendation:
- Add a helper command (e.g., `npm run cache:clear`) to remove `.cache/` during development.
- This reduces confusion when testing API or CMS changes locally.

---

Summary:
The current data update strategy is well-aligned with Eleventy’s strengths: build-time data, progressive enhancement, and narrowly scoped live features. These recommendations focus on expectation-setting, cache hygiene, and small operational improvements rather than architectural rewrites.
