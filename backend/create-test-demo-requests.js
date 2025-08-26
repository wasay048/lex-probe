const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb://localhost:27017/cartel-detection-platform"
);

// Define DemoRequest schema
const DemoRequestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, required: true },
    jobTitle: { type: String, required: true },
    phoneNumber: String,
    companySize: String,
    industry: String,
    message: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: String,
    signupAllowed: { type: Boolean, default: false },
    hasSignedUp: { type: Boolean, default: false },
    processedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const DemoRequest = mongoose.model("DemoRequest", DemoRequestSchema);

async function createTestDemoRequests() {
  try {
    console.log("🔧 Creating test demo requests...");

    // Check if demo requests already exist
    const existingCount = await DemoRequest.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} demo requests already exist`);
      process.exit(0);
    }

    const testRequests = [
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@acmecorp.com",
        company: "Acme Corporation",
        jobTitle: "Legal Director",
        phoneNumber: "+1-555-0123",
        companySize: "500-1000",
        industry: "Technology",
        message: "Interested in cartel detection for our procurement process.",
        status: "pending",
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@globallaw.com",
        company: "Global Law Firm",
        jobTitle: "Partner",
        phoneNumber: "+1-555-0456",
        companySize: "100-500",
        industry: "Legal Services",
        message:
          "Would like to explore cartel detection capabilities for client cases.",
        status: "pending",
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "m.chen@retailplus.com",
        company: "RetailPlus Inc",
        jobTitle: "Compliance Manager",
        phoneNumber: "+1-555-0789",
        companySize: "1000+",
        industry: "Retail",
        message: "Need solution for supply chain compliance monitoring.",
        status: "approved",
        signupAllowed: true,
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        firstName: "Emma",
        lastName: "Williams",
        email: "emma.w@consulting.com",
        company: "Williams Consulting",
        jobTitle: "Senior Consultant",
        phoneNumber: "+1-555-0321",
        companySize: "10-50",
        industry: "Consulting",
        message: "Evaluating tools for economic analysis projects.",
        status: "rejected",
        rejectionReason: "Company size does not meet minimum requirements",
        processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];

    for (const requestData of testRequests) {
      const demoRequest = new DemoRequest(requestData);
      await demoRequest.save();
      console.log(
        `✅ Created demo request for ${requestData.firstName} ${requestData.lastName}`
      );
    }

    console.log("✅ All test demo requests created successfully!");
    console.log(`📊 Total requests: ${testRequests.length}`);
    console.log(
      `🔄 Pending: ${testRequests.filter((r) => r.status === "pending").length}`
    );
    console.log(
      `✅ Approved: ${
        testRequests.filter((r) => r.status === "approved").length
      }`
    );
    console.log(
      `❌ Rejected: ${
        testRequests.filter((r) => r.status === "rejected").length
      }`
    );
  } catch (error) {
    console.error("❌ Error creating test demo requests:", error);
  } finally {
    mongoose.connection.close();
  }
}

createTestDemoRequests();
