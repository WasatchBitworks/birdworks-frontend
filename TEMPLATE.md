# Using This Project as a Template

This Eleventy + Tailwind CSS project is designed to be easily adapted for new websites. It includes optional integrations for analytics and security that can be enabled per deployment.

## Template Philosophy

**This project (Glasstone) serves as a living reference implementation.**

Rather than maintaining a separate "template repo" that becomes outdated, this approach uses the most recent, feature-complete project as the starting point for new sites. As you add features to new client projects, you can optionally backport them here to keep this reference implementation current.

**Why this approach:**
- ✅ Always has the latest features and improvements
- ✅ No template maintenance burden
- ✅ Real-world tested code (not theoretical)
- ✅ Complete working examples of all integrations
- ✅ You naturally keep it updated as you work

## Quick Start

### Method 1: Clone and Clean (Recommended)

```bash
# Clone this repository
git clone <glasstone-repo-url> new-client-project
cd new-client-project

# Remove git history and start fresh
rm -rf .git
git init
git add .
git commit -m "Initial commit from Glasstone template"

# Add your new remote
git remote add origin <new-repo-url>
git push -u origin main
```

### Method 2: Fork on GitHub

1. **Fork** this repository on GitHub
2. **Rename** the fork to your new project name
3. **Clone** your fork locally
4. Follow the customization checklist below

---

## Customization Checklist

Use this checklist when starting a new project from Glasstone:

### 🔧 Core Configuration

- [ ] **Update `src/_data/site.js`:**
  - [ ] `name`: "Glasstone Homes" → "Client Business Name"
  - [ ] `url`: "https://www.glasstonehomes.com" → "https://clientdomain.com"
  - [ ] `description`: Update for client's business
  - [ ] Remove/update optional integration configs (Plausible, Turnstile)

- [ ] **Update `package.json`:**
  - [ ] `name`: "glasstone" → "client-name"
  - [ ] `description`: Update project description
  - [ ] Remove unused dependencies (if any)

- [ ] **Update `README.md`:**
  - [ ] Replace with client project information
  - [ ] Keep setup instructions relevant to this stack

### 🎨 Branding & Design

- [ ] **Replace logo:**
  - [ ] `src/images/glasstone_logo.png` → Client logo
  - [ ] Update logo in `src/_includes/layout.njk` (line 168)
  - [ ] Update favicon: `src/favicon.ico`

- [ ] **Update color scheme** in `src/_includes/layout.njk` (lines 36-45):
  - [ ] Primary colors (teal → client brand colors)
  - [ ] Accent colors
  - [ ] Test contrast ratios for accessibility

- [ ] **Update fonts** (if needed):
  - [ ] Google Fonts link in `layout.njk` (line 34)
  - [ ] Font family references in CSS

### 📝 Content Replacement

- [ ] **Find/Replace throughout project:**
  - [ ] "Glasstone Homes" → "Client Name"
  - [ ] "Salt Lake City" → "Client Location"
  - [ ] "Greater Salt Lake Area" → "Client Service Area"
  - [ ] "(801) 979-1004" → Client phone number
  - [ ] "glasstonehomes.com" → "clientdomain.com"

- [ ] **Update schema.org data** in `layout.njk` (lines 92-131):
  - [ ] Business name
  - [ ] Business type (HomeAndConstructionBusiness → appropriate type)
  - [ ] Phone number (line 98)
  - [ ] Address/location (lines 99-104)
  - [ ] Coordinates (lines 105-109)
  - [ ] Service area radius (lines 112-120)
  - [ ] Opening hours (line 121)
  - [ ] License/credentials (lines 123-131) - update or remove

- [ ] **Homepage content** (`src/index.html`):
  - [ ] Hero section (lines 7-27): title, CTA buttons
  - [ ] Services section (lines 44-86): customize services offered
  - [ ] About section (lines 88-136): company bio, credentials
  - [ ] Before/after images (lines 138-178): replace S3 URLs with client images
  - [ ] Gallery images (lines 180-259): add client project photos
  - [ ] Reviews (lines 261-515): add client testimonials or remove
  - [ ] Contact form (lines 517-576): verify fields match client needs

