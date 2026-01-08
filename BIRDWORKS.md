# BirdWorks Frontend Specification (AUTHORITATIVE)

Status: Phase 4 in progress (Jan 8, 2026). Pagination and audio complete.

This document defines the goals, constraints, and guardrails for converting
the duplicated Glasstone Eleventy project into the BirdWorks public frontend.


## Current State

- Project has been fully rebranded from the duplicated Glasstone template.
- Core pages implemented: Home, Live, Species, About, and 404.
- Build-time data fetching is implemented via src/_data/birds.js against the CMS public API.
- Empty-state handling is implemented for zero/partial data.

## Phase 4 Priorities

1) ✅ **Pagination and Audio (Complete - Jan 8, 2026)**
   - Client-side pagination (20 detections per page)
   - Audio playback with play/pause controls
   - On-demand fetching of pre-signed S3 URLs
   - One-at-a-time audio playback
   - Dynamic audio column (shows when audio available)
   - Preserved badge for permanent recordings
   - CORS enabled on audio API endpoint

2) Charts MVP (homepage Trends section) - **NEXT PRIORITY**
   - Daily detections timeline (last 14 days)
   - Top species distribution (top 10)
   - Prefer progressive enhancement: server-rendered fallback lists + client-side SVG charts (no heavy deps).

3) Photo integration + lightbox (blocked on CMS redirect endpoints)
   - Waiting on CMS photo file delivery endpoints

**See also:** [FRONTEND.md](./FRONTEND.md) for detailed architecture, API contracts, and implementation phases.

Claude MUST:
- Treat this document as the primary source of truth
- Preserve existing Eleventy, Tailwind, PostCSS, and Netlify infrastructure
- Avoid deleting files unless explicitly marked as client-specific
- Prefer incremental, reversible changes

If there is uncertainty, keep the file and mark it with a TODO.

You are working in an Eleventy (11ty) + Tailwind project that was duplicated from a client site ("Glasstone"). 
Goal: convert it into the public Birds frontend (wasatchbirdworks.com) while preserving all core infrastructure.

IMPORTANT: Do NOT delete working infrastructure unless you verify it is unused.
Keep the build pipeline, Eleventy config, Tailwind config, postcss pipeline, image pipeline, Netlify config, redirects, linting, and any shared utilities that are generic.

Work plan (Phase 4+):
1) Preserve infrastructure
   - Keep Eleventy/Tailwind/PostCSS/Netlify pipeline intact.
   - Avoid deleting files unless clearly client-specific and verified unused.

2) Charts MVP (primary)
   - Add a "Trends" section to the homepage with two cards:
     - Detections (14 days)
     - Top Species (top 10)
   - Render server-side fallback lists/tables at build time.
   - Enhance client-side with lightweight inline SVG charts (preferred).
   - Keep JS modular (e.g., assets/js/charts.js).

3) Live refresh widget (optional)
   - On /live, add a progressive enhancement widget that refetches /latest.
   - Be polite with polling (30–60s) and handle CORS/cache behavior.

4) Photo integration (later)
   - Integrate photos once CMS redirect endpoints are available.
   - Add a simple lightbox for viewing.

5) Deliverables
   - Short "changes made" report
   - List of deleted/renamed files
   - TODOs clearly marked

Charts
- Prefer inline SVG charts for minimal dependencies and fast builds.
- If a chart library is introduced, justify why SVG is insufficient and keep the dependency lightweight.
- Tailwind styles the container/cards; chart rendering should be modular (e.g., assets/js/charts.js).

Constraints:
- Don't introduce a heavy framework (no React, no Next).
- Avoid breaking Netlify deploy.
- Prefer minimal diffs and incremental steps.
- If you're unsure whether a file is infrastructure or client-specific, keep it and mark it for review.
- Progressive enhancement required: pages must remain useful with JS disabled.

## Related Documentation

- **[FRONTEND.md](./FRONTEND.md)** - Detailed architecture and API contracts
- **[CLAUDE.md](./CLAUDE.md)** - Development commands and quick reference
- **CMS Backend:** `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS` (see `BIRDS.md`)