const axios = require("axios");

async function debugDashboard() {
  try {
    console.log("🔍 Testing dashboard endpoint...");

    // Test without authentication first
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(
      "http://localhost:5000/api/v1/health"
    );
    console.log("✅ Health check:", healthResponse.data);

    // Test with authentication
    console.log("2. Testing dashboard with auth...");
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

    const response = await axios.get(
      "http://localhost:5000/api/v1/dashboard/stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "✅ Dashboard response:",
      JSON.stringify(response.data, null, 2)
    );
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    }
  }
}

debugDashboard();