- [ ] **Footer** in `layout.njk` (lines 215-220):
  - [ ] Copyright year and company name
  - [ ] Tagline/description

### 🔗 SEO & Metadata

- [ ] **Update `src/sitemap.njk`:**
  - [ ] Verify all pages are included
  - [ ] Update priority values if needed

- [ ] **Update `src/robots.txt`:**
  - [ ] Update sitemap URL (line 3)

- [ ] **Meta descriptions:**
  - [ ] Homepage frontmatter (lines 2-4)
  - [ ] Any additional pages

- [ ] **Open Graph images:**
  - [ ] Create client-specific OG image
  - [ ] Place in `src/images/og/home.png`

### 🔌 Optional Integrations

- [ ] **Plausible Analytics** (if using):
  - [ ] Set `PLAUSIBLE_DOMAIN` environment variable
  - [ ] Set `PLAUSIBLE_URL` (if self-hosted)
  - [ ] See INTEGRATIONS.md for details

- [ ] **Cloudflare Turnstile** (if using):
  - [ ] Create new Turnstile site in Cloudflare dashboard
  - [ ] Set `TURNSTILE_SITE_KEY` environment variable
  - [ ] Set `TURNSTILE_SECRET_KEY` environment variable
  - [ ] Test form submission
  - [ ] See INTEGRATIONS.md for details

- [ ] **Netlify Forms:**
  - [ ] Configure email notifications in Netlify dashboard
  - [ ] Test form submission
  - [ ] Set up spam filtering

### 🚀 Deployment

- [ ] **Netlify setup:**
  - [ ] Connect GitHub repository
  - [ ] Set build command: `npm run build`
  - [ ] Set publish directory: `_site`
  - [ ] Add environment variables (Plausible, Turnstile)
  - [ ] Configure custom domain
  - [ ] Enable HTTPS

- [ ] **DNS Configuration:**
  - [ ] Point domain to Netlify
  - [ ] Wait for SSL certificate

- [ ] **Post-deployment checks:**
  - [ ] Test all pages load correctly
  - [ ] Test contact form submission
  - [ ] Verify analytics tracking
  - [ ] Check mobile responsiveness
  - [ ] Run Lighthouse audit
  - [ ] Verify sitemap.xml is accessible
  - [ ] Submit sitemap to Google Search Console

### 🧹 Cleanup

- [ ] **Remove Glasstone-specific files:**
  - [ ] Update/remove `SEO.md` (has Glasstone-specific info)
  - [ ] Keep `TEMPLATE.md` for future reference
  - [ ] Keep `INTEGRATIONS.md` for integration docs
  - [ ] Keep `CLAUDE.md` for development guidance

- [ ] **Clean up unused images:**
  - [ ] Remove Glasstone logo
  - [ ] Remove sample/placeholder images you won't use
  - [ ] Clear `.cache/` directory before first build

---

## Core Configuration

### Site Settings (`src/_data/site.js`)

Update these values for your new project:

```js
module.exports = {
  name: "Your Business Name",
  url: "https://yourdomain.com",
  description: "Your site description for SEO",
  defaultOgImage: "/images/og/home.png",

  // Optional integrations (configure below)
  plausibleDomain: process.env.PLAUSIBLE_DOMAIN || null,
  plausibleUrl: process.env.PLAUSIBLE_URL || null,
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null,
};
```

### Design System (`src/_includes/layout.njk`)

Update CSS custom properties (lines 36-45) to match your brand:

```css
:root {
  --color-teal: #58A6A8;         /* Primary color */
  --color-deep-teal: #3B7B7D;    /* Darker shade */
  --color-bright-teal: #4FC3C6;  /* Accent color */
  --color-ocean: #2C8A8D;        /* Contrast color */
  --color-aqua: #7BCFD1;         /* Light highlight */
  --color-charcoal: #1E293B;     /* Text color */
  --color-gray-light: #F8FAFB;   /* Background */
  --color-offwhite: #FFFFFF;     /* Pure white */
}
```

