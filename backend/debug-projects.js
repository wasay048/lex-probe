#!/usr/bin/env node

// Quick Debug Script for Project Issues
// Run this in the backend directory: node debug-projects.js

const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/cartel-detection-platform", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  tags: [String],
  searchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Search" }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", ProjectSchema);
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: String,
    name: String,
  })
);

async function debugProjects() {
  try {
    console.log("🔍 Debugging Projects...\n");

    // List all users
    const users = await User.find({}, { email: 1, name: 1, _id: 1 });
    console.log("👥 Users in system:");
    users.forEach((user) => {
      console.log(`  - ${user.email} (ID: ${user._id})`);
    });
    console.log("");

    // List all projects
    const projects = await Project.find({});
    console.log("📁 Projects in system:");
    if (projects.length === 0) {
      console.log("  No projects found!");
    } else {
      projects.forEach((project) => {
        console.log(`  - ${project.name}`);
        console.log(`    ID: ${project._id}`);
        console.log(`    Owner: ${project.userId}`);
        console.log(`    Created: ${project.createdAt}`);
        console.log("");
      });
    }

    // Check the specific problematic project
    const problematicId = "689489c666c38ba47ca0460f";
    console.log(`🔍 Checking problematic project ID: ${problematicId}`);
    const problematicProject = await Project.findById(problematicId);
    if (problematicProject) {
      console.log("✅ Project found:");
      console.log(`  Name: ${problematicProject.name}`);
      console.log(`  Owner: ${problematicProject.userId}`);
      console.log(`  Description: ${problematicProject.description}`);
    } else {
      console.log("❌ Project not found in database");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

debugProjects();
