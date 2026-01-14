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
  - Update method: live — manual `Refresh Now` and optional auto-refresh (default 5-minute interval, user-toggle). The live JS replaces table rows and updates pagination and stats.

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
| `/:slug/photos?per_page=100` | `birds.photos` (featured & gallery) | `5m` | Fetches all photos with metadata and variant URLs (API max 100/page). Images served from API/S3 redirect endpoint.
| `/audio/:id` | Audio pre-signed URL (playback) | n/a | Client fetch by `live-refresh.js` returns `{ url: ... }` for media playback; short-lived pre-signed URLs from backend.

Notes:
- Durations above reflect current settings in `src/_data/birds.js`. To change site freshness trade-offs, edit durations there.
- Client-side polling should hit the same public endpoints (respect rate limits). Prefer server-side short-lived tokens or CORS-safe endpoints for media.

## Site Data Strategy (Decision: January 2026)

**DECISION:** Eleventy site is a **public snapshot** of bird data, not a real-time dashboard.

**Goal:** Showcase bird activity with periodic updates, keeping complexity low and performance high.

**Philosophy:** Static-first with scheduled rebuilds. Live monitoring happens in the authenticated backend/CMS.

---

## Per-Page Data Strategy

### Home (`/`) - BUILD-TIME ONLY
**Data source:** Build-time via `src/_data/birds.js`
- Stats cards (total detections, unique species) - snapshot from last build
- "Detections Today" table - snapshot from last build
- Daily Detections chart (14-day timeline) - historical data
- Top Species chart (top 10) - counts from last build
- Featured photos - updated on build

**Update method:**
- Scheduled rebuilds (see "Rebuild Strategy" below)
- Visible "Updated at {timestamp}" indicator

**Why build-time only:**
- Showcase page, not monitoring dashboard
- Historical trends don't need real-time updates
- Keeps frontend simple and performant

---

### Live (`/live`) - ✅ LIVE REFRESH (ALREADY IMPLEMENTED)
**Current implementation:**
- Client-side auto-refresh: **5 minutes** (matches BirdNET-Pi sync frequency)
- Manual "Refresh Now" button
- Updates detection table, stats, pagination
- Fetches from API: `/api/birds/wasatch-bitworks/latest?date=today`

**Status:** Optimized to match backend sync interval

**Note:** This is the **only page** with client-side refresh. All other pages are build-time snapshots.

---

### Explore (`/explore`) - BUILD-TIME ONLY
**Data source:** Build-time via `src/_data/birds.js`
- Daily Summary chart (species ranking + hourly heatmap) - snapshot
- 30-day timeline - historical data
- Hourly activity (today) - snapshot from last build
- Day-of-week averages - historical data
- Top Species Activity table (top 15) - snapshot

**Update method:**
- Scheduled rebuilds
- Visible "Data as of {timestamp}" indicator

**Why build-time only:**
- Analytics page for historical trends
- Chart data doesn't change frequently enough to justify real-time updates
- Simpler architecture

---

### Species (`/species`) - BUILD-TIME ONLY
**Data source:** Build-time via `src/_data/birds.js`
- Species cards with detection counts - snapshot
- Species photos - updated on build
- Scientific names, taxonomy - static

**Update method:**
- Scheduled rebuilds
- Visible "Updated at {timestamp}" indicator

**Why build-time only:**
- Species list changes infrequently
- Detection counts are cumulative (historical)
- No need for real-time updates

---

### Photos (`/photos`) - BUILD-TIME ONLY
**Data source:** Build-time via `src/_data/birds.js`
- Photo gallery - curated content
- Featured photos - updated when flagged in CMS
- Photo metadata - updated on build

**Update method:**
- Scheduled rebuilds (or manual build trigger from CMS)

**Why build-time only:**
- Photos are curated content that changes rarely
- No real-time aspect to photo galleries

---

## Rebuild Strategy (Scheduled Updates)

### Recommended Approach: Netlify Build Hooks

**Setup:**
1. Create build hook in Netlify dashboard
2. Configure external cron service (e.g., cron-job.org, EasyCron, GitHub Actions)
3. Schedule HTTP POST to build hook URL

**Schedule: Hourly Rebuilds (6am–10pm MT)**

**Configuration:**
- Trigger: **Hourly during active hours** (6:00 AM–10:00 PM America/Denver)
- Frequency: **17 builds/day** (no overnight builds)
- Freshness (daytime): Data up to ~1 hour old
- Freshness (overnight): Data may be stale until the 6:00 AM rebuild
- Build minutes/month: ~510 minutes (assuming ~1 min/build)
- Build time: ~1 minute per build (fast Eleventy builds)

**Why hourly:**
- Builds are fast (~1 minute)
- Ample build-minute headroom available
- No cost optimization needed
- Keeps site reasonably fresh (1-hour lag is acceptable)
- Covers the hours people actually care (and avoids overnight churn)

