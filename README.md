# 🐦 Wasatch BirdWorks

**Real-time bird detection from the Wasatch Front in Utah**

A public web application displaying live bird detections, species activity, and wildlife photography powered by AI-driven acoustic monitoring and professional photography.

**Live Site:** [wasatchbirdworks.com](https://wasatchbirdworks.com)

---

## What is Wasatch BirdWorks?

Wasatch BirdWorks uses [BirdNET](https://birdnet.cornell.edu/), an AI system developed by Cornell Lab of Ornithology, to continuously monitor bird activity in the Wasatch Front region of Utah. Our Raspberry Pi 5 captures 24/7 audio and identifies thousands of birds weekly across 30+ local species.

The site displays real-time detections, species trends, and curated bird photography—giving visitors insight into the rich avian community of our region.

---

## ✨ Features

### For Visitors
- **📊 Live Stats Dashboard** - Total detections, unique species, hourly activity patterns
- **🔊 Audio Playback** - Listen to actual bird calls with confidence indicators
- **🐦 Species Index** - Browse all detected species with photos and detection history
- **📸 Photo Gallery** - Curated bird photography with metadata
- **📈 Activity Charts** - Visualize daily trends and hourly patterns
- **🗺️ Data Freshness** - Built hourly (6am–10pm MT) to keep information current
- **♿ Accessible Design** - Professional, responsive interface optimized for all devices

### For Developers
- **⚡ Fast Builds** - Optimized static site generation (~0.60s)
- **🔄 Automated Deploys** - GitHub Actions triggers hourly Netlify rebuilds
- **📡 API-Driven** - Data from Bitworks CMS public API (100% client-side rendering)
- **🎨 Modern Stack** - Eleventy + Tailwind CSS + vanilla JavaScript
- **🧪 Empty State Handling** - Graceful fallbacks when data unavailable

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Static Generator** | Eleventy v3.1.2 |
| **Styling** | Tailwind CSS v3.4.13 |
| **Hosting** | Netlify (CDN + automatic deploys) |
| **Backend API** | Bitworks CMS (public endpoints) |
| **Analytics** | Plausible (self-hosted) |
| **Automation** | GitHub Actions (scheduled builds) |

## Getting Started

### For Visitors
Simply visit [wasatchbirdworks.com](https://wasatchbirdworks.com) to explore live bird detections, species data, and photos!

### For Developers

#### Prerequisites
- Node.js 18+
- npm 9+

#### Setup
```bash
# Clone the repository
git clone https://github.com/zachkane/Birdworks.git
cd Birdworks

# Install dependencies
npm install

# Start development server
npm start
```

The site will open at `http://localhost:8080` with live reload enabled.

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Development server with CSS watch + live reload |
| `npm run dev` | Alias for `npm start` |
| `npm run build` | Production build (CSS + static site generation) |
| `npm run build:css` | Rebuild Tailwind CSS only |
| `npm run watch:css` | Watch and rebuild CSS on file changes |
| `npm run cache:clear` | Clear Eleventy cache (forces fresh API data) |
| `npm run dev:fresh` | Clear cache and start dev server (for troubleshooting) |

## Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| **Home** | `/` | Overview with real-time stats, featured photos, activity trends, and introduction to BirdNET |
| **Live Feed** | `/live` | Today's detections with hourly activity chart, species breakdown, and all recordings with audio |
| **Photo Gallery** | `/photos` | Curated bird photography with featured and recent sections |
| **Species Index** | `/species` | Browse all detected species with detection counts and habitat photos |
| **Species Detail** | `/species/:name` | Individual species page with photos, 1-year activity calendar, hourly patterns, and recordings |
| **Explore** | `/explore` | Advanced data visualization: hourly activity patterns, daily trends, detection statistics |
| **About** | `/about` | Information about BirdNET-Pi technology and how acoustic monitoring works |

## Architecture & Data Flow

### How It Works
1. **BirdNET-Pi Device** (Raspberry Pi 5) continuously analyzes audio
2. **Detections synced** to Bitworks CMS every 5 minutes
3. **Netlify rebuild** triggered hourly to fetch fresh data
4. **Static pages** generated with live detection data
5. **CDN delivery** provides fast page loads worldwide

### Data Updates
- **Daytime (6am–10pm MT):** Site rebuilds **hourly** with fresh data (max 1 hour old)
- **Overnight:** Last build from 10pm is served until 6am
- **Manual refresh:** Visitors can refresh `/live` page for latest 200 detections via client-side API call

### API Integration
The site fetches data from public Bitworks CMS endpoints during build:

```
GET /api/birds/wasatch-bitworks/latest
GET /api/birds/wasatch-bitworks/detections/species
GET /api/birds/wasatch-bitworks/daily
GET /api/birds/wasatch-bitworks/hourly
GET /api/birds/wasatch-bitworks/photos
GET /api/birds/wasatch-bitworks/species/:slug/presence
```

Base URL: `https://cms.wasatchbitworks.com/api/birds` (configurable via `BIRDS_API_BASE` env var)

## ✅ What's Implemented

### Core Features
- ✅ Real-time bird detection display (updates hourly)
- ✅ Audio playback for all recordings with confidence indicators
- ✅ Species index with photos, detection counts, and CMS integration
- ✅ Multi-page visualization dashboard with 7+ chart types
- ✅ Pagination (20 detections per page, searchable)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Professional nature-inspired color scheme (forest green, sky blue)
- ✅ Empty state handling (graceful fallbacks)

### Advanced Features
- ✅ **GitHub-style Activity Calendar** - 1-year detection presence grid per species
- ✅ **Hourly Activity Patterns** - Individual + group average detection trends
- ✅ **Daily Detections Summary** - Top 15 species with heatmap visualization
- ✅ **Species Detail Pages** - Photos, audio, activity history, detection stats
- ✅ **Photo Gallery** - Curated bird photography with metadata and filtering
- ✅ **Interactive Charts** - Daily trends, hourly distributions, confidence analysis

### Infrastructure & Performance
- ✅ **Automated Hourly Builds** - GitHub Actions + Netlify (6am–10pm MT, 17x/day)
- ✅ **Fast Static Site** - ~0.60s build time, CDN-delivered
- ✅ **Live Data Refresh** - Manual client-side API refresh on `/live` page
- ✅ **Data Freshness Labels** - "Updated at {timestamp}" on all pages
- ✅ **Cache Management** - Scripts for clearing cache when needed
- ✅ **API-Driven** - 100% of content from public Bitworks CMS endpoints

### Production Status
- ✅ **Live:** https://wasatchbirdworks.com
- ✅ **SEO Optimized:** Meta tags, Open Graph, structured data
- ✅ **Analytics:** Plausible tracking integrated
- ✅ **Accessible:** Semantic HTML, ARIA labels, keyboard navigation

## Automated Rebuilds

The site rebuilds automatically on a schedule to keep data fresh:

| Schedule | Behavior |
|----------|----------|
| **6am–10pm MT** | Builds every hour (17 builds/day) — data max 1 hour old |
| **10pm–6am MT** | No builds — using previous day's snapshot |

**Current Status:** ✅ **ACTIVE** (Configured January 12, 2026)

### How It Works

1. **GitHub Actions** - Triggered on hourly schedule (6am–10pm MT)
2. **Posts to Netlify** - Sends webhook to Netlify build hook
3. **Eleventy rebuilds** - Fetches fresh data from CMS API
4. **CDN deploys** - Updated site served globally

### Setup (If Reconfiguring)

**Step 1: Create Netlify Build Hook**
1. Netlify Dashboard → Your site → Site settings
2. Go to **Build & deploy** → **Build hooks**
3. Click **Add build hook**
4. Name: `Scheduled Hourly Build` | Branch: `main`
5. Copy the webhook URL

**Step 2: Add GitHub Secret**
1. GitHub repo → Settings → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `NETLIFY_BUILD_HOOK`
4. Value: Paste the webhook URL from Step 1

**Step 3: Verify**
- GitHub Actions should show workflow runs: https://github.com/zachkane/Birdworks/actions
- Netlify should show new deployments: https://app.netlify.com/sites/wasatch-birdworks

### Monitoring

- **GitHub Actions:** `.github/workflows/scheduled-build.yml` runs automatically
- **Netlify Deploys:** Check dashboard for deployment logs
- **User-visible:** "Data updated at {timestamp}" shown on every page

## Performance

| Metric | Value |
|--------|-------|
| Build time | ~0.60 seconds |
| Pages generated | 7 core pages + species detail pages |
| API calls | 6 endpoints to Bitworks CMS |
| Static file size | ~2.5 MB |
| Page load time | <200ms (CDN delivered) |

---

## About BirdNET

[BirdNET](https://birdnet.cornell.edu/) is an AI-powered bird sound recognition system developed by [Cornell Lab of Ornithology](https://www.birds.cornell.edu/). It uses machine learning to identify bird species from audio recordings with high accuracy.

Our Wasatch BirdWorks installation runs continuously on a Raspberry Pi 5, analyzing 24/7 audio from the Wasatch Front region. The system has detected 30+ species since December 2025, building a real-time dataset of local bird activity patterns.

---

## Documentation

### For Developers
- **[FRONTEND.md](./FRONTEND.md)** - Architecture, API contracts, data strategy, and development guidelines
- **[INTEGRATIONS.md](./INTEGRATIONS.md)** - Third-party service setup (Plausible, Turnstile, Netlify)

### Backend Services
- **[Bitworks CMS API](https://cms.wasatchbitworks.com/api/birds)** - Public API endpoints for bird data
- **[CMS Documentation](https://github.com/zachkane/Bitworks_CMS)** - Full backend implementation
- **[BIRDS.md](https://github.com/zachkane/Bitworks_CMS/blob/main/BIRDS.md)** - Bird detection system architecture
- **[BIRDNET_PI.md](https://github.com/zachkane/Bitworks_CMS/blob/main/BIRDNET_PI.md)** - Device setup and configuration

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│    BirdNET-Pi Device (Raspberry Pi 5)   │
│     Monitors audio, identifies birds    │
└──────────────┬──────────────────────────┘
               │ Syncs every 5 minutes
               ▼
┌─────────────────────────────────────────┐
│    Bitworks CMS (Heroku)                │
│    Stores detections, manages photos    │
│    Public API: cms.wasatchbitworks.com  │
└──────────────┬──────────────────────────┘
               │ Hourly data fetch
               ▼
┌─────────────────────────────────────────┐
│    Wasatch BirdWorks (This Repo)        │
│    Static site with charts & details    │
│    Deployed to Netlify CDN              │
└──────────────┬──────────────────────────┘
               │ Served globally
               ▼
┌─────────────────────────────────────────┐
│    wasatchbirdworks.com                 │
│    Public website for bird enthusiasts  │
└─────────────────────────────────────────┘
```

---

## Contributing

This is the production Wasatch BirdWorks frontend.

For development guidelines and architectural decisions, see [FRONTEND.md](./FRONTEND.md).

### Local Development
1. See "[Getting Started](#getting-started)" above
2. Follow patterns in existing pages
3. Run `npm run build` before committing
4. Test on multiple devices (mobile, tablet, desktop)

### Reporting Issues
Found a bug or have a feature request? Please open an issue on GitHub with:
- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Browser/device information

---

## License & Attribution

Wasatch BirdWorks is built with:
- [BirdNET](https://birdnet.cornell.edu/) - Acoustic bird monitoring (Cornell Lab of Ornithology)
- [Eleventy](https://www.11ty.dev/) - Static site generator
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Plausible Analytics](https://plausible.io/) - Privacy-first analytics

**Created by:** Zach Kane
**Updated:** January 2026
**Status:** Production ✅