---

## Optional Integrations

### 🔍 Plausible Analytics (Self-Hosted or Cloud)

**What it does:** Privacy-friendly website analytics

**How to enable:**

1. **Set environment variables** in your hosting provider:
   ```bash
   PLAUSIBLE_DOMAIN=yourdomain.com
   PLAUSIBLE_URL=https://analytics.wasatchbitworks.com/js/script.js
   ```

2. **For Plausible Cloud** (plausible.io):
   ```bash
   PLAUSIBLE_DOMAIN=yourdomain.com
   # Leave PLAUSIBLE_URL empty to use default cloud script
   ```

3. **For Self-Hosted Plausible:**
   - See `/Users/zachkane/plausible/README.md` for setup instructions
   - Point `PLAUSIBLE_URL` to your instance

**Script location:** `src/_includes/layout.njk` line 161-163

**Cost:**
- Self-hosted: Free (requires VPS)
- Cloud: $9/month for 10k pageviews

**To disable:** Don't set the environment variables (script won't load)

---

### 🛡️ Cloudflare Turnstile (Bot Protection)

**What it does:** CAPTCHA alternative to prevent spam on contact forms

**How to enable:**

1. **Get Turnstile keys:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Turnstile
   - Create a new site/widget
   - Copy your **Site Key** (public) and **Secret Key** (private)

2. **Set environment variables:**
   ```bash
   TURNSTILE_SITE_KEY=0x4AAAA...  # Public key
   TURNSTILE_SECRET_KEY=0x4AAAA... # Private key (server-side only)
   ```

3. **Deploy** - Turnstile will automatically appear on the contact form

**Files involved:**
- Widget: `src/index.html` line 555-556
- Script: `src/_includes/layout.njk` line 165
- Verification: `netlify/functions/verify-turnstile.js`
- Form handler: `src/index.html` lines 569-638

**Cost:** Free (up to 1M requests/month)

**To disable:** Don't set environment variables (form works without it, using honeypot only)

---

## Content Customization

### Homepage (`src/index.html`)

1. **Hero Section** (lines 7-27)
   - Update H1 title and location
   - Change call-to-action buttons

2. **Services Section** (lines 44-86)
   - Customize service offerings
   - Update icons and descriptions

3. **About Section** (lines 88-136)
   - Replace company bio
   - Update credentials/badges

4. **Projects/Gallery** (lines 138-259)
   - Add your before/after images
   - Update project descriptions

5. **Reviews Section** (lines 261-515)
   - Add client testimonials
   - Can integrate with CMS (see below)

6. **Contact Form** (lines 517-576)
   - Update phone number
   - Customize form fields

### Images

**Replace these assets:**
- `/src/images/glasstone_logo.png` - Your logo
- Before/after images (S3 URLs or local paths)
- Gallery images

**Image optimization is automatic** via Eleventy Image plugin:
- WebP conversion
- Responsive breakpoints
- Lazy loading

---

## CMS Integration (Optional)

This template is designed to work with or without a CMS.

### Without CMS (Static Content)

Content is hardcoded in `src/index.html` - perfect for simple sites.

### With Bitworks CMS (or similar)

See `CLAUDE.md` lines 76-81 for CMS integration notes:
- Portfolio data structure
- Dynamic content fetching
- S3 asset management

**Data files to create:**
- `src/_data/portfolio.js` - Fetch from CMS API
- `src/_data/assets.js` - Image management

---

## SEO Configuration

This template includes comprehensive SEO out of the box.

### What's included:

✅ **Sitemap.xml** - `src/sitemap.njk`
✅ **Robots.txt** - `src/robots.txt`
✅ **Schema.org structured data** - `src/_includes/layout.njk` lines 90-159
✅ **Open Graph tags** - Social media previews
✅ **Canonical URLs** - Prevent duplicate content

### Update for your site:

1. **Business information** in schema markup (layout.njk lines 92-131):
   - Business name
   - Phone number
   - Address/location
   - License/credentials
   - Operating hours

2. **Meta descriptions** per page (frontmatter):
   ```yaml
   ---
   title: Page Title
   description: Page description for search engines
   ---
   ```

