const axios = require("axios");

async function testReportDataStructure() {
  try {
    // Use the active user token
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

    // Test with the report that was just generated
    const reportId = "689ca247c5990a4340c461e6";

    console.log(`🔍 Testing data structure for report: ${reportId}`);

    const response = await axios.get(
      `http://localhost:5000/api/v1/reports/${reportId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const report = response.data.data;

    console.log("\n📊 Report Data Structure:");
    console.log("- Report ID:", report._id);
    console.log("- Status:", report.status);
    console.log("- Title:", report.title);

    if (report.search) {
      console.log("\n🔍 Search Data:");
      console.log("- Search ID:", report.search._id);
      console.log("- Query:", report.search.query);

      // Check both data structures
      if (report.search.companyNames) {
        console.log("✅ companyNames found:", report.search.companyNames);
        console.log("- Type:", typeof report.search.companyNames);
        console.log("- Is Array:", Array.isArray(report.search.companyNames));
      } else {
        console.log("❌ companyNames not found");
      }

      if (report.search.companies) {
        console.log(
          "✅ companies found:",
          report.search.companies.length,
          "items"
        );
        console.log("- First company:", report.search.companies[0]);
      } else {
        console.log("❌ companies not found");
      }
    } else {
      console.log("❌ Search data not populated");
    }

    console.log("\n✅ Test completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testReportDataStructure();
