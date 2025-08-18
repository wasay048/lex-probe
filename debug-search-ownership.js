const jwt = require("jsonwebtoken");
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTUwNzM5NDcsImV4cCI6MTc1NTE2MDM0N30.989Sbk7JxDUicqt72EKMsi8g0sYjPndePCMKXugdSSo";

console.log("Decoded token:", jwt.decode(token));

// Also test searching for the specific search
const axios = require("axios");

async function testSearch() {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/v1/searches/68949b21f788da2534b312a7",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Search response:", JSON.stringify(response.data, null, 2));

    // Also test report access
    console.log("\n--- Testing Report Access ---");
    const reportResponse = await axios.get(
      "http://localhost:5000/api/v1/reports/689c6bcf72d3374fc9543fa7",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      "Report response:",
      JSON.stringify(reportResponse.data, null, 2)
    );
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testSearch();
