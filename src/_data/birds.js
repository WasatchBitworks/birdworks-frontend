const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
  // Environment configuration
  const API_BASE = process.env.BIRDS_API_BASE || 'https://cms.wasatchbitworks.com/api/birds';
  const SLUG = 'wasatch-bitworks';

  const endpoints = {
    today: `${API_BASE}/${SLUG}/latest?date=today`,  // All detections for current day (Mountain Time)
    species: `${API_BASE}/${SLUG}/detections/species`,  // Detection species, not photo species
    daily: `${API_BASE}/${SLUG}/daily?days=30`,
    photos: `${API_BASE}/${SLUG}/photos?limit=50`,  // Recent photos (all, not just featured)
    featuredPhotos: `${API_BASE}/${SLUG}/photos/featured`  // Featured photos only
  };

  console.log(`🐦 Fetching bird data from: ${API_BASE}/${SLUG}`);

  try {
    // Fetch all endpoints in parallel
    const [todayData, species, daily, photos, featuredPhotos] = await Promise.all([
      fetchWithCache(endpoints.today, '1m'),
      fetchWithCache(endpoints.species, '5m'),
      fetchWithCache(endpoints.daily, '5m'),
      fetchWithCache(endpoints.photos, '5m'),
      fetchWithCache(endpoints.featuredPhotos, '5m')
    ]);

    const generatedAt = new Date().toISOString();

    console.log(`✅ Bird data fetched successfully:`);
    console.log(`   - ${todayData.detections?.length || 0} detections today (${todayData.date || 'unknown'})`);
    console.log(`   - ${species.species?.length || 0} species`);
    console.log(`   - ${daily.daily?.length || 0} days of data`);
    console.log(`   - ${photos.photos?.length || 0} photos`);
    console.log(`   - ${featuredPhotos.photos?.length || 0} featured photos`);
    console.log(`   - Generated at: ${generatedAt}`);

    return {
      today: todayData.detections || [],
      todayDate: todayData.date || null,
      species: species.species || [],
      daily: daily.daily || [],  // API returns .daily not .daily_counts
      photos: photos.photos || [],
      featuredPhotos: featuredPhotos.photos || [],
      generatedAt,
      apiBase: API_BASE
    };

  } catch (error) {
    console.error(`❌ Failed to fetch bird data: ${error.message}`);
    console.log('⚠️  Using empty fallback data');

    return {
      today: [],
      todayDate: null,
      species: [],
      daily: [],
      photos: [],
      featuredPhotos: [],
      generatedAt: new Date().toISOString(),
      apiBase: API_BASE,
      error: error.message
    };
  }
};

async function fetchWithCache(url, duration) {
  return await EleventyFetch(url, {
    duration,
    type: "json",
    fetchOptions: {
      headers: {
        "User-Agent": "BirdWorks-Eleventy-Site/1.0"
      }
    }
  });
}
