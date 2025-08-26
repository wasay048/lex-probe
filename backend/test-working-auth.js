const axios = require("axios");

async function testWorkingAuth() {
  try {
    console.log("🔐 Testing admin login...");

    // Login as admin using the correct endpoint
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "admin@lexprobe.com",
        password: "Admin123!",
      }
    );

    console.log("✅ Login successful:", loginResponse.data.success);
    const token = loginResponse.data.data.accessToken;
    console.log("✅ Token received:", token ? "Yes" : "No");

    // Test demo requests endpoint
    console.log("\n📋 Testing demo requests API...");
    const demoResponse = await axios.get(
      "http://localhost:5000/api/demo-requests",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Demo requests API successful:", demoResponse.data.success);
    console.log(
      "📊 Number of requests:",
      demoResponse.data.data?.demoRequests?.length || 0
    );

    // Test stats endpoint
    console.log("\n📈 Testing stats API...");
    const statsResponse = await axios.get(
      "http://localhost:5000/api/demo-requests/stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Stats API successful:", statsResponse.data.success);
    console.log("📊 Stats:", statsResponse.data.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testWorkingAuth();
