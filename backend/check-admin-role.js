const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb://localhost:27017/cartel-detection-platform"
);

const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  firstName: String,
  lastName: String,
});

const User = mongoose.model("User", UserSchema);

async function checkAdmin() {
  try {
    const admin = await User.findOne({ email: "admin@lexprobe.com" });
    console.log("Admin user found:", admin ? "Yes" : "No");
    if (admin) {
      console.log("Admin details:", {
        email: admin.email,
        role: admin.role,
        name: admin.firstName + " " + admin.lastName,
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdmin();
