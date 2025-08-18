const axios = require("axios");

const AUTH_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ0NzYzNzksImV4cCI6MTc1NDU2Mjc3OX0.hFymCOnP0hdfLndEpSCrPnosP3rQcT6FOVMZ7JCpcMo";
const PROJECT_ID = "689489c666c38ba47ca0460f";

async function testProjectAPI() {
  try {
    console.log("🔍 Testing Project API...");

    // Test 1: List projects
    console.log("\n📋 1. Testing: GET /api/v1/projects");
    const projectsResponse = await axios.get(
      "http://localhost:5000/api/v1/projects",
      {
        headers: {
          Authorization: AUTH_TOKEN,
        },
      }
    );
    console.log(
      "✅ List Projects Response:",
      JSON.stringify(projectsResponse.data, null, 2)
    );

    // Test 2: Get specific project
    console.log(`\n📁 2. Testing: GET /api/v1/projects/${PROJECT_ID}`);
    const projectResponse = await axios.get(
      `http://localhost:5000/api/v1/projects/${PROJECT_ID}`,
      {
        headers: {
          Authorization: AUTH_TOKEN,
        },
      }
    );
    console.log(
      "✅ Get Project Response:",
      JSON.stringify(projectResponse.data, null, 2)
    );
    console.log("\n🔧 Response structure analysis:");
    console.log("- success:", projectResponse.data.success);
    console.log("- data:", !!projectResponse.data.data);
    console.log("- data.project:", !!projectResponse.data.data?.project);
    console.log("- project.name:", projectResponse.data.data?.project?.name);
    console.log("- project._id:", projectResponse.data.data?.project?._id);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    if (error.response?.status) {
      console.error("Status:", error.response.status);
    }
  }
}

testProjectAPI();
