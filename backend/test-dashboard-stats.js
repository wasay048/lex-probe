const axios = require("axios");
const jwt = require("jsonwebtoken");

// Use the valid token from generate-fresh-token.js
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

async function testDashboardStats() {
  try {
    console.log("Testing Dashboard Stats API...");
    console.log("Using token:", token.substring(0, 20) + "...");

    const response = await axios.get(
      "http://localhost:5000/api/v1/dashboard/stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("\n=== Dashboard Stats API Response ===");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error testing dashboard stats API:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No response received");
      console.error("Request:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    console.error("Full error:", error);
  }
}

testDashboardStats();
