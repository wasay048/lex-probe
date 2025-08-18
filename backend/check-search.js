const axios = require("axios");

const searchId = process.argv[2];

if (!searchId) {
  console.log("Usage: node check-search.js <searchId>");
  process.exit(1);
}

async function checkSearch() {
  try {
    console.log(`Checking search ${searchId}...`);

    const response = await axios.get(
      `http://localhost:5000/api/v1/searches/${searchId}`,
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ0NzYzNzksImV4cCI6MTc1NDU2Mjc3OX0.hFymCOnP0hdfLndEpSCrPnosP3rQcT6FOVMZ7JCpcMo",
        },
      }
    );

    const searchData = response.data.data?.search || response.data.data;

    console.log("✅ Search Status:", {
      id: searchData?._id || "Not found",
      status: searchData?.status || "Unknown",
      createdAt: searchData?.createdAt || "Unknown",
      updatedAt: searchData?.updatedAt || "Unknown",
      companies: (searchData?.companies || []).length,
      analysisResults: searchData?.analysisResults ? "Present" : "None",
      overallRiskScore: searchData?.overallRiskScore || 0,
    });

    if (searchData?.analysisResults) {
      console.log("\n📊 Analysis Results Summary:");
      console.log(
        `   - Overall Risk Score: ${
          searchData.analysisResults.overallRiskScore || 0
        }`
      );
      console.log(
        `   - Alert Level: ${
          searchData.analysisResults.alertLevel || "Unknown"
        }`
      );
      console.log(
        `   - Companies Analyzed: ${
          searchData.analysisResults.companiesAnalysis?.length || 0
        }`
      );
      console.log(
        `   - Key Findings: ${
          searchData.analysisResults.keyFindings?.length || 0
        }`
      );
      console.log(
        `   - Recommendations: ${
          searchData.analysisResults.recommendations?.length || 0
        }`
      );

      if (searchData.analysisResults.keyFindings?.length > 0) {
        console.log("\n🔍 Key Findings:");
        searchData.analysisResults.keyFindings
          .slice(0, 3)
          .forEach((finding, index) => {
            console.log(`   ${index + 1}. ${finding}`);
          });
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

checkSearch();

const searchId = process.argv[2];

if (!searchId) {
  console.log("Usage: node check-search.js <searchId>");
  process.exit(1);
}

async function checkSearch() {
  try {
    console.log(`Checking search ${searchId}...`);

    const response = await axios.get(
      `http://localhost:5000/api/v1/searches/${searchId}`,
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ0NzYzNzksImV4cCI6MTc1NDU2Mjc3OX0.hFymCOnP0hdfLndEpSCrPnosP3rQcT6FOVMZ7JCpcMo",
        },
      }
    );

    console.log("✅ Search Status:", {
      id: response.data.data._id,
      status: response.data.data.status,
      createdAt: response.data.data.createdAt,
      updatedAt: response.data.data.updatedAt,
      companies: response.data.data.companies?.length || 0,
      analysisResults: response.data.data.analysisResults ? "Present" : "None",
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

checkSearch();
