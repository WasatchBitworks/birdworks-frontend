# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Site
- `npm run dev` - Start development server with CSS watching and live reload
- `npm start` - Alias for dev command
- `npm run build` - Production build (CSS optimization + static site generation)

### Individual Commands
- `npx tailwindcss -i src/styles/tailwind.css -o src/styles/main.css --watch` - CSS watching only
- `npx @11ty/eleventy --serve` - Eleventy development server only

## Architecture Overview

### Static Site Structure
- **Generator**: Eleventy v3.1.2 with Nunjucks templating
- **CSS**: Tailwind CSS v3.4.13 with PostCSS processing  
- **Input**: `src/` directory
- **Output**: `_site/` directory (auto-generated)

### Key Files
- `.eleventy.js` - Eleventy configuration and passthrough copies
- `tailwind.config.js` - Tailwind configuration with content scanning
- `postcss.config.js` - PostCSS and autoprefixer setup
- `src/_includes/layout.njk` - Main layout template

### Content Strategy
This is the Glasstone Homes website showcasing:
- Home remodeling and renovation services
- Before/after project comparisons
- Company information emphasizing personalized service
- Professional design system with modern color palette (slate/orange)

### Image Management
- **Remote Image Optimization**: Images hosted on S3 bucket are fetched and optimized at build time
- **Shortcodes Available**:
  - `{% beforeAfterImage "S3_URL", "Alt text" %}` - Optimized before/after images
  - `{% responsiveImage "path", "Alt text" %}` - General responsive images
  - `{% heroImage "path", "Alt text" %}` - Hero banner images
  - `{% galleryThumb "path", "Alt text" %}` - Gallery thumbnails
- **Optimization**: Images are automatically converted to WebP, resized to multiple breakpoints, and cached locally
- **Cache**: Remote images cached in `.cache/` directory for faster rebuilds

### Build Process
1. Tailwind scans `./src/**/*.{html,njk,md}` for utility classes
2. CSS compiled from `src/styles/tailwind.css` to `src/styles/main.css`
3. Eleventy fetches remote images from S3, optimizes, and caches them
4. Eleventy processes Nunjucks templates and copies assets
5. Static files output to `_site/` directory

### Design System
- **Typography**: Inter font family
- **Colors**: Professional color palette suitable for home building industry
- **Responsive**: Mobile-first Tailwind breakpoints
- **Interactions**: Hover effects on gallery images and project cards

### Development Notes
- Use parallel processing with `npm-run-all` for CSS watching + serving
- Image assets in `src/images/` are passthrough copied
- All HTML files use Nunjucks templating engine
- SEO meta tags, Open Graph, and Twitter Cards included in layout
- First build with new remote images takes longer (30s-1min per image) due to fetching and optimization
- Subsequent builds are fast due to local caching

## Branch Workflow
- **main**: Production branch (custom home building focus)
- **version-a**: Client preview branch (remodeling focus)
- Netlify automatically deploys both branches:
  - Production: `aquamarine-florentine-89933c.netlify.app`
  - version-a preview: `version-a--aquamarine-florentine-89933c.netlify.app`
- To create new client versions, create feature branches and enable them in Netlify branch deploys

## CMS Integration
- **Bitworks CMS**: `/Users/zachkane/Wasatch_Bitworks/Bitworks_CMS` - Multi-tenant Sinatra CMS for content management
- **S3 Asset Management**: Images stored in `wasatch-bitworks.s3.us-east-2.amazonaws.com/assets/2/`
- **API Integration**: Site can fetch dynamic content from CMS via API endpoints
- **Content Types**: Projects, gallery images, company information, and team details
- **Data Structure**: Portfolio data structure preserved for CMS integration