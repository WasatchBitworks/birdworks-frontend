# Wasatch BirdWorks Frontend Plan (Eleventy)

## Goal
Build a public, read-only Eleventy site for wasatchbirdworks.com that presents BirdNET detections, species information, and bird photos using the existing CMS public APIs and the proven Bitworks CMS → Netlify workflow.

## Template Reference (Locked)
Baseline template: `/Users/zachkane/eleventy/glasstone`

Key structure from the template:
- `src/_data/` for CMS fetchers (currently `portfolio.js`, `assets.js`, `site.js`)
- `src/_includes/layout.njk` for global layout, SEO, and scripts
- `netlify.toml` for build settings
- `tailwind.config.js` + `postcss.config.js` for styling pipeline

## Inputs (CMS APIs)
Frontend consumes **public, cached** CMS endpoints. Treat the CMS as the source of truth.

### Detections
- `GET /api/birds/:slug/latest` — recent detections (for homepage + optional live widget)
- `GET /api/birds/:slug/daily` — daily counts/time-series
- `GET /api/birds/:slug/detections/species` — species index derived from detections (includes counts)

### Photos / Library
- `GET /api/birds/:slug/photos` — paginated photos metadata
- `GET /api/birds/:slug/photos/featured` — featured photos metadata
- `GET /api/birds/:slug/photos/:id` — single photo metadata
- `GET /api/birds/:slug/photos/species/:species_slug` — photos for a given species
- `GET /api/birds/:slug/species` — canonical species list (and photo counts, if provided)

### Photo File Delivery (Redirect Endpoints)
**Critical for v1:** Use these stable URLs in frontend HTML (not direct S3 URLs):
- `GET /api/birds/:slug/photos/:photo_id/file?variant=large` → 302 redirect to S3
- `GET /api/birds/:slug/photos/:photo_id/file?variant=medium` → 302 redirect to S3
- `GET /api/birds/:slug/photos/:photo_id/file?variant=thumbnail` → 302 redirect to S3
- `GET /api/birds/:slug/photos/:photo_id/file?variant=original` → 302 redirect to S3

**Why redirect endpoints:**
- Stable URLs in HTML (never expire)
- CMS generates fresh pre-signed S3 URL on each request
- Browser/CDN can cache redirect for ~5 min (respects cache headers)
- Avoids 403 errors for users who idle on the site

**Usage in frontend:**
```html
<!-- ✅ Good: stable URL -->
<img src="/api/birds/wasatch-bitworks/photos/123/file?variant=large" alt="Bird photo">

<!-- ❌ Bad: expires after 1 hour -->
<img src="https://s3.amazonaws.com/...?X-Amz-Expires=3600..." alt="Bird photo">
```

## Information Architecture (Initial)
**Primary pages**
- Home: overview + latest detections widget + featured photos
- Species index: searchable/sortable list with detection counts (and optional photo counts)
- Species detail: detection stats + charts + photo strip (audio optional)
- Photos: gallery with filters (species, featured)
- Photo detail: image, metadata, species link
- Explore: advanced data exploration with multi-chart dashboard
- About/How it works: project + pipeline summary

**Optional pages**
- Daily/seasonal charts
- Sites/locations (if needed later)

## Data Strategy (Aligned with Glasstone)
**Recommended approach: hybrid**
- Build-time data for all primary pages (static + fast)
- Client-side fetch only for a small “Latest detections” widget

**Eleventy data files (match Glasstone pattern)**
- `src/_data/birds_latest.js` (build-time latest, used for homepage initial render)
- `src/_data/birds_daily.js`
- `src/_data/birds_detections_species.js` (species index derived from detections + counts)
- `src/_data/birds_species.js` (canonical species list; used for joins/labels)
- `src/_data/birds_photos.js`
- `src/_data/birds_photos_featured.js`
- `src/_data/site.js` (site metadata for wasatchbirdworks.com)