**Alternative schedules NOT recommended:**
- ❌ 4x/day: Data can be 6 hours old (too stale)
- ✅ **Hourly during active hours: Simple, fresh, predictable**

This schedule is intentionally “set-and-forget”: frequent daytime freshness without wasting builds overnight.

---

### Alternative: GitHub Actions (Free)

**Setup:**

> The example below shows a simple hourly trigger. To match the active-hours schedule, adjust the cron expression to run only during 6:00 AM–10:00 PM Mountain Time (America/Denver), converting to UTC as needed.

```yaml
# .github/workflows/scheduled-build.yml
name: Hourly Netlify Build
on:
  schedule:
    # Every hour on the hour (UTC)
    - cron: '0 * * * *'

jobs:
  trigger-build:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Build
        run: |
          curl -X POST -d {} ${{ secrets.NETLIFY_BUILD_HOOK }}
```

**Pros:**
- Free (GitHub Actions)
- Version controlled (config in repo)
- Easy to modify schedule

**Cons:**
- Requires GitHub secrets setup
- Need to maintain workflow file

---

## Implementation Plan (Revised)

### Phase 1: Add "Updated At" Timestamps ✅ PRIORITY
**Goal:** Make data freshness visible to users

**Implementation:**
1. Add `birds.generatedAt` timestamp to all pages
2. Use Mountain Time filter: `{{ birds.generatedAt | toMountainTime }}`
3. Placement: Footer or top of main content area

**Example:**
```njk
<!-- Homepage footer -->
<footer class="text-center py-4 text-sm text-gray-500">
  Data updated: {{ birds.generatedAt | toMountainTime }}
</footer>
```

**Pages to update:**
- `/` (homepage)
- `/explore` (explore page)
- `/species` (species index)
- `/photos` (photo gallery)

**Note:** `/live` already shows real-time data, doesn't need this timestamp.

---

### Phase 2: Setup Hourly Rebuilds
**Goal:** Keep public snapshot fresh with hourly updates

**Tasks:**
1. [ ] Create Netlify build hook in Netlify dashboard
2. [ ] Add `NETLIFY_BUILD_HOOK` secret to GitHub repository
3. [ ] Create `.github/workflows/scheduled-build.yml` (hourly cron)
4. [ ] Test build trigger manually
5. [ ] Verify first automated hourly build

**Timeline:** 1 day (simple setup)

---

### Phase 3: Developer Ergonomics
**Goal:** Improve local development workflow

**Tasks:**
1. [ ] Add `npm run cache:clear` command
2. [ ] Add `npm run dev:fresh` (clears cache + starts dev server)
3. [ ] Document EleventyFetch cache behavior in CLAUDE.md
4. [ ] Add build hook instructions to README

**Timeline:** 1 week

---

## API Load Analysis

**Backend sync frequency:**
- BirdNET-Pi → CMS sync: **Every 5 minutes** (automatic)
- Manual sync: Available in CMS admin (authenticated users only)

**Current API cache headers:**
- `latest?date=today`: 1-minute cache
- `detections/species`: 5-minute cache

**Build-time data fetching:**
- Frequency: Hourly scheduled rebuilds during active hours (17x/day)
- API hits per build: ~4 endpoints (today, species, daily, photos)
- Total API requests: ~68/day (17 builds × ~4 endpoints)

**Live page (client-side):**
- `/live` page: 5-minute auto-refresh (matches Pi sync frequency)
- Endpoints: `latest?date=today` and `detections/species`
- Estimated load: ~576 requests/day per active user on `/live` page (288 × 2 endpoints)
- Expected traffic: Very low (few concurrent users)

**Total estimated API load:**
- Build-time: ~68 requests/day (17 builds × ~4 endpoints)
- Client-side: ~576 requests/day per active `/live` user (5-minute refresh)
- Expected total: <2,000 requests/day (assuming low traffic)

**Why this is acceptable:**
- API responses cached (1-5 min)
- Cloudflare CDN further reduces backend hits
- `/live` is the only page with client-side polling
- Most pages are pure static HTML (zero API requests after build)

Note: Hourly rebuild cadence dominates data freshness; EleventyFetch cache durations mainly protect local development and prevent redundant API calls during repeated builds.

---

## Static Site Philosophy

**All pages work without JavaScript:**
- ✅ Build-time data provides complete content
- ✅ Static HTML tables and charts (progressively enhanced with SVG)
- ✅ No JavaScript-only content (everything server-rendered)
- ✅ Graceful degradation (site fully functional with JS disabled)

**JavaScript enhancement (limited to `/live` page only):**
- ✅ Auto-refresh with user toggle (disable option)
- ✅ Manual "Refresh Now" button
- ✅ Loading states and error handling
- ✅ Pagination updates

**Other pages (/, /explore, /species, /photos):**
- ❌ No client-side refresh logic
- ✅ Pure static HTML with progressive SVG chart rendering
- ✅ Minimal JavaScript (charts.js only for visualization)

---

## User Experience: Timestamp Visibility

