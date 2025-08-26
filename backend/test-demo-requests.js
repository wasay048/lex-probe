const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

async function testDemoRequestAPI() {
  console.log("🧪 Testing Demo Request System...\n");

  try {
    // Test 1: Submit a demo request
    console.log("1. Testing demo request submission...");
    const demoResponse = await axios.post(`${BASE_URL}/demo-requests`, {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@testcompany.com",
      company: "Test Company Ltd",
      jobTitle: "Chief Technology Officer",
      phoneNumber: "+1-555-0123",
      companySize: "50-200 employees",
      industry: "Technology",
      message:
        "Interested in implementing cartel detection for our procurement processes.",
    });

    console.log("✅ Demo request submitted successfully:");
    console.log(JSON.stringify(demoResponse.data, null, 2));
    console.log("\n");

    // Test 2: Check email eligibility (should be false for new request)
    console.log("2. Testing email eligibility check...");
    const eligibilityResponse = await axios.get(
      `${BASE_URL}/demo-requests/check-eligibility`,
      {
        params: { email: "john.smith@testcompany.com" },
      }
    );

    console.log("✅ Email eligibility checked:");
    console.log(JSON.stringify(eligibilityResponse.data, null, 2));
    console.log("\n");

    // Test 3: Try submitting duplicate demo request
    console.log("3. Testing duplicate demo request submission...");
    try {
      const duplicateResponse = await axios.post(`${BASE_URL}/demo-requests`, {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@testcompany.com",
        company: "Test Company Ltd",
        jobTitle: "CTO",
      });
    } catch (duplicateError) {
      console.log("✅ Duplicate request properly rejected:");
      console.log(JSON.stringify(duplicateError.response.data, null, 2));
    }
    console.log("\n");

    // Test 4: Submit another demo request for admin testing
    console.log("4. Submitting another demo request for admin testing...");
    const demo2Response = await axios.post(`${BASE_URL}/demo-requests`, {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@techcorp.com",
      company: "TechCorp Inc",
      jobTitle: "Procurement Director",
      phoneNumber: "+1-555-0124",
      companySize: "200-1000 employees",
      industry: "Manufacturing",
      message: "Looking for anti-cartel solutions for our supply chain.",
    });

    console.log("✅ Second demo request submitted:");
    console.log(JSON.stringify(demo2Response.data, null, 2));
    console.log("\n");

    console.log("🎉 Demo Request API tests completed successfully!");
    console.log("\nNext steps for testing:");
    console.log("1. Login as admin to test approval workflow");
    console.log(
      "2. Test the admin endpoints for viewing and managing requests"
    );
    console.log("3. Test the restricted registration flow");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testDemoRequestAPI();
