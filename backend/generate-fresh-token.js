const jwt = require("jsonwebtoken");

// JWT Secret from the .env file
const JWT_SECRET =
  "your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random";

// Correct user ID from database
const CORRECT_USER_ID = "6883960af0ec3741945ed428";
const USER_EMAIL = "wasayhayee@gmail.com";

// Generate a fresh token with the correct user ID
const payload = {
  userId: CORRECT_USER_ID,
  email: USER_EMAIL,
  role: "user",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
};

const token = jwt.sign(payload, JWT_SECRET);

console.log("🔑 Generated fresh JWT token:");
console.log(token);
console.log("\n👤 Token payload:");
console.log("- User ID:", CORRECT_USER_ID);
console.log("- Email:", USER_EMAIL);
console.log("- Expires:", new Date(payload.exp * 1000).toISOString());

// Test the token by making an API call
const axios = require("axios");

async function testFreshToken() {
  try {
    console.log("\n🔍 Testing projects API with fresh token...");

    const projectsResponse = await axios.get(
      "http://localhost:5000/api/v1/projects",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "✅ Projects API Response:",
      JSON.stringify(projectsResponse.data, null, 2)
    );
  } catch (error) {
    console.error("❌ API Test Error:", error.response?.data || error.message);
  }
}

testFreshToken();
