const axios = require("axios");

const API_BASE = "http://localhost:5000/api/v1";

// Simple test without recaptcha
async function simpleTest() {
  try {
    console.log("🧪 Testing basic functionality...\n");

    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log("✅ Health check:", healthResponse.data.message);

    // Try to access searches without auth (should fail)
    console.log("\n2. Testing protected endpoint without auth...");
    try {
      await axios.get(`${API_BASE}/searches`);
      console.log("❌ Should have failed");
    } catch (error) {
      if (error.response.status === 401) {
        console.log("✅ Protected endpoint properly secured");
      } else {
        console.log("❌ Unexpected error:", error.response.status);
      }
    }

    // Check if user already exists and try login
    console.log("\n3. Testing existing user login...");
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: "testuser@example.com",
        password: "TestPass123!",
      });

      console.log("✅ Login successful for existing user");
      const token = loginResponse.data.token;

      // Test authenticated endpoint
      console.log("\n4. Testing authenticated searches endpoint...");
      const searchesResponse = await axios.get(`${API_BASE}/searches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        `✅ Searches endpoint accessible, found ${searchesResponse.data.length} searches`
      );

      // Try to create a search
      console.log("\n5. Testing search creation...");
      const searchData = {
        companies: [
          { name: "Test Company A", industry: "Technology" },
          { name: "Test Company B", industry: "Technology" },
        ],
        indicators: [
          {
            id: "price_coordination",
            indicator: "Price Coordination",
            category: "Pricing",
            riskScore: 4,
            description: "Testing price coordination indicator",
          },
        ],
      };

      const createResponse = await axios.post(
        `${API_BASE}/searches`,
        searchData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(`✅ Search created with ID: ${createResponse.data._id}`);
      console.log(`Search status: ${createResponse.data.status}`);
    } catch (loginError) {
      console.log("❌ Login failed. Let me try without recaptcha token...");

      try {
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
          email: "testuser@example.com",
          password: "TestPass123!",
          firstName: "Test",
          lastName: "User",
          // No recaptchaToken - let's see what happens
        });

        console.log("✅ Registration without recaptcha successful");
      } catch (registerError) {
        console.log(
          "❌ Registration error:",
          registerError.response?.data?.message || registerError.message
        );
        console.log(
          "Full error:",
          JSON.stringify(registerError.response?.data, null, 2)
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response?.data?.message || error.message
    );
  }
}

// Run the test
simpleTest();
