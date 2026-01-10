# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the BirdWorks frontend repository.

## Project Overview

**Wasatch BirdWorks** - Public Eleventy static site displaying live bird detections from BirdNET-Pi AI system.

**Critical Documents:**
- **BIRDWORKS.md** - Authoritative guardrails (read this FIRST)
- **FRONTEND.md** - Detailed architecture and API contracts
- **README.md** - Quick reference and project status

## Development Commands

### Running the Site
- `npm start` or `npm run dev` - Development server with CSS watching and live reload
- `npm run build` - Production build (CSS + static site generation)

### Individual Commands
- `npm run build:css` - Build Tailwind CSS only
- `npm run watch:css` - Watch CSS changes only
- `npx @11ty/eleventy --serve` - Eleventy dev server only

## Architecture

### Static Site Structure
- **Generator:** Eleventy v3.1.2 with Nunjucks templating
- **CSS:** Tailwind CSS v3.4.13 with PostCSS
- **Input:** `src/` directory
- **Output:** `_site/` directory (auto-generated, gitignored)

### Key Files
- `.eleventy.js` - Eleventy configuration and image processing shortcodes
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS and autoprefixer setup
- `src/_includes/layout-birds.njk` - Main Birds layout template
- `src/_data/birds.js` - Birds API data fetcher
- `src/_data/site.js` - Site metadata

### Site Content
This is the **Wasatch BirdWorks** public site showcasing:
- Real-time bird detections from BirdNET-Pi AI
- Species index with detection counts
- Live bird activity feed
- Technical information about BirdNET system
- Nature-inspired design (forest green, sky blue, earth tones)

### Data Flow

**Build-time data fetching:**
```javascript
// src/_data/birds.js
- Fetches from CMS API:
  - /api/birds/wasatch-bitworks/latest?date=today (1m cache)
  - /api/birds/wasatch-bitworks/detections/species (5m cache)
  - /api/birds/wasatch-bitworks/daily?days=30 (5m cache)
  - /api/birds/wasatch-bitworks/photos?limit=50 (5m cache) [NEW]
  - /api/birds/wasatch-bitworks/photos/featured (5m cache) [NEW]
- Returns: {today, todayDate, species, daily, photos, featuredPhotos, generatedAt, apiBase}
```

