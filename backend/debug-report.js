require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/cartel-detection-test"
);

// Define Report schema (simplified)
const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  filePath: String,
  status: String,
  format: String,
  sharedWith: [
    {
      email: String,
      expiresAt: Date,
    },
  ],
});

const Report = mongoose.model("Report", reportSchema);

async function checkReport() {
  try {
    const reportId = "68a46d60e356dcfa3c41bd2a";
    const userIdFromToken = "68839660af0ec374194ed428";

    console.log("Checking report:", reportId);
    console.log("User ID from token:", userIdFromToken);

    const report = await Report.findById(reportId);

    if (!report) {
      console.log("❌ Report not found");
      return;
    }

    console.log("✅ Report found");
    console.log("Report userId:", report.userId.toString());
    console.log("Token userId:", userIdFromToken);
    console.log(
      "User IDs match:",
      report.userId.toString() === userIdFromToken
    );
    console.log("Report status:", report.status);
    console.log("Report filePath:", report.filePath);
    console.log("Shared with:", report.sharedWith);

    // Check if file exists
    const fs = require("fs").promises;
    try {
      await fs.access(report.filePath);
      console.log("✅ File exists at path");
    } catch {
      console.log("❌ File does not exist at path");
    }
  } catch (error) {
    console.error("Error checking report:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkReport();
