# Third-Party Integrations Guide

This document provides detailed setup instructions for optional third-party services integrated into the BirdWorks frontend.

**Note:** This site currently uses Plausible Analytics. Other integrations (Turnstile, Netlify Forms) are documented here for reference but not currently active.

---

## 📊 Plausible Analytics

### What is Plausible?

Privacy-friendly, open-source web analytics alternative to Google Analytics. No cookies, GDPR compliant, lightweight script (~1KB).

### Setup Options

#### Option 1: Self-Hosted Plausible (Free)

**Requirements:**
- VPS with Docker and Docker Compose
- Domain with SSL certificate
- 2GB RAM minimum

**Setup Steps:**

1. **Clone Plausible hosting repository:**
   ```bash
   git clone https://github.com/plausible/hosting
   cd hosting
   ```

2. **Configure environment:**
   ```bash
   # Generate secret key
   openssl rand -base64 64

   # Edit plausible-conf.env
   BASE_URL=https://analytics.yourdomain.com
   SECRET_KEY_BASE=<generated-secret>
   ```

3. **Start services:**
   ```bash
   docker compose up -d
   ```

4. **Create admin account:**
   - Visit `https://analytics.yourdomain.com/register`
   - Create account
   - Set `DISABLE_REGISTRATION=true` in plausible-conf.env
   - Restart: `docker compose down && docker compose up -d`

**Detailed Instructions:** See `/Users/zachkane/plausible/README.md`

#### Option 2: Plausible Cloud (Paid)

1. **Sign up:** https://plausible.io/register
2. **Add your site** in dashboard
3. **Get tracking script** (looks like: `https://plausible.io/js/script.js`)

**Pricing:** $9/month (10k pageviews), $19/month (100k pageviews)

### Integration with This Template

**Environment Variables:**

```bash
# For self-hosted
PLAUSIBLE_DOMAIN=yourdomain.com
PLAUSIBLE_URL=https://analytics.yourdomain.com/js/script.js

# For Plausible Cloud
PLAUSIBLE_DOMAIN=yourdomain.com
PLAUSIBLE_URL=https://plausible.io/js/script.js
```

**BirdWorks Implementation:**

The Plausible script is loaded in `src/_includes/layout-birds.njk`:

```html
<!-- Plausible Analytics -->
<script defer data-domain="wasatchbirdworks.com" src="https://analytics.wasatchbitworks.com/js/script.js"></script>
```

**To make it conditional (recommended for templates):**

```njk
{% if site.plausibleDomain %}
  <!-- Plausible Analytics -->
  <script defer
    data-domain="{{ site.plausibleDomain }}"
    src="{{ site.plausibleUrl or 'https://plausible.io/js/script.js' }}">
  </script>
{% endif %}
```

### Verification

1. Visit your site
2. Open browser DevTools → Network tab
3. Look for request to Plausible script
4. Check Plausible dashboard for live visitors

**Note:** Plausible doesn't track localhost by default (this is intentional)

### Advanced Features

**Track custom events:**
```js
plausible('Signup', {props: {method: 'Email'}})
```

**Track outbound links:**
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.outbound-links.js"></script>
```

**Track file downloads:**
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.file-downloads.js"></script>
```

