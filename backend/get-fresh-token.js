const axios = require("axios");

async function getFreshToken() {
  try {
    console.log("🔐 Getting fresh token for user...");

    // Try to register a user with the correct email first
    try {
      const registerResponse = await axios.post(
        "http://localhost:5000/api/v1/auth/register",
        {
          email: "wasayhayee@gmail.com",
          password: "Test123!@#",
          firstName: "Wasay",
          lastName: "Hayee",
        }
      );
      console.log("✅ New user registered");
    } catch (error) {
      // If user already exists, that's fine
      console.log("👤 User already exists, proceeding to login");
    }

    // Now try to login
    const loginResponse = await axios.post(
      "http://localhost:5000/api/v1/auth/login",
      {
        email: "wasayhayee@gmail.com",
        password: "Test123!@#",
      }
    );

    console.log("✅ Login successful!");
    const { token } = loginResponse.data.data;
    console.log("🎟️ New Token:", token);

    // Test the new token with the save search to project endpoint
    const PROJECT_ID = "68949325a63c0c5b2c38818e";
    const SEARCH_ID = "68949b21f788da2534b312a7";

    console.log("\n🔍 Testing save search to project with fresh token...");
    const response = await axios.post(
      `http://localhost:5000/api/v1/projects/${PROJECT_ID}/searches`,
      {
        searchId: SEARCH_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Success! Search saved to project:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

getFreshToken();
