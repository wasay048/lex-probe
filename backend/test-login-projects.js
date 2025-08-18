const axios = require("axios");

async function loginAndTestProjects() {
  try {
    // Step 1: Login to get a fresh token
    console.log("🔐 Step 1: Logging in to get fresh token...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/v1/auth/login",
      {
        email: "wasayhayee@gmail.com",
        password: "test123", // You may need to adjust this password
      }
    );

    console.log("✅ Login successful!");
    const { token } = loginResponse.data.data;
    console.log("🎟️ Token:", token.substring(0, 50) + "...");

    // Step 2: Test projects API with fresh token
    const authHeader = `Bearer ${token}`;
    const PROJECT_ID = "689489c666c38ba47ca0460f";

    console.log("\n📋 Step 2: Testing projects API...");

    // Test list projects
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

    // Test get specific project
    console.log(`\n🎯 Step 3: Getting specific project ${PROJECT_ID}...`);
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

    // Analyze response structure
    console.log("\n🔧 Response structure analysis:");
    console.log("- success:", projectResponse.data.success);
    console.log("- data:", !!projectResponse.data.data);
    console.log("- data.project:", !!projectResponse.data.data?.project);
    if (projectResponse.data.data?.project) {
      console.log("- project.name:", projectResponse.data.data.project.name);
      console.log("- project._id:", projectResponse.data.data.project._id);
      console.log(
        "- project.createdAt:",
        projectResponse.data.data.project.createdAt
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    if (error.response?.status) {
      console.error("HTTP Status:", error.response.status);
    }
  }
}

loginAndTestProjects();
