const axios = require("axios");

const API_BASE = "http://localhost:5000/api/v1";

// Test comprehensive analysis with SERP API integration
async function testComprehensiveAnalysis() {
  try {
    console.log("🧪 Testing Comprehensive Analysis with OSINT...\n");

    // Step 1: Register/Login user
    console.log("1. Authenticating user...");
    let token;
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: "test@test.com",
        password: "test123",
      });
      token = loginResponse.data.token;
      console.log("✅ Login successful");
    } catch (loginError) {
      console.log("User not found, registering...");
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: "test@test.com",
        password: "test123",
        firstName: "Test",
        lastName: "User",
      });
      token = registerResponse.data.token;
      console.log("✅ Registration successful");
    }

    // Step 2: Create a comprehensive search
    console.log("\n2. Creating comprehensive search with OSINT...");
    const searchData = {
      companies: [
        { name: "Apple Inc", industry: "Technology" },
        { name: "Samsung Electronics", industry: "Technology" },
      ],
      indicators: [
        {
          id: "price_fixing",
          indicator: "Price Fixing",
          category: "Pricing",
          riskScore: 5,
          description: "Evidence of coordinated pricing strategies",
        },
      ],
      includeOpenSourceResearch: true,
      searchDepth: "comprehensive",
    };

    const searchResponse = await axios.post(
      `${API_BASE}/searches`,
      searchData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const searchId = searchResponse.data._id;
    console.log(`✅ Search created with ID: ${searchId}`);

    // Step 3: Wait for analysis to complete and check results
    console.log("\n3. Waiting for comprehensive analysis to complete...");
    let attempts = 0;
    let searchResult;

    while (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

      const resultResponse = await axios.get(
        `${API_BASE}/searches/${searchId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      searchResult = resultResponse.data;

      if (searchResult.status === "completed") {
        break;
      }

      attempts++;
      console.log(`⏳ Analysis in progress... (${attempts}/10)`);
    }

    if (searchResult.status === "completed") {
      console.log("\n✅ Comprehensive analysis completed!");

      // Display results
      console.log("\n📊 Analysis Results:");
      console.log("==================");
      console.log(`Overall Risk Score: ${searchResult.overallRiskScore}/100`);
      console.log(`Total Companies Analyzed: ${searchResult.companies.length}`);
      console.log(`Indicators Analyzed: ${searchResult.indicators.length}`);

      if (searchResult.keyFindings) {
        console.log("\n🔍 Key Findings:");
        searchResult.keyFindings.forEach((finding, index) => {
          console.log(`${index + 1}. ${finding}`);
        });
      }

      if (searchResult.marketAnalysis) {
        console.log("\n📈 Market Analysis:");
        console.log(searchResult.marketAnalysis);
      }

      if (searchResult.recommendations) {
        console.log("\n💡 Recommendations:");
        searchResult.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      if (searchResult.sources && searchResult.sources.length > 0) {
        console.log("\n📚 Sources Found:");
        searchResult.sources.slice(0, 5).forEach((source, index) => {
          console.log(`${index + 1}. ${source.title} - ${source.url}`);
        });
      }

      // Test report generation
      console.log("\n4. Testing report generation...");
      const reportResponse = await axios.post(
        `${API_BASE}/reports`,
        {
          searchId: searchId,
          title: "Comprehensive Analysis Report",
          includeOpenSourceData: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(`✅ Report generated with ID: ${reportResponse.data._id}`);
    } else {
      console.log("❌ Analysis did not complete in expected time");
    }
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.error(
        "Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

// Run the test
testComprehensiveAnalysis();
