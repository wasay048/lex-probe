const axios = require("axios");

async function debugSearchStructure() {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NDI2MDAsImV4cCI6MTc1NDcyOTAwMH0.FKHPNLhI-fq69kak0UY-q3yMyEubPhNfDR6WeNgq9So";

    console.log("🔍 Debug: Getting search structure...");

    // Get searches to see actual field names
    const searchesResponse = await axios.get(
      "http://localhost:5000/api/v1/searches",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchesResponse.data.data.searches.length > 0) {
      const search = searchesResponse.data.data.searches[0];

      console.log("🔍 Full Search Structure:");
      console.log(JSON.stringify(search, null, 2));

      console.log("\n📋 Search Fields:");
      console.log("- _id:", search._id);
      console.log("- companies exists:", !!search.companies);
      console.log("- companies length:", search.companies?.length);
      if (search.companies) {
        console.log(
          "- companies:",
          search.companies.map((c) => c.name)
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

debugSearchStructure();
