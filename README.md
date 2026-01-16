# Wasatch BirdWorks Frontend

Public Eleventy static site for wasatchbirdworks.com. Displays live bird detections, species data, and bird photography powered by BirdNET-Pi AI and the Bitworks CMS.

**See:** [BIRDWORKS.md](./BIRDWORKS.md) for project guardrails and [FRONTEND.md](./FRONTEND.md) for detailed architecture.

## Tech Stack

- **Generator:** Eleventy v3.1.2 (static site generator)
- **Styling:** Tailwind CSS v3.4.13
- **Hosting:** Netlify
- **Data Source:** Bitworks CMS public API
- **Analytics:** Plausible (self-hosted at analytics.wasatchbitworks.com)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (CSS watch + Eleventy serve)
npm start

# Production build
npm run build
```

## Development Commands

- `npm start` or `npm run dev` - Development server with live reload
- `npm run build` - Production build (CSS + static site)
- `npm run build:css` - Build Tailwind CSS only
- `npm run watch:css` - Watch CSS changes only
- `npm run cache:clear` - Clear Eleventy cache (forces fresh API data on next build)
- `npm run dev:fresh` - Clear cache and start dev server (useful for troubleshooting)

## Site Structure

```
/                  → Homepage (stats, featured photos, trends, recent detections, BirdNET intro)
/live              → Live feed with daily stats, hourly species activity chart, all detections
/photos            → Photo gallery with featured and recent photos
/species           → Species index with detection counts
/species/:species  → Species detail page (photos, detection activity grid, preserved recordings)
/explore           → Advanced data exploration (multi-chart dashboard)
/about             → About BirdNET-Pi and how it works
/404.html          → 404 page
```

## Data Flow

**Build-time:** Eleventy fetches data from CMS API during build
- `src/_data/birds.js` - Fetches latest detections, species list, daily counts
- `src/_data/site.js` - Site metadata

**API Endpoints:**
- `GET /api/birds/wasatch-bitworks/latest` - Recent detections
- `GET /api/birds/wasatch-bitworks/detections/species` - Species list with detection counts
- `GET /api/birds/wasatch-bitworks/daily` - Daily aggregation

**Environment Variables:**
- `BIRDS_API_BASE` - API base URL (default: https://cms.wasatchbitworks.com/api/birds)

## Project Status

**Phase 8 Complete** (January 16, 2026) - Species-Level Activity Charts
- ✅ Birds layout with forest green theme
- ✅ Homepage with stats and recent detections
- ✅ Live detections page with confidence indicators (today's stats only)
- ✅ Pagination (20 detections per page)
- ✅ Audio playback with play/pause controls
- ✅ Species index page with CMS-like detailed cards
- ✅ About page with technical details
- ✅ Empty state handling for zero data
- ✅ All Glasstone artifacts removed
- ✅ Build optimized (~0.60s)
- ✅ Charts (daily detections timeline + top species distribution)
- ✅ Explore page with advanced charts and table fallbacks
  - Daily Hourly Activity Patterns (30-day individual/group average patterns)
  - Removed Typical Hourly Activity chart (simplified page)
- ✅ Photo integration (featured + gallery, non-expiring URLs, thumbnail cropping)
- ✅ Update timestamps on all pages (shows data freshness to users)
- ✅ Hourly scheduled rebuilds via GitHub Actions (6am–10pm MT, 17x/day)
- ✅ Cache management scripts (`npm run cache:clear`, `npm run dev:fresh`)
- ✅ Species cards redesigned (thumbnail + best/avg confidence + last seen date)
- ✅ **Dynamic stats cards on /live** (total detections, species count, high confidence - updates with refresh)
- ✅ **Daily Detections Summary chart on /live** (top 15 species + 24-hour hourly heatmap with live data)
- ✅ **Species detail pages enhanced** (/species/:species_name)
  - Photo gallery with all species photos (no limit)
  - Detection activity grid (GitHub-style) with newest data on left
  - Orange marker for monitoring began date (Dec 23, 2025)
  - **Hourly Activity Patterns chart** (30-day species-specific hourly patterns)
  - Preserved audio recordings list
  - Detection stats (total, best confidence, average confidence, last seen)

## Automated Builds

✅ **ACTIVE** - The site rebuilds **hourly during active hours** (6am–10pm Mountain Time) to keep data fresh:

- **17 builds per day** during daytime hours (no overnight waste)
- **Data freshness:** ≤1 hour old during daytime, snapshot from previous day overnight
- **Workflow:** `.github/workflows/scheduled-build.yml` (GitHub Actions)
- **Build hook:** Configured and running on Netlify
- **Setup:** See [BUILD_HOOK_SETUP.md](./BUILD_HOOK_SETUP.md) for details

**Monitoring:**
- GitHub Actions: https://github.com/username/Birdworks/actions
- Netlify Deploys: Dashboard → Deploys tab
- User-facing: "Data updated: {timestamp}" footer on all pages

## Build Performance

- Build time: ~0.60s
- Data fetch: Birds API only (~530ms)
- Files generated: 7 pages
- No unused data fetching

## What is BirdNET?

BirdNET is an AI-powered bird identification system developed by Cornell Lab of Ornithology. Our BirdNET-Pi installation continuously monitors audio from the Wasatch Front in Utah, identifying birds in real-time and building a database of local bird activity.

## Related Repositories

- **Bitworks CMS (Backend):** `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS`
  - Admin UI: https://cms.wasatchbitworks.com/admin/birds
  - Public API: https://cms.wasatchbitworks.com/api/birds
  - Key docs: `BIRDS.md`, `BIRD_PHOTOS.md`, `BIRDNET_PI.md`, `BIRDNET_COMMANDS.md`
- **BirdNET-Pi Device:** Raspberry Pi 5 at `192.168.86.137`
  - Documentation in CMS repo: `BIRDNET_PI.md`, `BIRDNET_COMMANDS.md`

## Contributing

This is the production Birds frontend. See BIRDWORKS.md for development guardrails.
