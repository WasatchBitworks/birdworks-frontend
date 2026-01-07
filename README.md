# Glasstone Homes Website

Glasstone Homes website built with Eleventy and Tailwind CSS. Features home remodeling services with optimized image management via S3.

**Note**: Using Tailwind CSS v3.4.13 (not v4) for better IntelliSense/autocomplete compatibility in VS Code.

## Getting Started

```bash
npm install
npm run dev
```

## Development Commands

- `npm run dev` - Start development server with CSS watching and live reload
- `npm start` - Alias for dev command
- `npm run build` - Production build with image optimization

## Image Management

Images are fetched from S3 at build time and optimized automatically:

```nunjucks
{% beforeAfterImage "https://wasatch-bitworks.s3.us-east-2.amazonaws.com/path/to/image.jpg", "Alt text" %}
```

Benefits:
- WebP conversion for smaller file sizes
- Multiple responsive breakpoints (600px, 1200px)
- Local caching in `.cache/` for faster rebuilds
- Easy updates - just change S3 URL and rebuild

## Branch Workflow

- **main** - Production site (custom home building)
- **version-a** - Client preview (remodeling focus)

Create new feature branches for additional client versions and enable them in Netlify branch deploys settings.