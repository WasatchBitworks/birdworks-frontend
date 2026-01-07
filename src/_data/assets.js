const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
  try {
    const url = "https://bitworks-cms-1b47129ae0d7.herokuapp.com/api/assets/glasstone-homes";

    const json = await EleventyFetch(url, {
      duration: "1h", // Cache for 1 hour during development
      type: "json",
      fetchOptions: {
        headers: {
          "User-Agent": "Glasstone-Eleventy-Site/1.0"
        }
      }
    });

    console.log(`✅ Fetched ${json.assets?.length || 0} assets from CMS`);

    return {
      all: json.assets || [],

      // Helper filters
      images: (json.assets || []).filter(a => a.file_type === 'image'),
      documents: (json.assets || []).filter(a => a.file_type === 'document'),
      videos: (json.assets || []).filter(a => a.file_type === 'video'),

      // Get by tag
      byTag: function(tag) {
        return (json.assets || []).filter(a => a.tags && a.tags.includes(tag));
      },

      // Get single asset by filename
      find: function(filename) {
        return (json.assets || []).find(a => a.filename.includes(filename));
      }
    };

  } catch (error) {
    console.error("❌ Failed to fetch assets from CMS:", error.message);

    // Return empty structure on error so build doesn't fail
    return {
      all: [],
      images: [],
      documents: [],
      videos: [],
      byTag: () => [],
      find: () => null
    };
  }
};
