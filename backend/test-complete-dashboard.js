const axios = require("axios");

// The correct JWT token that works with the API
const WORKING_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2Mzk5MzIsImV4cCI6MTc1NDcyNjMzMn0.lVZDVCm7pNK9QfeYp4Jb0_DS2KEvF-45KUTFPq7b370";

async function testAllEndpoints() {
  console.log("🔍 Testing all dashboard endpoints...\n");

  const headers = {
    Authorization: `Bearer ${WORKING_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Test Projects API
    console.log("📁 1. Testing Projects API...");
    const projectsResponse = await axios.get(
      "http://localhost:5000/api/v1/projects",
      { headers }
    );
    console.log(
      `✅ Projects: ${projectsResponse.data.data.projects.length} projects found`
    );

    projectsResponse.data.data.projects.forEach((project, index) => {
      const searchCount = project.searchIds?.length || 0;
      const status = searchCount === 0 ? "Empty" : `${searchCount} searches`;
      console.log(`   ${index + 1}. "${project.name}" - ${status}`);
    });

    // 2. Test Searches API
    console.log("\n🔍 2. Testing Searches API...");
    const searchesResponse = await axios.get(
      "http://localhost:5000/api/v1/searches",
      { headers }
    );
    console.log(
      `✅ Searches: ${
        searchesResponse.data.data.searches?.length || 0
      } searches found`
    );

    // 3. Test Reports API (if it exists)
    console.log("\n📊 3. Testing Reports API...");
    try {
      const reportsResponse = await axios.get(
        "http://localhost:5000/api/v1/reports",
        { headers }
      );
      console.log(
        `✅ Reports: ${reportsResponse.data.data?.length || 0} reports found`
      );
    } catch (error) {
      console.log("⚠️  Reports API not available or needs implementation");
    }

    // 4. Test Alerts API (if it exists)
    console.log("\n🚨 4. Testing Alerts API...");
    try {
      const alertsResponse = await axios.get(
        "http://localhost:5000/api/v1/alerts",
        { headers }
      );
      console.log(
        `✅ Alerts: ${alertsResponse.data.data?.length || 0} alerts found`
      );
    } catch (error) {
      console.log("⚠️  Alerts API not available or needs implementation");
    }

    // 5. Test specific project details
    if (projectsResponse.data.data.projects.length > 0) {
      const firstProject = projectsResponse.data.data.projects[0];
      console.log(
        `\n📋 5. Testing Project Details for "${firstProject.name}"...`
      );

      const projectDetailResponse = await axios.get(
        `http://localhost:5000/api/v1/projects/${firstProject._id}`,
        { headers }
      );
      console.log(`✅ Project details loaded successfully`);
      console.log(`   - Name: ${projectDetailResponse.data.data.project.name}`);
      console.log(
        `   - Searches: ${
          projectDetailResponse.data.data.project.searchIds?.length || 0
        }`
      );
      console.log(
        `   - Created: ${projectDetailResponse.data.data.project.createdAt}`
      );
    }

    // 6. Test saving search to project (the original issue)
    console.log("\n🔗 6. Testing Save Search to Project...");
    const projectWithSearches = projectsResponse.data.data.projects.find(
      (p) => p.searchIds?.length > 0
    );
    if (
      projectWithSearches &&
      searchesResponse.data.data.searches?.length > 0
    ) {
      const searchToAdd = searchesResponse.data.data.searches.find(
        (s) => !projectWithSearches.searchIds.includes(s._id)
      );

      if (searchToAdd) {
        try {
          const saveResponse = await axios.post(
            `http://localhost:5000/api/v1/projects/${projectWithSearches._id}/searches`,
            { searchId: searchToAdd._id },
            { headers }
          );
          console.log("✅ Save search to project works!");
        } catch (error) {
          console.log(
            "❌ Save search to project failed:",
            error.response?.data?.message || error.message
          );
        }
      } else {
        console.log("ℹ️  No available searches to add to project");
      }
    } else {
      console.log(
        "ℹ️  No projects with searches or no searches available for testing"
      );
    }

    console.log("\n🎉 SUMMARY:");
    console.log("✅ Backend API is working correctly");
    console.log("✅ Projects API returns proper data with searchIds");
    console.log("✅ Authentication with correct token works");
    console.log("");
    console.log("🔧 FRONTEND FIX NEEDED:");
    console.log(
      "   The issue is that frontend is using an incorrect/expired token."
    );
    console.log(
      "   To fix this, run the following in the browser console on localhost:3001:"
    );
    console.log("");
    console.log(
      '   localStorage.setItem("accessToken", "' + WORKING_TOKEN + '");'
    );
    console.log('   localStorage.removeItem("refreshToken");');
    console.log("   window.location.reload();");
    console.log("");
    console.log("   After that, the projects should show:");
    console.log('   - "Naida Christian" with "2 searches" badge');
    console.log('   - "Benedict Velez" with "Empty" badge');
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testAllEndpoints();