**Caching**
- Local dev: `@11ty/eleventy-fetch` with a long cache (e.g., 1h) to keep rebuilds fast.
- Netlify builds: fetch fresh by default (no long-lived cache). Respect upstream TTL.
- Client-side widget: keep requests minimal (page-load only, or optional 30–60s poll if needed later).

**Environment variables (Glasstone style)**
- `CMS_BASE_URL` (default to `https://cms.wasatchbitworks.com`)
- `BIRDS_SLUG` (e.g. `wasatch-bitworks`)

## Visual/UX Direction
- Data-driven presentation with a strong focus on charts and graphs
- Photos integrated alongside data (species pages, detections highlights, chart annotations)
- Separate "Detections" vs "Photos" in nav to mirror the CMS split (detections vs library)
- Mobile-first layout; simple filters; lightweight audio playback controls

**Photo Display Patterns:**
- **Grid layouts:** Use `aspect-square` containers with `object-fit: cover` for thumbnails (400px variants)
  - Uniform grid appearance, center-cropped
  - May cut off edges of non-square photos
- **Lightbox/modal viewer:** Recommended for full-size photo viewing
  - Show large variant (2000px) in lightbox
  - Include image counter (e.g., "2 of 4")
  - Keyboard navigation (arrow keys, ESC to close)
  - Responsive scaling for mobile
  - CMS lightbox reference: `/admin/birds/library/photos/:id` (for inspiration)
- **Detail pages:** Use medium variant (1200px) for primary display
- **Hero/featured:** Use large variant (2000px) with responsive sizing
- **EXIF display:** Camera, lens, ISO, aperture, shutter speed available in metadata

## Charting & Visualization Plan
**Primary chart types**
- Daily detections timeline (line/area)
- Species distribution (bar chart, top N with “view all”)
- Hourly activity heatmap (24-hour grid)
- Day-of-week averages (weekday bars)
- Seasonal trends (monthly aggregation)
- Photo coverage by species (bar or stacked bar: photos vs detections)

**Where charts live**
- Home: 1–2 hero charts + “latest detections” widget
- Species index: sortable table + sparkline per species
- Species detail: timeline + hourly activity + photos gallery
- Explore: daily summary + extended timeline + hourly + weekday + top species
- Photos: filterable gallery with species-level counts

**Data + photos**
- Use `photos/featured` for homepage or top species cards
- On species detail, show recent photos next to detection stats

**Implementation notes**
- Prefer build-time rendering for charts (SVG from pre-aggregated data → static + fast).
- If interactive tooltips/filters are needed, add minimal client-side JS on top of static SVG.
- Explore page charts can be client-rendered as long as table fallbacks remain intact.
- Day-of-week chart reads daily data from a `data-daily` attribute (avoid scraping a table that may be replaced by SVG).

## Build & Deploy (Glasstone workflow)
- Use Netlify build hooks configured in CMS (`/admin/portfolio` flow already supports this)
- Build cadence: scheduled builds every 30–60 min + manual build hook for “sync now” moments
- Eleventy env config:
  - `ELEVENTY_ENV=production`
  - `CMS_BASE_URL=https://cms.wasatchbitworks.com`
  - `BIRDS_SLUG=wasatch-bitworks` (or target client slug)

Reference: `ELEVENTY_NETLIFY_INTEGRATION.md` for standard build hook setup.

## Integrations (Carry Over Everything for Now)
- Plausible Analytics (from Glasstone)
- Cloudflare Turnstile (from Glasstone)
- Netlify Forms (from Glasstone)
- Netlify build hooks + CMS trigger workflow

## Implementation Phases
**Phase 0: Template alignment**
- Copy Glasstone structure and strip client-specific content
- Update `src/_data/site.js`, `package.json`, `README.md`
- Keep Glasstone integrations enabled initially (can be removed later)

**Phase 1: Core skeleton**
- Set up repo structure, base layout, nav, and global styles
- Implement data fetching in `_data/`
- Build static pages for home, species, photos

**Phase 2: Detail pages**
- Species detail pages (detections + charts)
- Photo detail pages (single photo + metadata)

