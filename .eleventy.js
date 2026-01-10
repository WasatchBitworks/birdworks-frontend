const Image = require("@11ty/eleventy-img");

module.exports = function(eleventyConfig) {
  // ==========================================
  // Date/Time Filters for Mountain Time
  // ==========================================

  // Convert UTC timestamp to Mountain Time display
  eleventyConfig.addFilter("toMountainTime", function(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        timeZone: "America/Denver",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  });

  // Short time format (just time, no date)
  eleventyConfig.addFilter("toMountainTimeShort", function(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        timeZone: "America/Denver",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  });

  // Date only format
  eleventyConfig.addFilter("toMountainDate", function(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        timeZone: "America/Denver",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  });

  // JSON stringify filter for data attributes
  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value);
  });

  // Slice filter for arrays (like JavaScript's array.slice())
  eleventyConfig.addFilter("slice", function(array, start, end) {
    if (!Array.isArray(array)) return [];
    return array.slice(start, end);
  });

  // Reverse filter for arrays
  eleventyConfig.addFilter("reverse", function(array) {
    if (!Array.isArray(array)) return [];
    return [...array].reverse(); // Create a copy to avoid mutating original
  });

  // Find photo by species name - prioritizes featured photos
  eleventyConfig.addFilter("findPhotoBySpecies", function(photos, speciesName) {
    if (!Array.isArray(photos) || !speciesName) return null;

    // Filter photos for this species
    const speciesPhotos = photos.filter(photo =>
      photo.species && photo.species.common_name === speciesName
    );

    if (speciesPhotos.length === 0) return null;

    // Return featured photo first if available
    const featuredPhoto = speciesPhotos.find(photo => photo.is_featured === true);
    return featuredPhoto || speciesPhotos[0];
  });

  // ✅ Add this line to copy the built CSS to _site
  eleventyConfig.addPassthroughCopy("src/styles/main.css");
  eleventyConfig.addPassthroughCopy("src/favicon.ico"); // or .png
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/images/og");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/js");

  // ==========================================
  // Image Processing Shortcodes
  // ==========================================

  // Hero Image - Crops to 1200x600 for banner
  eleventyConfig.addShortcode("heroImage", async function(src, alt = "") {
    if (!src) return "";

    let metadata = await Image(src, {
      widths: [1200, 2400], // Standard + retina
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      sharpOptions: {
        resize: {
          width: 1200,
          height: 600,
          fit: "cover",
          position: "center"
        }
      }
    });

    return Image.generateHTML(metadata, {
      alt,
      sizes: "100vw",
      loading: "eager", // Hero loads immediately
      decoding: "async"
    });
  });

  // Responsive Image - Maintains aspect ratio, multiple sizes
  eleventyConfig.addShortcode("responsiveImage", async function(src, alt = "", sizes = "100vw") {
    if (!src) return "";

    let metadata = await Image(src, {
      widths: [400, 800, 1200],
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/"
      // No sharpOptions = maintains original aspect ratio
    });

    return Image.generateHTML(metadata, {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async"
    });
  });

  // Gallery Thumbnail - Square crop for uniform grid
  eleventyConfig.addShortcode("galleryThumb", async function(src, alt = "") {
    if (!src) return "";

    let metadata = await Image(src, {
      widths: [400, 800],
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      sharpOptions: {
        resize: {
          width: 400,
          height: 400,
          fit: "cover",
          position: "center"
        }
      }
    });

    return Image.generateHTML(metadata, {
      alt,
      sizes: "(min-width: 768px) 33vw, 50vw",
      loading: "lazy",
      decoding: "async"
    });
  });

  // Logo/Icon - Keeps aspect ratio, max width
  eleventyConfig.addShortcode("logo", async function(src, alt = "", maxWidth = 200) {
    if (!src) return "";

    let metadata = await Image(src, {
      widths: [maxWidth],
      formats: ["png", "webp"], // PNG for transparency
      outputDir: "./_site/img/",
      urlPath: "/img/",
      sharpOptions: {
        resize: {
          width: maxWidth,
          fit: "inside" // Scales to fit, doesn't crop
        }
      }
    });

    return Image.generateHTML(metadata, {
      alt,
      loading: "lazy",
      decoding: "async"
    });
  });

  // Before/After Image - Optimized for comparison views
  eleventyConfig.addShortcode("beforeAfterImage", async function(src, alt = "") {
    if (!src) return "";

    let metadata = await Image(src, {
      widths: [600, 1200, 2400], // Mobile, desktop, and full-size for lightbox
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      cacheOptions: {
        duration: "1d", // Cache remote images for 1 day
        directory: ".cache",
        removeUrlQueryParams: false
      }
    });

    return Image.generateHTML(metadata, {
      alt,
      sizes: "(min-width: 768px) 50vw, 100vw",
      loading: "lazy",
      decoding: "async",
      class: "w-full h-auto object-cover"
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};