**"Updated at" indicator (all build-time pages):**
```html
<!-- Footer or top of content area -->
<div class="text-center py-4 text-sm text-gray-500">
  Data updated: {{ birds.generatedAt | toMountainTime }}
</div>
```

**Example outputs:**
- "Data updated: Jan 12, 2026, 9:15 AM"
- "Data updated: Jan 12, 2026, 12:00 PM"

**Placement options:**
1. **Homepage:** Footer (bottom of page)
2. **Explore:** Top of page ("Snapshot as of {timestamp}")
3. **Species:** Footer or header
4. **Photos:** Footer

**Design:**
- Subtle gray text (not prominent)
- Sets user expectation: "This is a snapshot"
- Links understanding: "Content is current as of last build"

---

## Developer Ergonomics

**Clear local cache:**
```bash
# Add to package.json
"scripts": {
  "cache:clear": "rm -rf .cache",
  "dev:fresh": "npm run cache:clear && npm run dev"
}
```

**Test refresh logic locally:**
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch API responses
curl -i http://localhost:8080/api/birds/wasatch-bitworks/latest?date=today

# Test cases:
# - API returns new data
# - API returns 500 error
# - API returns empty array
# - API is slow (>5 seconds)
# - Network is offline
```

---

## Monitoring & Observability

**Client-side metrics to track:**
- Refresh success rate (%)
- Average refresh duration (ms)
- API error rate (%)
- Auto-refresh toggle state (on/off %)
- User-initiated refresh count

**Plausible custom events:**
```javascript
// Track refresh interactions
plausible('Data Refresh', { props: {
  type: 'auto',  // or 'manual'
  page: 'home',
  success: true
}});
```

---

## Summary

**Architectural Decision:** Eleventy site is a **public snapshot**, not a real-time dashboard.

**Site Purpose:**
- Showcase bird detection data with historical context
- Provide educational content about BirdNET and local bird activity
- Offer a "recent activity" view via `/live` page (already implemented)
- Minimize frontend complexity and maintenance

**Data Freshness Strategy:**
- **Most pages:** Build-time data with **hourly rebuilds during active hours** (daytime data up to ~1 hour old)
- **`/live` page only:** Client-side refresh (5-min interval, matches Pi sync)
- **Visible timestamps:** "Data updated: {timestamp}" on all snapshot pages
- **Live monitoring:** Happens in authenticated CMS backend (not public site)

**Key Benefits:**
- ✅ **Simple architecture** → Minimal JavaScript, easier maintenance
- ✅ **High performance** → Pure static HTML, CDN-friendly
- ✅ **Low API load** → Hourly rebuilds during active hours (17x/day) + minimal live traffic
- ✅ **Clear separation** → Public showcase vs. admin monitoring
- ✅ **User expectations** → Timestamps make snapshot nature clear
- ✅ **Scheduled updates** → Fresh data via hourly rebuilds (≤1 hour old)

**Trade-offs (acceptable):**
- Daytime data can be up to ~1 hour old between rebuilds
- Overnight data may be stale until the next 6:00 AM rebuild
- No "instant" updates on homepage/explore/species pages
- Users wanting live monitoring should use CMS backend
- Uses ~510 build minutes/month (acceptable with ample headroom)

**What Makes This Work:**
- **Low expected traffic** → Public site is primarily showcase/educational
- **Backend/CMS for monitoring** → Authenticated users have real-time access
- **`/live` page provides preview** → Public can see recent activity with 5-minute refresh
- **Scheduled rebuilds** → Keeps snapshot reasonably current without complexity

**Implementation Complete (Jan 12, 2026):**
1. ✅ Strategy approved - Hourly rebuilds with snapshot approach
2. ✅ Phase 1: Add visible "Updated at" timestamps to all pages
   - Homepage: "Data updated: {timestamp}"
   - Explore: "Data snapshot as of: {timestamp}"
   - Species: "Data updated: {timestamp}"
   - Photos: "Gallery updated: {timestamp}"
3. ✅ Phase 2: Setup hourly Netlify rebuilds via GitHub Actions
   - Workflow: `.github/workflows/scheduled-build.yml`
   - Schedule: 17 builds/day (6am–10pm MT)
   - Setup guide: `BUILD_HOOK_SETUP.md`
4. ✅ Phase 3: Add developer ergonomics
   - `npm run cache:clear` - Clear EleventyFetch cache
   - `npm run dev:fresh` - Clear cache + start dev server
   - Documented in CLAUDE.md
5. ✅ Documentation: Updated CLAUDE.md, README.md, and this file

**Scope Guardrails:**
- ❌ Do NOT add new client-side polling (except `/live` which exists)
- ❌ Do NOT refactor data-fetch architecture
- ❌ Do NOT add CDN or ISR complexity
- ✅ Keep it simple: hourly builds + timestamps

---

**Decision Date:** January 12, 2026
**Status:** ✅ COMPLETE - Snapshot-first approach with scheduled rebuilds fully implemented
**All Phases:** ✅ Complete and deployed
