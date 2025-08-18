const axios = require("axios");

// Using the correct user ID from database
const CORRECT_USER_ID = "6883960af0ec3741945ed428";

async function testProjectsAPI() {
  try {
    console.log("🔍 Testing projects API response structure...");

    // For now, let's try without authentication to see the structure
    // We'll need to bypass auth or use a proper token later
    
    // Create a simple test token (this won't work with real auth but let's see the structure)
    console.log("📋 Testing project list API...");
    
    // First, let's check the health endpoint
    const healthResponse = await axios.get("http://localhost:5000/api/v1/health");
    console.log("✅ Server is running:", healthResponse.data.message);

    // Try direct database query to understand what we should expect
    console.log("💾 Let's check what the actual project data looks like...");

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testProjectsAPI();
