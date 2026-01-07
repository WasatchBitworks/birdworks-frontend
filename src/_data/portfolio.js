const fetch = require('node-fetch');

module.exports = async function() {
  // Configuration - adjust these values
  const CMS_BASE_URL = process.env.CMS_BASE_URL || 'https://bitworks-cms-1b47129ae0d7.herokuapp.com';
  const PORTFOLIO_SLUG = process.env.PORTFOLIO_SLUG || 'glasstone-homes';
  
  try {
    console.log(`Fetching portfolio data from: ${CMS_BASE_URL}/api/portfolio/${PORTFOLIO_SLUG}`);
    
    const response = await fetch(`${CMS_BASE_URL}/api/portfolio/${PORTFOLIO_SLUG}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch portfolio data: ${response.status} ${response.statusText}`);
      return getFallbackData();
    }
    
    const data = await response.json();
    console.log('Successfully fetched portfolio data from CMS');
    
    return data;
  } catch (error) {
    console.warn(`Error fetching portfolio data: ${error.message}`);
    console.log('Using fallback data instead');
    return getFallbackData();
  }
};

// Fallback data structure for Glasstone Homes
function getFallbackData() {
  return {
    client: {
      name: "Glasstone Homes",
      slug: "glasstone-homes"
    },
    bio: {
      content: "We specialize in custom home building, bringing together skilled craftsmanship, innovative design, and quality materials to create homes that exceed expectations.\n\nFrom initial consultation to final walkthrough, we're committed to making your dream home a reality. Our team works closely with clients throughout the entire building process to ensure every detail reflects their vision and lifestyle."
    },
    projects: [
      {
        title: "Custom Homes",
        description: "Thoughtfully designed and expertly crafted homes tailored to your lifestyle and preferences.",
        tech_stack: ["Custom Design", "Quality Materials", "Expert Craftsmanship", "Project Management"],
        display_order: 0
      },
      {
        title: "Renovations", 
        description: "Transform your existing space with our comprehensive renovation and remodeling services.",
        tech_stack: ["Interior Design", "Structural Work", "Modern Updates", "Quality Finishes"],
        display_order: 1
      }
    ],
    gallery: [
      {
        image_url: "/images/sample1.jpg",
        caption: "Modern Farmhouse",
        display_order: 0
      },
      {
        image_url: "/images/sample2.jpg", 
        caption: "Contemporary Design",
        display_order: 1
      },
      {
        image_url: "/images/sample3.jpg",
        caption: "Traditional Style", 
        display_order: 2
      }
    ]
  };
}