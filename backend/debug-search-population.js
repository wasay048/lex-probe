const axios = require("axios");

async function debugSearchPopulation() {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

    console.log("🔍 Debug: Getting detailed report data...");

    // Get reports with full structure
    const reportsResponse = await axios.get(
      "http://localhost:5000/api/v1/reports",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (reportsResponse.data.data.reports.length > 0) {
      const report = reportsResponse.data.data.reports[0];

      console.log("📊 Full Report Structure:");
      console.log(JSON.stringify(report, null, 2));

      console.log("\n📋 Report Fields:");
      console.log("- _id:", report._id);
      console.log("- title:", report.title);
      console.log("- searchId exists:", !!report.searchId);
      console.log("- search exists:", !!report.search);

      if (report.searchId) {
        console.log("\n🔍 SearchId Structure:");
        console.log(JSON.stringify(report.searchId, null, 2));
      }

      if (report.search) {
        console.log("\n🔍 Search Structure:");
        console.log(JSON.stringify(report.search, null, 2));
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

debugSearchPopulation();
