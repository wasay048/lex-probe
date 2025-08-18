const axios = require("axios");

async function registerAndTestProjects() {
  try {
    // Generate unique email for testing
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = "Test123!@#";

    // Step 1: Register a new user
    console.log("📝 Step 1: Registering new test user...");
    const registerResponse = await axios.post(
      "http://localhost:5000/api/v1/auth/register",
      {
        email: testEmail,
        password: testPassword,
        firstName: "Test",
        lastName: "User",
      }
    );

    console.log("✅ Registration successful!");
    console.log(
      "Full register response:",
      JSON.stringify(registerResponse.data, null, 2)
    );

    // Extract token - it might be in different locations
    const token =
      registerResponse.data.data?.token || registerResponse.data.token;
    if (!token) {
      console.error("❌ No token found in response");
      return;
    }

    console.log("🎟️ Token:", token.substring(0, 50) + "...");

    // Step 2: Test projects API with fresh token
    const authHeader = `Bearer ${token}`;
    const PROJECT_ID = "689489c666c38ba47ca0460f";

    console.log("\n📋 Step 2: Testing projects API...");

    // Test list projects
    try {
      const projectsResponse = await axios.get(
        "http://localhost:5000/api/v1/projects",
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );
      console.log(
        "📁 Projects list:",
        JSON.stringify(projectsResponse.data, null, 2)
      );
    } catch (error) {
      console.log(
        "📁 Projects list error:",
        error.response?.data || error.message
      );
    }

    // Step 3: Test get specific project (this might fail since it belongs to another user)
    console.log(`\n🎯 Step 3: Getting specific project ${PROJECT_ID}...`);
    try {
      const projectResponse = await axios.get(
        `http://localhost:5000/api/v1/projects/${PROJECT_ID}`,
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      console.log(
        "✅ Project detail response:",
        JSON.stringify(projectResponse.data, null, 2)
      );
    } catch (error) {
      console.log(
        "❌ Project detail error:",
        error.response?.data || error.message
      );
      console.log(
        "   (This is expected if the project belongs to another user)"
      );
    }
  } catch (error) {
    console.error(
      "❌ Registration Error:",
      error.response?.data || error.message
    );
    if (error.response?.status) {
      console.error("HTTP Status:", error.response.status);
    }
  }
}

registerAndTestProjects();
