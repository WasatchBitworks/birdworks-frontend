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
- Fetches from CMS API: /api/birds/wasatch-bitworks/{latest,species,daily}
- Caches with @11ty/eleventy-fetch (1m for latest, 5m for species/daily)
- Returns: {latest, species, daily, generatedAt, apiBase}
```

**Environment variables:**
- `BIRDS_API_BASE` - API base URL (default: https://cms.wasatchbitworks.com/api/birds)

**Available in templates:**
- `{{ birds.latest }}` - Array of recent detections
- `{{ birds.species }}` - Array of species with counts
- `{{ birds.daily }}` - Array of daily aggregations
- `{{ birds.generatedAt }}` - ISO timestamp of when data was fetched
- `{{ site.name }}` - "Wasatch BirdWorks"
- `{{ site.url }}` - "https://wasatchbirdworks.com"

### Build Process

1. Tailwind scans `./src/**/*.{html,njk,md}` for utility classes
2. CSS compiled from `src/styles/tailwind.css` to `src/styles/main.css`
3. Eleventy fetches Birds data from CMS API
4. Eleventy processes Nunjucks templates
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
/ (index.html)         → Homepage with stats, recent detections, BirdNET intro
/live                  → Live feed with all detections, confidence indicators
/species               → Species index grid with detection counts
/about                 → About BirdNET-Pi, how it works, technical details
/404.html              → 404 error page
```

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
- Endpoints:
  - `/wasatch-bitworks/latest?limit=20` - Recent detections
  - `/wasatch-bitworks/species` - Species list with counts
  - `/wasatch-bitworks/daily?days=30` - Daily aggregation

**Response format:**
```json
{
  "detections": [{
    "common_name": "Black-capped Chickadee",
    "scientific_name": "Poecile atricapillus",
    "confidence": 0.8477,
    "detected_at": "2026-01-07T15:31:40Z"
  }],
  "count": 20,
  "generated_at": "2026-01-07T23:47:54Z"
}
```

## Related Services

- **Bitworks CMS:** Backend at `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS`
  - Admin UI: `https://cms.wasatchbitworks.com/admin/birds`
  - Public API: `https://cms.wasatchbitworks.com/api/birds`
- **BirdNET-Pi Device:** Raspberry Pi 5 at `192.168.86.137`
  - Detects birds 24/7 using AI
  - Syncs to CMS every 5 minutes
- **Plausible Analytics:** Self-hosted at `https://analytics.wasatchbitworks.com`

## Code Guidelines

- Follow existing patterns in Birds pages
- Preserve empty state handling
- Use Nunjucks conditionals, not inline ternaries (no `? :` syntax)
- Set variables with `{% set var = value %}` before using in expressions
- Keep nature color palette consistent
- Maintain mobile-first responsive design
- Add comments for complex template logic

## Current Status (January 7, 2026)

**Phase 3 Complete** - Production ready
- ✅ All Glasstone artifacts removed
- ✅ Birds layout and pages implemented
- ✅ API integration working
- ✅ Empty states handled
- ✅ Build optimized (0.60s)
- ⏳ Charts not yet implemented (future)
- ⏳ Photo integration pending (when CMS endpoints ready)
- ⏳ Live refresh widget optional (future enhancement)