See [Plausible docs](https://plausible.io/docs) for more.

---

## 🛡️ Cloudflare Turnstile

### What is Turnstile?

Cloudflare's CAPTCHA alternative. Free, privacy-friendly, better UX than reCAPTCHA. Works like reCAPTCHA but without tracking users across sites.

### Why Turnstile?

✅ **Free** - 1M requests/month
✅ **No tracking** - Doesn't share data with Google
✅ **Better UX** - Most users never see a challenge
✅ **Accessible** - WCAG compliant
✅ **Lightweight** - Smaller script than reCAPTCHA

### Setup Instructions

#### 1. Create Turnstile Site

1. **Log in to Cloudflare:** https://dash.cloudflare.com
2. **Navigate to Turnstile:** Sidebar → Turnstile
3. **Add a site:**
   - **Site name:** Your project name
   - **Domains:** `yourdomain.com` (or `*` for testing)
   - **Widget mode:** Managed (recommended)
4. **Copy keys:**
   - **Site Key** (public) - Goes in HTML
   - **Secret Key** (private) - Goes in environment variables

#### 2. Configure Environment Variables

**In Netlify Dashboard:**

1. Go to **Site settings → Environment variables**
2. Add:
  ```
  # Add your Turnstile keys in the Netlify dashboard (do NOT commit secrets)
  TURNSTILE_SITE_KEY=your_site_key_here
  TURNSTILE_SECRET_KEY=your_secret_key_here
  ```

**For local development (.env file):**
```bash
# Local development: add values to a local .env file (do NOT commit)
TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

#### 3. Verify Integration

**Frontend (HTML):**

```html
<!-- Load Turnstile script -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- Render widget -->
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY" data-theme="dark"></div>
```

**Backend (Netlify Function):**

File: `netlify/functions/verify-turnstile.js`

This function verifies the Turnstile token server-side before accepting form submissions.

**Client-side (JavaScript):**

File: `src/index.html` (lines 569-638)

Handles form submission, verifies token, shows success/error messages.

### How It Works

1. User fills out contact form
2. Turnstile widget generates a token (invisible to user most of the time)
3. On submit, JavaScript:
   - Gets Turnstile token
   - Sends to Netlify function for verification
   - If valid, submits form to Netlify Forms
   - If invalid, shows error message
4. User sees success/error feedback

### Testing Turnstile

**Test modes in Cloudflare dashboard:**

- **Managed (recommended):** Shows challenge only when needed
- **Non-interactive:** Always invisible
- **Invisible:** Completely invisible (most bots still blocked)

**Force a challenge (for testing):**
Change widget mode to "Managed" and Cloudflare will occasionally show a checkbox.

### Customization

**Change theme:**
```html
<div class="cf-turnstile" data-sitekey="..." data-theme="light"></div>
```

Options: `light`, `dark`, `auto`

**Change size:**
```html
<div class="cf-turnstile" data-sitekey="..." data-size="compact"></div>
```

Options: `normal`, `compact`

**Callback on success:**
```html
<div class="cf-turnstile"
  data-sitekey="..."
  data-callback="onTurnstileSuccess">
</div>

<script>
function onTurnstileSuccess(token) {
  console.log('Turnstile passed:', token);
}
</script>
```

### Troubleshooting

**Widget not appearing:**
- Check site key is correct
- Verify domain is allowed in Cloudflare dashboard
- Check browser console for errors

**Verification failing:**
- Check secret key is set in environment variables
- Verify Netlify function deployed correctly
- Check Netlify function logs for errors

**"Missing Turnstile token" error:**
- Turnstile script didn't load (check network tab)
- Widget didn't render (check HTML)
- User hasn't completed challenge (rare with Managed mode)

### Making It Optional (Template Mode)

**In `src/_data/site.js`:**
```js
turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null,
```

**In HTML:**
```njk
{% if site.turnstileSiteKey %}
  <div class="cf-turnstile" data-sitekey="{{ site.turnstileSiteKey }}" data-theme="dark"></div>
{% endif %}
```

**In JavaScript:**
```js
// Check if Turnstile is enabled
if (typeof turnstile !== 'undefined') {
  const token = turnstile.getResponse();
  // Verify token...
} else {
  // Submit form without Turnstile
}
```

This way, form still works without Turnstile (using honeypot only).

---

## 🌐 Netlify Forms

### What is Netlify Forms?

Built-in form handling by Netlify. No backend code needed. Submissions appear in Netlify dashboard.

### Setup (Already Configured)

Forms in this template use `data-netlify="true"`:

```html
<form name="contact" method="POST" data-netlify="true">
  <!-- form fields -->
</form>
```

Netlify automatically:
- Processes form submissions
- Stores data in dashboard
- Sends email notifications (configure in settings)
- Prevents spam with honeypot field

### Viewing Submissions

1. Netlify Dashboard → Your Site
2. **Forms** tab in sidebar
3. View submissions, export CSV, set up notifications

### Email Notifications

**In Netlify Dashboard:**
1. Forms → Form settings
2. **Form notifications**
3. Add email notification
4. Enter your email address

You'll receive an email for each form submission.

### Spam Protection

**Already included:**

1. **Honeypot field** (line 531-533 in index.html):
   ```html
   <p class="hidden">
     <label>Don't fill this out: <input name="bot-field"></label>
   </p>
   ```

2. **Turnstile** (optional, see above)

3. **Netlify's built-in spam filtering**

### Custom Success Page (Optional)

**Add to form:**
```html
<form name="contact" method="POST" data-netlify="true" action="/success">
```

**Create `src/success.html`:**
```html
---
layout: layout.njk
title: Thank You
---
<section class="py-20 text-center">
  <h1>Thank you for your message!</h1>
  <p>We'll get back to you within 24 hours.</p>
</section>
```

### Webhook Integration (Advanced)

Send form submissions to Slack, Zapier, etc.

**In Netlify Dashboard:**
1. Forms → Form settings
2. **Outgoing webhook**
3. Enter webhook URL
4. Submissions will POST to your webhook as JSON

---

## 🎨 Google Fonts

### Current Setup

This template uses **Inter** font family (layout.njk line 34):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
```

### Change to Different Font

1. **Browse fonts:** https://fonts.google.com
2. **Select font weights** you need
3. **Copy the `<link>` tag**
4. **Replace in `layout.njk`:**
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
   ```
5. **Update CSS references:**
   ```css
   body {
     font-family: 'Roboto', sans-serif;
   }
   ```

### Font Loading Best Practices

**Use `display=swap`** (already included):
- Prevents invisible text during font load
- Shows fallback font immediately

**Limit font weights:**
- Only load weights you use (400, 600, 800)
- Reduces page load time

**Self-host fonts (advanced):**
For even faster loading, download fonts and serve locally:

1. Use https://google-webfonts-helper.herokuapp.com/
2. Download font files
3. Place in `src/fonts/`
4. Add `@font-face` rules in CSS

---

## 📧 Email Service Providers (Future)

This template uses Netlify Forms. To add email service:

### SendGrid

1. Sign up: https://sendgrid.com
2. Create API key
3. Install: `npm install @sendgrid/mail`
4. Create Netlify function to send emails

### Mailgun

Similar setup to SendGrid. See [Mailgun docs](https://www.mailgun.com/).

### Resend (Modern Alternative)

1. Sign up: https://resend.com
2. Get API key
3. Very simple API: `resend.emails.send({})`

---

## 🔒 Security Headers (Netlify)

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

This prevents:
- Clickjacking attacks
- MIME type sniffing
- Unnecessary browser permissions

---

## Support Resources

- **Plausible:** https://plausible.io/docs
- **Turnstile:** https://developers.cloudflare.com/turnstile/
- **Netlify Forms:** https://docs.netlify.com/forms/setup/
- **Eleventy:** https://www.11ty.dev/docs/

---

**Last Updated:** January 7, 2026
**Project:** Wasatch BirdWorks Frontend
