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

## Site Structure

```
/                  → Homepage (stats, recent detections, BirdNET intro)
/live              → Live detections feed
/species           → Species index with detection counts
/about             → About BirdNET-Pi and how it works
/404.html          → 404 page
```

## Data Flow

**Build-time:** Eleventy fetches data from CMS API during build
- `src/_data/birds.js` - Fetches latest detections, species list, daily counts
- `src/_data/site.js` - Site metadata

**API Endpoints:**
- `GET /api/birds/wasatch-bitworks/latest` - Recent detections
- `GET /api/birds/wasatch-bitworks/species` - Species list with counts
- `GET /api/birds/wasatch-bitworks/daily` - Daily aggregation

**Environment Variables:**
- `BIRDS_API_BASE` - API base URL (default: https://cms.wasatchbitworks.com/api/birds)

## Project Status

**Phase 3 Complete** (January 7, 2026)
- ✅ Birds layout with forest green theme
- ✅ Homepage with stats and recent detections
- ✅ Live detections page with confidence indicators
- ✅ Species index page
- ✅ About page with technical details
- ✅ Empty state handling for zero data
- ✅ All Glasstone artifacts removed
- ✅ Build optimized (~0.60s, down from 1.10s)

## Build Performance

- Build time: ~0.60s
- Data fetch: Birds API only (~530ms)
- Files generated: 6 pages
- No unused data fetching

## What is BirdNET?

BirdNET is an AI-powered bird identification system developed by Cornell Lab of Ornithology. Our BirdNET-Pi installation continuously monitors audio from the Wasatch Front in Utah, identifying birds in real-time and building a database of local bird activity.

## Related Repositories

- **Bitworks CMS:** `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS` - Backend API and admin interface
- **BirdNET-Pi Device:** Raspberry Pi 5 at 192.168.86.137 (see BIRDNET_PI.md in CMS repo)

## Contributing

This is the production Birds frontend. See BIRDWORKS.md for development guardrails.
