const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
  // Environment configuration
  const API_BASE = process.env.BIRDS_API_BASE || 'https://cms.wasatchbitworks.com/api/birds';
  const SLUG = 'wasatch-bitworks';

  const endpoints = {
    latest: `${API_BASE}/${SLUG}/latest?limit=20`,
    species: `${API_BASE}/${SLUG}/detections/species`,  // Detection species, not photo species
    daily: `${API_BASE}/${SLUG}/daily?days=30`
  };

  console.log(`🐦 Fetching bird data from: ${API_BASE}/${SLUG}`);

  try {
    // Fetch all endpoints in parallel
    const [latest, species, daily] = await Promise.all([
      fetchWithCache(endpoints.latest, '1m'),
      fetchWithCache(endpoints.species, '5m'),
      fetchWithCache(endpoints.daily, '5m')
    ]);

    const generatedAt = new Date().toISOString();

    console.log(`✅ Bird data fetched successfully:`);
    console.log(`   - ${latest.detections?.length || 0} recent detections`);
    console.log(`   - ${species.species?.length || 0} species`);
    console.log(`   - ${daily.daily_counts?.length || 0} days of data`);
    console.log(`   - Generated at: ${generatedAt}`);

    return {
      latest: latest.detections || [],
      species: species.species || [],
      daily: daily.daily_counts || [],
      generatedAt,
      apiBase: API_BASE
    };

  } catch (error) {
    console.error(`❌ Failed to fetch bird data: ${error.message}`);
    console.log('⚠️  Using empty fallback data');

    return {
      latest: [],
      species: [],
      daily: [],
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
