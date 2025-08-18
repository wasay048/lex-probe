const axios = require("axios");

// Using the same data from your curl request
const PROJECT_ID = "68949325a63c0c5b2c38818e";
const SEARCH_ID = "68949b21f788da2534b312a7";
const AUTH_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ1Njk0MzMsImV4cCI6MTc1NDY1NTgzM30.keEaEu2Lis6PkPPgh0OFKWwKj4tTQdkby5HtgvepWXw";

async function testSaveSearchToProject() {
  try {
    console.log("🔍 Testing Save Search to Project...");
    console.log("📁 Project ID:", PROJECT_ID);
    console.log("🔍 Search ID:", SEARCH_ID);

    // First, let's verify the project exists
    console.log("\n1. Checking if project exists...");
    try {
      const projectResponse = await axios.get(
        `http://localhost:5000/api/v1/projects/${PROJECT_ID}`,
        {
          headers: {
            Authorization: AUTH_TOKEN,
          },
        }
      );
      console.log(
        "✅ Project found:",
        projectResponse.data.data?.project?.name || "No name"
      );
    } catch (error) {
      console.log(
        "❌ Project check failed:",
        error.response?.data || error.message
      );
      return;
    }

    // Next, let's check if the search exists
    console.log("\n2. Checking if search exists...");
    try {
      const searchResponse = await axios.get(
        `http://localhost:5000/api/v1/searches/${SEARCH_ID}`,
        {
          headers: {
            Authorization: AUTH_TOKEN,
          },
        }
      );
      console.log("✅ Search found");
    } catch (error) {
      console.log(
        "❌ Search check failed:",
        error.response?.data || error.message
      );
    }

    // Now try to save search to project
    console.log("\n3. Attempting to save search to project...");
    const response = await axios.post(
      `http://localhost:5000/api/v1/projects/${PROJECT_ID}/searches`,
      {
        searchId: SEARCH_ID,
      },
      {
        headers: {
          Authorization: AUTH_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Success:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Save search to project error:");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method);
    console.error("Headers:", error.config?.headers);
  }
}

testSaveSearchToProject();