**Environment variables:**
- `BIRDS_API_BASE` - API base URL (default: https://cms.wasatchbitworks.com/api/birds)

**Available in templates (Detections):**
- `{{ birds.today }}` - Array of today's detections (includes id, audio_url, preserved)
- `{{ birds.todayDate }}` - Date string for today in Mountain Time
- `{{ birds.species }}` - Array of species with detection counts
- `{{ birds.daily }}` - Array of daily aggregations
- `{{ birds.generatedAt }}` - ISO timestamp of when data was fetched

**Available in templates (Photos - NEW):**
- `{{ birds.photos }}` - Array of all photos with metadata and redirect URLs
  - Each photo includes: id, species, caption, is_featured, taken_at, uploaded_at, variants (large/medium/thumbnail with .url)
  - Variants include: url (stable redirect URL - never expires!), width, height, format, size_bytes
  - Redirect URLs format: `https://cms.wasatchbitworks.com/api/birds/wasatch-bitworks/photos/{id}/file?variant={variant}`
- `{{ birds.featuredPhotos }}` - Array of featured photos only (subset of photos)
  - Same structure as birds.photos

**Available in templates (Site):**
- `{{ site.name }}` - "Wasatch BirdWorks"
- `{{ site.url }}` - "https://wasatchbirdworks.com"

**Client-side features:**
- Live refresh: Fetches latest detections on demand
- Audio playback: Fetches pre-signed S3 URLs from `/api/birds/:slug/audio/:id`
- Pagination: Client-side (20 detections per page)

### Build Process

1. Tailwind scans `./src/**/*.{html,njk,md,js}` for utility classes (includes JavaScript!)
2. CSS compiled from `src/styles/tailwind.css` to `src/styles/main.css`
3. Eleventy fetches Birds data from CMS API
4. Eleventy processes Nunjucks templates with filters (JSON, Mountain Time)
5. Static files output to `_site/`

### Design System

- **Typography:** Inter font family
- **Colors:** Nature palette
  - Forest green (#2D5016) - Primary, header
  - Leaf green (#4A7C2C) - Accents, buttons
  - Sky blue (#7BB3E8) - Secondary accents
  - Earth brown (#8B6F47) - Tertiary
  - Sun orange (#F4A261) - Live badges
- **Responsive:** Mobile-first Tailwind breakpoints
- **Components:**
  - Stats cards with gradients (green/blue/orange)
  - Detection tables with confidence badges
  - Empty states with helpful messaging

### Page Structure

```
/ (index.html)         → Homepage with stats, featured photos, trends, recent detections, BirdNET intro
/photos                → Photo gallery with featured and recent photos, species counts [NEW]
/live                  → Live feed with all detections, confidence indicators
/species               → Species index grid with detection counts
/explore               → Advanced data exploration with charts and filters
/about                 → About BirdNET-Pi, how it works, technical details
/404.html              → 404 error page
```

**Pages with Photos (NEW - Jan 10, 2026):**
- `index.html` - Featured photos section (up to 6 photos) + 48px thumbnails in Top Species chart
- `photos.html` - Full photo gallery page with featured and recent sections
- `explore.html` - 40px thumbnails in Top Species Activity table (top 15)
- `species.html` - Medium photo headers on all species cards (3-col grid)
- Future: Species detail pages, photo detail pages

## Custom Eleventy Filters

**Photo Matching (NEW - Jan 10, 2026):**
```njk
{% set photo = birds.photos | findPhotoBySpecies(species.common_name) %}
```
- Searches `birds.photos` array for species by name
- Returns **featured photo first** if available
- Falls back to first available photo for that species
- Returns `null` if no photo exists for species
- Used in Top Species chart, Explore table, Species cards

**Built-in Filters:**
- `toMountainTime` - UTC to Mountain Time (full datetime)
- `toMountainTimeShort` - Just time portion
- `toMountainDate` - Just date portion
- `json` - Stringify objects for data attributes
- `slice(start, end)` - Array slicing
- `reverse` - Array reversal

## Development Notes

- Use parallel processing with `npm-run-all` for CSS watching + serving
- Image assets in `src/images/` are passthrough copied
- All HTML files use Nunjucks templating engine (.njk extension)
- SEO meta tags, Open Graph, and Twitter Cards included in layout
- First build fetches data from API (~530ms)
- Subsequent builds use cache for faster rebuilds
- No client-specific branches - this is Birds-only

## Empty State Handling

**Critical:** All pages handle zero data gracefully:
- Show "No detections yet" with system ready messaging
- Display "0" stats instead of errors
- Keep layout structure intact
- Use friendly SVG icons and helpful text

Example:
```njk
{% if birds.latest.length > 0 %}
  <!-- Show data -->
{% else %}
  <!-- Empty state with friendly message -->
{% endif %}
```

## Confidence Level Display

Detection confidence shown with color-coded badges:
- **≥90%:** Green (`bg-green-100 text-green-800`) - High confidence
- **70-89%:** Yellow (`bg-yellow-100 text-yellow-800`) - Medium confidence
- **<70%:** Gray (`bg-gray-100 text-gray-800`) - Lower confidence

## API Integration

**Birds API (Bitworks CMS):**
- Base URL: `https://cms.wasatchbitworks.com/api/birds`
- Slug: `wasatch-bitworks`
- **Detection Endpoints:**
  - `/wasatch-bitworks/latest?date=today` - All detections for today (Mountain Time)
  - `/wasatch-bitworks/latest?limit=20` - Recent detections (limited)
  - `/wasatch-bitworks/detections/species` - Species with detection counts (**use this for detection data**)
  - `/wasatch-bitworks/daily?days=30` - Daily aggregation
  - `/wasatch-bitworks/audio/:id` - Pre-signed S3 URL for audio file (CORS enabled)
- **Photo Endpoints:**
  - `/wasatch-bitworks/photos` - All photos (paginated)
  - `/wasatch-bitworks/photos/featured` - Featured photos only
  - `/wasatch-bitworks/species` - Species with photo counts (for photo galleries, not detections)
  - `/wasatch-bitworks/photos/:id/file?variant=large` - Redirect to fresh S3 URL (NEW - Jan 10, 2026)
    - Returns 302 redirect to pre-signed S3 URL
    - Browser/CDN caches redirect (5 min)
    - **Variants:** `thumbnail`, `medium`, `large`
    - **Why:** Frontend URLs never expire; S3 URLs always fresh
    - **Security:** Sets `Cross-Origin-Resource-Policy: cross-origin` to allow cross-origin loads
    - **Tested:** Works on localhost:8080, wasatchbirdworks.com, Netlify previews

**Detection response format:**
```json
{
  "detections": [{
    "id": 9189,
    "common_name": "Black-capped Chickadee",
    "scientific_name": "Poecile atricapillus",
    "confidence": 0.8477,
    "detected_at": "2026-01-07T15:31:40Z",
    "preserved": true,
    "audio_url": "/api/birds/wasatch-bitworks/audio/9189"
  }],
  "count": 20,
  "date": "2026-01-08",
  "generated_at": "2026-01-07T23:47:54Z"
}
```

**Audio endpoint response:**
```json
{
  "url": "https://s3.amazonaws.com/...(pre-signed URL)",
  "expires_in": 3600,
  "detection_id": 9189,
  "common_name": "Black-capped Chickadee",
  "detected_at": "2026-01-08T16:34:25+00:00"
}
```

## Related Services

- **Bitworks CMS (Backend):** `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS`
  - Admin UI: `https://cms.wasatchbitworks.com/admin/birds`
  - Public API: `https://cms.wasatchbitworks.com/api/birds`
  - Key docs: `BIRDS.md`, `BIRD_PHOTOS.md`, `BIRDNET_PI.md`
- **BirdNET-Pi Device:** Raspberry Pi 5 at `192.168.86.137`
  - Detects birds 24/7 using AI
  - Syncs to CMS every 5 minutes
  - See `BIRDNET_PI.md` and `BIRDNET_COMMANDS.md` in CMS repo
- **Plausible Analytics:** Self-hosted at `https://analytics.wasatchbitworks.com`

## Code Guidelines

- Follow existing patterns in Birds pages
- Preserve empty state handling
- Use Nunjucks conditionals, not inline ternaries (no `? :` syntax)
- Set variables with `{% set var = value %}` before using in expressions
- Keep nature color palette consistent
- Maintain mobile-first responsive design
- Add comments for complex template logic

## Timezone Handling

**See canonical reference:** CMS repo `BIRDS.md` → "Timezone Handling (Canonical Reference)"

### Quick Reference

**API returns UTC, frontend displays Mountain Time:**

```njk
{{ detection.detected_at | toMountainTime }}     → "Jan 7, 2026, 4:34 PM"
{{ detection.detected_at | toMountainTimeShort }} → "4:34 PM"
{{ detection.detected_at | toMountainDate }}      → "Jan 7, 2026"
```

**Client-side JavaScript:**
```javascript
formatMountainTime(detection.detected_at)  // In live-refresh.js
```

**Implementation:**
- **Eleventy filters:** Defined in `.eleventy.js` using `toLocaleString()` with `timeZone: "America/Denver"`
- **Client-side:** Same approach in `src/js/live-refresh.js`
- **Input:** UTC ISO 8601 timestamps from API (e.g., `"2026-01-07T16:34:25+00:00"`)
- **Output:** Mountain Time formatted strings (e.g., `"Jan 7, 2026, 4:34 PM"`)

**Important:** Never manually calculate UTC offsets. Use browser's built-in timezone database via `toLocaleString()` for proper DST handling.

## Current Status (January 10, 2026)

**Phase 5 Complete** - Photo Integration with Non-Expiring URLs & Thumbnail Cropping
- ✅ All Glasstone artifacts removed
- ✅ Birds layout and pages implemented
- ✅ API integration working (detection + audio + photo endpoints)
- ✅ Empty states handled
- ✅ Build optimized
- ✅ Mountain Time display for all timestamps
- ✅ **Pagination (20 detections per page)**
- ✅ **Audio playback with play/pause controls**
- ✅ **Preserved badge for permanent recordings**
- ✅ **Dynamic audio column (shows when audio available)**
- ✅ **One-at-a-time audio playback**
- ✅ **Charts MVP (Daily Detections + Top Species with thumbnails)**
- ✅ **Photo Gallery Integration** (featured + recent sections)
- ✅ **Photo Thumbnails in Charts** (48px/40px bird photos)
- ✅ **Non-Expiring Photo URLs** (redirect endpoint generates fresh S3 URLs)
- ✅ **Thumbnail Cropping** (CMS crops photos to show bird close-ups)

**Jan 10, 2026 Updates:**
- Implemented photo gallery integration with CMS API
- Non-expiring photo URLs (redirect endpoint never expires)
- Fixed CORP header for cross-origin image loads
- Updated CSP to allow S3 connections
- Implemented thumbnail cropping system
  - Default center-square crop on upload
  - CropperJS UI for manual refinement
  - Normalized crop coordinates in meta_json
  - Image proxy endpoint (avoids CORS/SSL issues)
- Bird thumbnails now fill photo areas instead of being tiny
- All photo URLs via redirect endpoints (no direct S3 exposure)
