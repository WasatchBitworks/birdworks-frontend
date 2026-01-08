# BirdWorks Frontend Specification (AUTHORITATIVE)

This document defines the goals, constraints, and guardrails for converting
the duplicated Glasstone Eleventy project into the BirdWorks public frontend.

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

Task plan:
1) Inventory & classify
   - List the key infrastructure files (11ty config, Tailwind/postcss config, package scripts, Netlify config).
   - Identify what is “client-specific content/branding” vs “generic infrastructure”.

2) Rename/rebrand safely
   - Replace site name/metadata from Glasstone → Wasatch BirdWorks / Birds.
   - Update any site-wide nav/footer, logo usage, colors only if they’re truly branding.
   - Keep the overall layout components unless they are tightly coupled to Glasstone content.

3) Prune client-specific content without breaking builds
   - Remove Glasstone-specific pages, collections, and data files.
   - Replace with placeholder Birds pages (Home, Live, Species, About).
   - Any removed pages should be replaced by minimal equivalents so routes don’t 404 during development.

4) Wire in the Birds API (read-only)
   - Data source is the CMS public API:
     - GET /api/birds/:slug/latest (60s cache)
     - GET /api/birds/:slug/species (5m cache)
     - GET /api/birds/:slug/daily (5m cache)
   - Implement a small data layer (e.g., src/_data/birds.js) that fetches build-time data for:
     - latest detections
     - daily counts
     - species counts
   - Include “generated_at” in templates and show “Last updated …”.

5) Live-updating widget (optional but preferred)
   - Keep site mostly static, but add one client-side widget on the Live page that refetches /latest after page load.
   - Use progressive enhancement: page should still render with build-time data if JS fails.

6) Charts
   - Add a simple chart for daily detections (line chart) using a lightweight library (Chart.js or ECharts).
   - Tailwind should style the container/cards; chart library renders the chart.
   - Keep JS modular: assets/js/charts.js.

7) Deliverables
   - A short “changes made” report
   - A list of deleted/renamed files
   - Any TODOs clearly marked

Constraints:
- Don’t introduce a heavy framework (no React, no Next).
- Avoid breaking Netlify deploy.
- Prefer minimal diffs and incremental steps.
- If you’re unsure whether a file is infrastructure or client-specific, keep it and mark it for review.
Proceed now.