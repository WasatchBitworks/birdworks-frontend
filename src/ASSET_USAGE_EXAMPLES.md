# Asset Usage Examples for Glasstone Site

## How to Use CMS Assets in Your Templates

### 1. **Hero Image (Cropped to 1200x600)**

```html
<!-- Find a specific asset by tag -->
{% set heroAsset = assets.byTag('hero')[0] %}

{% if heroAsset %}
  {% heroImage heroAsset.url, "Glasstone Homes - Custom Home Builders" %}
{% endif %}
```

### 2. **Responsive Image (Maintains Aspect Ratio)**

```html
<!-- Use any image asset -->
{% set projectImage = assets.byTag('project-1')[0] %}

{% if projectImage %}
  {% responsiveImage projectImage.url, projectImage.description, "(min-width: 768px) 50vw, 100vw" %}
{% endif %}
```

### 3. **Gallery Grid (Square Thumbnails)**

```html
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
  {% for asset in assets.byTag('gallery') %}
    <div>
      {% galleryThumb asset.url, asset.filename %}
    </div>
  {% endfor %}
</div>
```

### 4. **Logo (Preserves Transparency)**

```html
{% set logo = assets.byTag('logo')[0] %}

{% if logo %}
  {% logo logo.url, "Glasstone Homes Logo", 150 %}
{% endif %}
```

### 5. **Loop Through All Images**

```html
<section class="projects">
  <h2>Our Projects</h2>
  <div class="grid">
    {% for image in assets.images %}
      <div class="project-card">
        {% responsiveImage image.url, image.description %}
        <h3>{{ image.filename }}</h3>
        {% if image.tags %}
          <div class="tags">
            {% for tag in image.tags %}
              <span>{{ tag }}</span>
            {% endfor %}
          </div>
        {% endif %}
      </div>
    {% endfor %}
  </div>
</section>
```

## Available Data

### `assets.all` - All assets
```javascript
[
  {
    id: 123,
    filename: "hero-image.jpg",
    url: "https://s3.../hero-image.jpg",
    file_type: "image",
    tags: ["hero", "homepage"],
    description: "Beautiful custom home",
    size_bytes: 2048000,
    created_at: "2025-01-15"
  }
]
```

### `assets.images` - Only images
### `assets.documents` - Only PDFs/docs
### `assets.videos` - Only videos
### `assets.byTag('tagname')` - Filter by tag
### `assets.find('filename')` - Find by filename

## What Gets Generated

When you use `{% heroImage url, alt %}`, Eleventy creates:

1. **Multiple formats:**
   - `hero-1200w.webp` (modern browsers)
   - `hero-1200w.jpg` (fallback)
   - `hero-2400w.webp` (retina)
   - `hero-2400w.jpg` (retina fallback)

2. **Responsive HTML:**
```html
<picture>
  <source type="image/webp" srcset="..." sizes="100vw">
  <source type="image/jpeg" srcset="..." sizes="100vw">
  <img src="..." alt="..." loading="eager" decoding="async">
</picture>
```

## Tagging Strategy in CMS

Organize your assets with tags:

- `hero` - Homepage hero images
- `project-{name}` - Project-specific photos
- `gallery` - Portfolio gallery images
- `logo` - Company logos
- `team` - Team member photos
- `icon` - UI icons

Then use `assets.byTag('hero')` in templates!

## Performance Benefits

- ✅ **WebP format** - 30-50% smaller than JPEG
- ✅ **Multiple sizes** - Browsers load appropriate size
- ✅ **Lazy loading** - Images load as you scroll
- ✅ **Cached** - Eleventy Fetch caches API calls for 1 hour
- ✅ **Build-time processing** - No runtime overhead

## Example: Complete Homepage

```html
<!DOCTYPE html>
<html>
<head>
  <title>Glasstone Homes</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    {% set hero = assets.byTag('hero')[0] %}
    {% heroImage hero.url, "Custom Home Builders" %}
    <div class="hero-content">
      <h1>Build Your Dream Home</h1>
    </div>
  </section>

  <!-- Projects Grid -->
  <section class="projects">
    <div class="grid grid-cols-3 gap-6">
      {% for project in assets.byTag('portfolio') %}
        <div class="project-card">
          {% galleryThumb project.url, project.description %}
          <p>{{ project.description }}</p>
        </div>
      {% endfor %}
    </div>
  </section>
</body>
</html>
```
