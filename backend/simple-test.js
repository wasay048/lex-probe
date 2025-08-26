// Simple test for demo request API
const http = require("http");

const testData = JSON.stringify({
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@testcompany.com",
  company: "Test Company Inc.",
  jobTitle: "CEO",
  phoneNumber: "+1-555-0123",
  companySize: "50-200",
  industry: "Technology",
  message: "We are interested in your cartel detection platform.",
});

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/v1/demo-requests",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(testData),
  },
};

console.log("🧪 Testing Demo Request Submission...");

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const response = JSON.parse(data);
      console.log("📄 Response Body:");
      console.log(JSON.stringify(response, null, 2));
    } catch (error) {
      console.log("📄 Raw Response:", data);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Request failed:", error.message);
});

req.write(testData);
req.end();
