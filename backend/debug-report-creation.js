const axios = require("axios");

async function testReportCreation() {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

    console.log("🔍 Testing search ownership and report creation...");

    // First, get user's searches
    const searchesResponse = await axios.get(
      "http://localhost:5000/api/v1/searches",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(
      "✅ User searches retrieved:",
      searchesResponse.data.data.searches.length
    );

    if (searchesResponse.data.data.searches.length > 0) {
      const firstSearch = searchesResponse.data.data.searches[0];
      console.log("📄 First search details:");
      console.log("  ID:", firstSearch._id);
      console.log("  User ID:", firstSearch.userId);
      console.log("  Status:", firstSearch.status);

      // Decode JWT to see the user ID
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      console.log("🎫 Token user ID:", tokenPayload.userId);
      console.log("🔄 IDs match:", firstSearch.userId === tokenPayload.userId);

      // Now try to create a report
      console.log("🔍 Attempting report creation...");
      const reportData = {
        title: "Test Report - Debug Session",
        description: "Testing report creation with proper search ownership",
        searchIds: [firstSearch._id],
        reportType: "analysis",
      };

      const reportResponse = await axios.post(
        "http://localhost:5000/api/v1/reports",
        reportData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Report created successfully!");
      console.log("📊 Report ID:", reportResponse.data.data.report._id);
    } else {
      console.log("⚠️ No searches found for this user");
    }
  } catch (error) {
    console.error("❌ Error details:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message);
    console.error(
      "Full response:",
      JSON.stringify(error.response?.data, null, 2)
    );
  }
}

testReportCreation();
