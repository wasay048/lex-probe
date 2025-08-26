const axios = require("axios");

async function testAuth() {
  try {
    // First login as admin
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "admin@lexprobe.com",
        password: "Admin123!",
      }
    );

    console.log("Login successful:", loginResponse.data.success);
    const token = loginResponse.data.data.accessToken;
    console.log("Token received:", token ? "Yes" : "No");

    // Then try to access demo requests using the correct endpoint
    const demoResponse = await axios.get(
      "http://localhost:5000/api/demo-requests",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Demo requests API successful:", demoResponse.data.success);
    console.log(
      "Number of requests:",
      demoResponse.data.data?.demoRequests?.length ||
        demoResponse.data.data?.length ||
        0
    );
    console.log(
      "First request:",
      demoResponse.data.data?.demoRequests?.[0] || "No requests"
    );
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAuth();
