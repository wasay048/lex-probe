const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb://localhost:27017/cartel-detection-platform"
);

// Define User schema (basic version for this script)
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "analyst"], default: "user" },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    organization: String,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", UserSchema);

async function createAdminUser() {
  try {
    console.log("🔧 Creating admin user...");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@lexprobe.com" });
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      console.log("Email: admin@lexprobe.com");
      console.log("Password: Admin123!");
      process.exit(0);
    }

    const adminUser = new User({
      email: "admin@lexprobe.com",
      password: "Admin123!",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isEmailVerified: true,
      isActive: true,
      organization: "LexProbe",
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@lexprobe.com");
    console.log("Password: Admin123!");
    console.log("Role: admin");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