**Phase 3: Live widget**
- Add small client-side fetch for latest detections
- Ensure rate limits and cache headers are respected

**Phase 4: QA + deployment**
- Hook up Netlify build
- Validate on staging
- Add analytics + SEO metadata


## Decisions (Locked for v1)
- Eleventy + Netlify using the Glasstone template structure.
- Hybrid data approach: build-time for most pages + a small optional live "Latest detections" widget.
- No rebuild per detection; rely on scheduled builds + manual build hooks.
- **Signed URL Strategy:** Public site serves photos/audio via stable CMS URLs that redirect to fresh signed S3 URLs (no signed URLs stored in Eleventy output).
  - Frontend requests: `/api/birds/:slug/photos/:photo_id/file?variant=large`
  - CMS responds: `302 Redirect` to fresh pre-signed S3 URL (generated on-demand)
  - Result: URLs in HTML never expire, UX stays solid, static site stays static
  - CDN can cache redirects for ~5 min (respects cache headers)

## Open Questions
- Brand/style direction for wasatchbirdworks.com (reuse Bitworks aesthetic vs new look)?
- Audio on public pages: show clips publicly, or keep audio playback/admin-only?
- Rebuild cadence: 30 min vs 60 min (cost vs freshness tradeoff).
- **Thumbnail cropping strategy:**
  - Current: CSS center-crop (may cut off bird heads/important parts)
  - Option 1: Keep as-is (simplest)
  - Option 2: Add smart-crop at CMS level (ImageMagick attention-based)
  - Option 3: Manual crop interface in CMS (gives control but adds complexity)
  - Decision needed before photo-heavy pages go live

## Photo API Contract (Frontend Requirements)

### Photo Metadata Response Format
Photo metadata endpoints (`/api/birds/:slug/photos`, `/api/birds/:slug/photos/:id`, etc.) return:

```json
{
  "id": 123,
  "species_id": 45,
  "common_name": "Black-capped Chickadee",
  "scientific_name": "Poecile atricapillus",
  "species_slug": "black-capped-chickadee",
  "caption": "Feeding at sunflower seeds",
  "is_featured": true,
  "privacy_level": "public",
  "taken_at": "2026-01-05T14:30:00Z",
  "created_at": "2026-01-05T15:00:00Z",
  "width": 4000,
  "height": 3000,
  "orientation": 1,
  "public_latitude": 40.56,
  "public_longitude": -111.85,
  "exif": {
    "camera": {"make": "Canon", "model": "EOS R5", "lens": "RF100-500mm"},
    "settings": {"iso": 1600, "aperture": "f/5.6", "shutter_speed": "1/2000"}
  }
}
```

**Note:** Metadata responses do NOT include direct S3 URLs. Use file delivery endpoints for images.

### File Delivery (Images/Audio)
**Use stable redirect URLs in HTML:**
```
/api/birds/:slug/photos/:photo_id/file?variant=large
```

This endpoint:
1. Validates photo exists and is public
2. Generates fresh pre-signed S3 URL (1 hour expiry)
3. Returns `302 Redirect` to S3
4. Sets `Cache-Control: public, max-age=300` (5 min)

**Frontend implementation:**
```html
<img src="/api/birds/wasatch-bitworks/photos/123/file?variant=large"
     alt="Black-capped Chickadee"
     loading="lazy">
```

**Available variants:**
- `thumbnail` - 400px max-width JPG
- `medium` - 1200px max-width JPG
- `large` - 2000px max-width JPG
- `original` - Full resolution (not recommended for public display)

### Photo Variants Usage Guide
| Context | Recommended Variant | URL Example |
|---------|-------------------|-------------|
| Grid thumbnails | `thumbnail` | `/photos/123/file?variant=thumbnail` |
| Species cards | `thumbnail` or `medium` | `/photos/123/file?variant=medium` |
| Photo detail (primary) | `medium` or `large` | `/photos/123/file?variant=large` |
| Lightbox/fullscreen | `large` | `/photos/123/file?variant=large` |
| Hero sections | `large` | `/photos/123/file?variant=large` |
| Mobile optimization | `thumbnail` or `medium` | `/photos/123/file?variant=thumbnail` |

