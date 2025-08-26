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

async function addMoreTestRequests() {
  try {
    console.log("🔧 Adding more test demo requests...");

    const additionalRequests = [
      {
        firstName: "David",
        lastName: "Wilson",
        email: "d.wilson@techcorp.com",
        company: "Tech Corporation",
        jobTitle: "Chief Legal Officer",
        phoneNumber: "+1-555-0111",
        companySize: "1000+",
        industry: "Technology",
        message: "We need cartel detection for our procurement team.",
        status: "pending",
      },
      {
        firstName: "Lisa",
        lastName: "Brown",
        email: "lisa.brown@consulting.net",
        company: "Brown Consulting",
        jobTitle: "Senior Partner",
        phoneNumber: "+1-555-0222",
        companySize: "50-100",
        industry: "Consulting",
        message: "Evaluating cartel detection tools for client work.",
        status: "pending",
      },
      {
        firstName: "Robert",
        lastName: "Davis",
        email: "robert.davis@finance.com",
        company: "Davis Financial",
        jobTitle: "Compliance Director",
        phoneNumber: "+1-555-0333",
        companySize: "500-1000",
        industry: "Financial Services",
        message:
          "Need comprehensive cartel analysis for regulatory compliance.",
        status: "approved",
        signupAllowed: true,
        processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const requestData of additionalRequests) {
      // Check if this email already exists
      const existing = await DemoRequest.findOne({ email: requestData.email });
      if (!existing) {
        const demoRequest = new DemoRequest(requestData);
        await demoRequest.save();
        console.log(
          `✅ Created demo request for ${requestData.firstName} ${requestData.lastName}`
        );
      } else {
        console.log(`⏭️  Request for ${requestData.email} already exists`);
      }
    }

    // Get final count
    const finalCount = await DemoRequest.countDocuments();
    const stats = {
      pending: await DemoRequest.countDocuments({ status: "pending" }),
      approved: await DemoRequest.countDocuments({ status: "approved" }),
      rejected: await DemoRequest.countDocuments({ status: "rejected" }),
    };

    console.log("\n📊 Final Statistics:");
    console.log(`📋 Total requests: ${finalCount}`);
    console.log(`🔄 Pending: ${stats.pending}`);
    console.log(`✅ Approved: ${stats.approved}`);
    console.log(`❌ Rejected: ${stats.rejected}`);
  } catch (error) {
    console.error("❌ Error adding test demo requests:", error);
  } finally {
    mongoose.connection.close();
  }
}

addMoreTestRequests();
