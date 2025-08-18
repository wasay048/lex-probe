const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/cartel-detection-platform");

// User Schema (simplified version)
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

async function createTestUser() {
  try {
    console.log("🔧 Creating test user directly in database...\n");

    // Check if user already exists
    const existingUser = await User.findOne({ email: "testuser@example.com" });
    if (existingUser) {
      console.log("User already exists, deleting...");
      await User.deleteOne({ email: "testuser@example.com" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("TestPass123!", 12);

    // Create user
    const user = new User({
      email: "testuser@example.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      role: "user",
      isActive: true,
      isEmailVerified: true,
    });

    await user.save();
    console.log("✅ Test user created successfully!");
    console.log("Email: testuser@example.com");
    console.log("Password: TestPass123!");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error creating user:", error);
    mongoose.connection.close();
  }
}

createTestUser();