### Important API Behaviors
- **Deleted photos excluded:** Soft-deleted photos never appear in metadata endpoints
- **Privacy filtering:** Only `public` and `approximate` privacy levels exposed; `private` photos excluded
- **Geoprivacy:** Coordinates rounded to 2 decimals (~1.1km grid) to protect sensitive locations
- **No image processing needed:** All derivatives pre-generated by CMS
- **Thumbnails NOT square-cropped:** 400px variants preserve aspect ratio
  - Use CSS `object-fit: cover` on square containers for uniform grid display
- **Species normalization:** Photos linked to `birds_species` table (same as detections)
- **Metadata caching:** Photo metadata APIs cached 1–5 min
- **File delivery caching:** Redirect endpoints cached ~5 min, underlying S3 URLs cached by CDN

## Next actions

### Backend (CMS) - Required for v1
1) **Add photo/audio file delivery redirect endpoints:**
   - `GET /api/birds/:slug/photos/:photo_id/file?variant={variant}`
   - Returns `302 Redirect` to fresh pre-signed S3 URL
   - Sets `Cache-Control: public, max-age=300`
   - **Blocks frontend work** - must be done first

### Frontend (Eleventy) - After CMS endpoints ready
1) Clone/copy the Glasstone Eleventy template into the Birds frontend repo.
2) Implement `_data/` fetchers (latest, daily, detections-species, species, photos, featured).
   - Fetch **metadata only** (no direct S3 URLs)
   - Use stable redirect URLs in templates
3) Build three pages end-to-end: Home, Species index, Photos gallery.
   - Use redirect URLs: `/api/birds/:slug/photos/:id/file?variant=large`
   - Implement responsive image display with proper variant selection
   - Add lightbox for photo viewing (reference CMS implementation at `/admin/birds/library/photos/:id`)
4) Add basic SEO + Plausible + nav polish.
5) Add the live "Latest detections" widget last.

## Photo System Status (January 5, 2026)
✅ **CMS photo management complete:**
- Photo upload with EXIF extraction
- Multi-size derivatives (2000/1200/400px)
- Lightbox viewer in CMS admin
- Soft delete + hard delete (superadmin)
- Featured photo flagging
- Privacy levels (public/approximate/private)
- Geoprivacy (coordinates fuzzed to ~1.1km)
- Species normalization (linked to `birds_species` table)
- Public JSON metadata API

🔄 **CMS file delivery endpoints (blocks frontend v1):**
- Photo redirect endpoints (`/photos/:id/file?variant=...`) - **TODO**
- Audio redirect endpoints (if needed) - **TODO**
- Cache-Control headers implementation - **TODO**

🔄 **Frontend integration (after CMS endpoints):**
- Eleventy data fetchers (metadata only)
- Photo gallery pages with stable URLs
- Lightbox implementation
- Responsive image display

---

## Related Documentation

**This Repository (Frontend):**
- **[CLAUDE.md](CLAUDE.md)** - Development commands and quick reference
- **[BIRDWORKS.md](BIRDWORKS.md)** - Project guardrails and constraints
- **[README.md](README.md)** - Project overview and setup

**CMS Repository (Backend):** `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS`
- **BIRDS.md** - Backend architecture, API contracts, sync strategy
- **BIRD_PHOTOS.md** - Photo system architecture and implementation
- **BIRDNET_PI.md** - Device documentation (services, config, queries)
- **BIRDNET_COMMANDS.md** - Quick reference for Pi commands

**Live URLs:**
- Frontend: https://wasatchbirdworks.com
- Admin UI: https://cms.wasatchbitworks.com/admin/birds
- Public API: https://cms.wasatchbitworks.com/api/birds

---

*Last Updated: January 7, 2026*
