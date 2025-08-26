const axios = require("axios");
const jwt = require("jsonwebtoken");

async function debugAdminAuth() {
  try {
    console.log("🔐 Testing admin login and JWT payload...");

    // Login as admin
    const loginResponse = await axios.post(
      "http://localhost:5000/api/v1/auth/login",
      {
        email: "admin@lexprobe.com",
        password: "Admin123!",
      }
    );

    console.log("✅ Login successful:", loginResponse.data.success);
    const token = loginResponse.data.data.accessToken;
    console.log("✅ Token received:", token ? "Yes" : "No");

    // Decode the JWT to see the payload
    if (token) {
      try {
        const decoded = jwt.decode(token);
        console.log("\n🔍 JWT Payload:");
        console.log("User ID:", decoded.userId);
        console.log("Email:", decoded.email);
        console.log("Role:", decoded.role);
        console.log("Is Admin?:", decoded.role === "admin");
      } catch (jwtError) {
        console.error("JWT decode error:", jwtError.message);
      }
    }

    // Test demo requests endpoint with detailed error info
    console.log("\n📋 Testing demo requests API...");
    try {
      const demoResponse = await axios.get(
        "http://localhost:5000/api/v1/demo-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "✅ Demo requests API successful:",
        demoResponse.data.success
      );
      console.log(
        "📊 Raw response data:",
        JSON.stringify(demoResponse.data, null, 2)
      );
      console.log(
        "📊 Number of requests:",
        demoResponse.data.data?.demoRequests?.length || 0
      );
      if (demoResponse.data.data?.demoRequests?.length > 0) {
        console.log(
          "First request:",
          demoResponse.data.data.demoRequests[0].firstName +
            " " +
            demoResponse.data.data.demoRequests[0].lastName
        );
      }
    } catch (demoError) {
      console.error(
        "❌ Demo requests API error:",
        demoError.response?.data || demoError.message
      );
      console.error("Status:", demoError.response?.status);
    }
  } catch (error) {
    console.error("❌ Login Error:", error.response?.data || error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
    }
  }
}

debugAdminAuth();