3. **Submit sitemap** to Google Search Console after deployment

See `SEO.md` for detailed SEO checklist and recommendations.

---

## Deployment

### Netlify (Recommended)

1. **Connect repository** to Netlify
2. **Build settings:**
   ```
   Build command: npm run build
   Publish directory: _site
   ```
3. **Environment variables:**
   - Add optional integration keys (Plausible, Turnstile)
   - `URL` is auto-set by Netlify

4. **Forms:**
   - Netlify Forms automatically detects `data-netlify="true"`
   - View submissions in Netlify dashboard

### Other Hosts (Vercel, GitHub Pages, etc.)

- Static files are in `_site/` after build
- Set environment variables in your host's dashboard
- Netlify Functions won't work (need to adapt Turnstile verification)

---

## Branch Workflow

This template uses a multi-branch strategy for client previews:

- **main** - Production site
- **version-a**, **version-b**, etc. - Client preview branches

Netlify automatically deploys each branch to a unique URL:
- Production: `yourdomain.com`
- Previews: `version-a--yoursite.netlify.app`

**To create a new client version:**
1. Create branch: `git checkout -b version-b`
2. Customize content
3. Enable branch deploys in Netlify settings

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Tailwind + Eleventy with live reload)
npm run dev

# Production build
npm run build

# Individual commands (if needed)
npx tailwindcss -i src/styles/tailwind.css -o src/styles/main.css --watch
npx @11ty/eleventy --serve
```

---

## File Structure

```
.
├── src/
│   ├── _data/
│   │   └── site.js              # Global site config
│   ├── _includes/
│   │   └── layout.njk           # Main layout template
│   ├── images/                  # Static images
│   ├── styles/
│   │   ├── tailwind.css         # Tailwind source
│   │   └── main.css             # Compiled CSS (generated)
│   ├── index.html               # Homepage
│   ├── sitemap.njk              # Sitemap generator
│   └── robots.txt               # Crawler directives
├── netlify/
│   └── functions/
│       └── verify-turnstile.js  # Turnstile verification
├── .eleventy.js                 # Eleventy config
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
├── package.json                 # Dependencies
├── CLAUDE.md                    # Developer guidance
├── SEO.md                       # SEO documentation
└── TEMPLATE.md                  # This file
```

---

## Common Customizations

### Change Color Scheme

Update CSS variables in `src/_includes/layout.njk` (lines 36-45)

### Add New Pages

1. Create `src/about.html` (or .njk)
2. Add frontmatter:
   ```yaml
   ---
   layout: layout.njk
   title: About Us
   description: Learn about our company
   ---
   ```
3. Page will be built to `_site/about/index.html`

### Remove Phone Number Banner

Delete lines 199-209 in `src/_includes/layout.njk`

### Change Fonts

Update Google Fonts link in `src/_includes/layout.njk` line 34:
```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;600;800&display=swap" rel="stylesheet" />
```

### Add Blog

1. Create `src/blog/` directory
2. Add markdown files with frontmatter
3. Configure Eleventy collections in `.eleventy.js`
4. See [Eleventy docs](https://www.11ty.dev/docs/collections/)

---

## Troubleshooting

### Turnstile not appearing
- Check `TURNSTILE_SITE_KEY` is set in environment variables
- Verify site key is correct in Cloudflare dashboard
- Check browser console for errors

### Plausible not tracking
- Verify `PLAUSIBLE_DOMAIN` matches your actual domain
- Check Network tab for request to Plausible server
- Plausible won't track localhost by default (expected)

### CSS not updating
- Run `npm run build` to regenerate CSS
- Clear browser cache
- Check `src/styles/main.css` was regenerated

### Images not optimizing
- First build with new images takes 30s-1min per image (normal)
- Check `.cache/` directory for cached images
- Verify S3 URLs are publicly accessible

---

## Managing Features Across Projects

### When You Add a Cool Feature to Another Project

You'll naturally add features to client projects that you want in future sites. Here's how to handle it:

#### Option 1: Backport to Glasstone (Recommended for major features)

When you add a significant feature (like a booking system, CMS integration, etc.) to a client project and want to use it as your new "standard":

```bash
# In the client project
git log --oneline  # Find the commit hash of your feature

