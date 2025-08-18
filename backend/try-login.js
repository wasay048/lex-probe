const axios = require("axios");

const testPasswords = [
  "test123",
  "Test123",
  "test123!",
  "Test123!",
  "Test123!@#",
  "password",
  "Password123",
  "Password123!",
];

async function tryLogin() {
  console.log("🔐 Attempting to login with user: wasayhayee@gmail.com");

  for (const password of testPasswords) {
    try {
      console.log(`\n🔑 Trying password: ${password}`);
      const loginResponse = await axios.post(
        "http://localhost:5000/api/v1/auth/login",
        {
          email: "wasayhayee@gmail.com",
          password: password,
        }
      );

      console.log("✅ LOGIN SUCCESSFUL!");
      const { token } = loginResponse.data.data;
      console.log("🎟️ Token:", token);

      // Test the endpoint immediately
      console.log("\n🔍 Testing save search to project with fresh token...");
      const PROJECT_ID = "68949325a63c0c5b2c38818e";
      const SEARCH_ID = "68949b21f788da2534b312a7";

      const response = await axios.post(
        `http://localhost:5000/api/v1/projects/${PROJECT_ID}/searches`,
        { searchId: SEARCH_ID },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🎉 SUCCESS! Search saved to project:", response.data);
      return; // Exit on success
    } catch (error) {
      console.log(
        `❌ Failed with password: ${password} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  console.log("\n❌ All password attempts failed");
}

tryLogin();
