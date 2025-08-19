// Test script to login and get a fresh token
const axios = require("axios");

async function loginAndDownload() {
  try {
    // First, login to get a fresh token
    console.log("Logging in...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/v1/auth/login",
      {
        email: "wasayhayee@gmail.com",
        password: "password123", // Update with correct password if different
      }
    );

    const token = loginResponse.data.token;
    console.log("Login successful, got token:", token.substring(0, 50) + "...");

    // Now try to download the report
    console.log("Downloading report...");
    const downloadResponse = await axios.get(
      "http://localhost:5000/api/v1/reports/68a46d60e356dcfa3c41bd2a/download",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer", // For binary data
      }
    );

    console.log("Download successful!");
    console.log("Response headers:", downloadResponse.headers);
    console.log("Content length:", downloadResponse.data.length);
  } catch (error) {
    console.error("Error:", error.response?.status, error.response?.statusText);
    console.error("Response data:", error.response?.data?.toString());
  }
}

loginAndDownload();
