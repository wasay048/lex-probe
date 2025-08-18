const axios = require("axios");

const testData = {
  companies: [
    {
      name: "Nike",
      website: "https://www.nike.com",
      industry: "Unknown",
      region: "Global",
    },
    {
      name: "Puma",
      website: "https://www.puma.com",
      industry: "Unknown",
      region: "Global",
    },
  ],
  filters: {
    dateRange: {
      from: "2024-08-06T10:35:28.896Z",
      to: "2025-08-06T10:35:28.896Z",
    },
    industries: [],
    regions: [],
    searchName: "Tech Giant",
    searchType: "past",
  },
  selectedIndicators: [
    "price_fixing_identical",
    "price_fixing_coordinated",
    "price_fixing_future_intentions",
    "price_fixing_converging_margins",
    "price_fixing_industry_norms",
    "price_fixing_communications_enforcement",
    "price_fixing_trade_associations",
    "price_fixing_public_signaling",
    "price_fixing_cost_margin_exchange",
    "price_fixing_suspicious_benchmarking",
    "price_fixing_pricing_audits",
    "price_fixing_email_arrangements",
  ],
  searchMode: "osint",
  description: "",
};

async function testAPI() {
  try {
    console.log("Testing API with processed indicators...");

    const response = await axios.post(
      "http://localhost:5000/api/v1/searches/execute",
      testData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ0NzYzNzksImV4cCI6MTc1NDU2Mjc3OX0.hFymCOnP0hdfLndEpSCrPnosP3rQcT6FOVMZ7JCpcMo",
        },
      }
    );

    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testAPI();
