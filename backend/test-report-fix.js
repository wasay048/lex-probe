const axios = require("axios");

async function testReportCreation() {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

    console.log("🔍 Testing report creation and listing...");

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
      console.log(
        "  Companies:",
        firstSearch.companies?.map((c) => c.name).join(", ") || "N/A"
      );

      // Create a report
      console.log("🔍 Creating report...");
      const reportData = {
        title: "Test Report - Fixed Search Population",
        description: "Testing report creation with proper search population",
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

      // Now test listing reports to see if search data is populated
      console.log("🔍 Testing report listing...");
      const reportsResponse = await axios.get(
        "http://localhost:5000/api/v1/reports",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(
        "✅ Reports retrieved:",
        reportsResponse.data.data.reports.length
      );

      if (reportsResponse.data.data.reports.length > 0) {
        const firstReport = reportsResponse.data.data.reports[0];
        console.log("📊 First report structure:");
        console.log("  Title:", firstReport.title);
        console.log("  Has search field:", !!firstReport.search);
        console.log("  Has searchId field:", !!firstReport.searchId);

        if (firstReport.search) {
          console.log(
            "  Search companies:",
            firstReport.search.companies?.map((c) => c.name).join(", ") || "N/A"
          );
        }

        if (firstReport.searchId) {
          console.log(
            "  SearchId companies:",
            firstReport.searchId.companies?.map((c) => c.name).join(", ") ||
              "N/A"
          );
        }
      }
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
