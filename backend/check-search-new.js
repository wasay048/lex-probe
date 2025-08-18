const axios = require("axios");

const searchId = process.argv[2];

if (!searchId) {
  console.log("Usage: node check-search.js <searchId>");
  process.exit(1);
}

async function checkSearch() {
  try {
    console.log(`Checking search ${searchId}...`);

    const response = await axios.get(
      `http://localhost:5000/api/v1/searches/${searchId}`,
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ0NzYzNzksImV4cCI6MTc1NDU2Mjc3OX0.hFymCOnP0hdfLndEpSCrPnosP3rQcT6FOVMZ7JCpcMo",
        },
      }
    );

    console.log("Raw Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

checkSearch();
