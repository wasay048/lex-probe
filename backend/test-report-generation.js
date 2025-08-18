const axios = require("axios");

async function testReportAPI() {
  try {
    console.log("Starting Report Generation Test (single searchId support)\n");

    // 1. Login dynamically instead of hardcoded token
    console.log("1. Logging in...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/v1/auth/login",
      {
        email: process.env.TEST_EMAIL || "testuser@example.com",
        password: process.env.TEST_PASSWORD || "TestPass123!",
      }
    );
    console.log("Raw login response keys:", Object.keys(loginResponse.data));
    console.log(
      "Login response data:",
      JSON.stringify(loginResponse.data, null, 2)
    );

    const token = loginResponse.data.data?.accessToken;
    if (!token) {
      console.error(
        "No accessToken found in login response. Full response:",
        JSON.stringify(loginResponse.data, null, 2)
      );
      return;
    }
    console.log("Access token acquired (length):", token.length);

    // Allow manual override of search ID
    const overrideSearchId = process.env.SEARCH_ID;
    let targetSearchId = overrideSearchId;

    if (!overrideSearchId) {
      // 2. Get searches
      console.log("2. Fetching searches (no SEARCH_ID override provided)...");
      const searchesResponse = await axios.get(
        "http://localhost:5000/api/v1/searches?limit=50",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const searches = searchesResponse.data.data?.searches || [];
      const completed = searches.filter((s) => s.status === "completed");
      if (completed.length === 0) {
        console.log(
          "No completed searches found for this user. Provide SEARCH_ID env to test manually."
        );
        return;
      }
      targetSearchId = completed[0]._id;
    }

    console.log("Using search:", targetSearchId);

    // 3. Generate report using new single searchId format
    console.log("3. Generating report with single searchId payload...");
    const singlePayload = {
      title: `Cartel Analysis Report - ${new Date().toISOString()}`,
      searchId: targetSearchId,
      description: "Comprehensive OSINT + indicator-driven analysis",
      reportType: "analysis",
    };

    const generateSingle = await axios.post(
      "http://localhost:5000/api/v1/reports",
      singlePayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(
      "Single searchId report accepted: ID",
      generateSingle.data.data.report._id
    );

    console.log(
      "4. Generating report via /reports/generate endpoint (normalized sections)..."
    );
    const generatePayload = {
      searchId: targetSearchId,
      title: `Generated Report - ${new Date().toISOString()}`,
      sections: [
        "executive_summary",
        "methodology",
        "findings",
        "recommendations",
      ],
      format: "pdf",
    };

    const generateEndpoint = await axios.post(
      "http://localhost:5000/api/v1/reports/generate",
      generatePayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(
      "Generate endpoint accepted: ID",
      generateEndpoint.data.data.report._id
    );

    console.log("Report generation endpoints operational.");
  } catch (error) {
    console.error("Test failed");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testReportAPI();