# In Glasstone repo
cd ~/eleventy/Glasstone
git remote add client-project <client-repo-url>
git fetch client-project
git cherry-pick <commit-hash>
# Or manually copy the code if cherry-pick is messy
```

**When to backport:**
- ✅ New integration (payment processor, CMS, etc.)
- ✅ Major UI component you'll reuse often
- ✅ Build process improvements
- ✅ Performance optimizations

**When NOT to backport:**
- ❌ Client-specific features
- ❌ One-off customizations
- ❌ Industry-specific content

#### Option 2: Use Git Tags for Feature Tracking

Tag significant milestones in Glasstone:

```bash
# After adding a major feature
git tag -a v1.1-booking-system -m "Added booking system integration"
git push --tags

# List all features
git tag -l
```

**Benefits:**
- Quick reference of what features exist
- Can checkout specific feature versions
- Documents your progress over time

#### Option 3: Just Copy It (Totally Fine!)

When starting a new project, you might think "Oh, Project B has that cool feature Project A needed."

**It's okay to just:**
1. Open Project B in another window
2. Copy the relevant files
3. Paste into Project A
4. Adapt as needed

This is **normal and practical**. Don't feel guilty about it.

### Keeping This Reference Implementation Current

**Realistically:** You'll update Glasstone when:
- You finish a client project and want to capture improvements
- You're between projects and have time to clean things up
- You discover a bug fix that should be standard
- You add a new integration you'll use repeatedly

**You don't need to:**
- Backport every little change
- Keep perfect synchronization
- Feel bad when Glasstone falls behind
- Spend hours maintaining a "perfect template"

**The goal:** Glasstone stays "current enough" that it's still your best starting point, even if it's missing some features from recent projects.

### Feature Documentation

When you add a major feature to Glasstone, document it:

1. **Update TEMPLATE.md** - Add to customization checklist
2. **Update INTEGRATIONS.md** - If it's a third-party service
3. **Update CLAUDE.md** - If it changes the architecture
4. **Tag it** - `git tag feature-name`

This way future-you remembers what's available.

### Project Feature Matrix (Optional)

If you manage many projects, consider tracking features in a simple table:

| Feature | Glasstone | Project A | Project B | Project C |
|---------|-----------|-----------|-----------|-----------|
| Plausible | ✅ | ✅ | ❌ | ✅ |
| Turnstile | ✅ | ✅ | ✅ | ❌ |
| Booking System | ❌ | ✅ | ❌ | ✅ |
| CMS Integration | 🟡 | ✅ | ❌ | ✅ |

Legend: ✅ Implemented | ❌ Not needed | 🟡 Partial/documented

Keep this in a spreadsheet or Notion. Update when you start/finish projects.

---

## Version History

### v1.0 (December 2025)
- Initial template documentation
- Eleventy 3.1.2 + Tailwind 3.4.13
- Plausible Analytics integration
- Cloudflare Turnstile integration
- Comprehensive SEO (schema.org, sitemap, robots.txt)
- Netlify Forms with spam protection
- Responsive image optimization
- Mobile-first design system

### Future Additions (Ideas)

Track features you're considering adding:
- [ ] Blog/CMS integration example
- [ ] E-commerce/Stripe integration
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Booking/calendar system
- [ ] Client portal
- [ ] Your ideas here...

---

## Support & Resources

- **Eleventy Docs:** https://www.11ty.dev/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Plausible Analytics:** https://plausible.io/docs
- **Cloudflare Turnstile:** https://developers.cloudflare.com/turnstile/
- **Netlify Forms:** https://docs.netlify.com/forms/setup/

---

## License

This template is provided as-is for creating new websites. Customize and use freely for client projects.

---

**Last Updated:** December 9, 2025
**Template Version:** 1.0
**Original Project:** Glasstone Homes
**Approach:** Living reference implementation (not a static template)
