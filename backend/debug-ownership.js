const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI = "mongodb://localhost:27017/cartel-detection-platform";
const PROJECT_ID = "68949325a63c0c5b2c38818e";
const SEARCH_ID = "68949b21f788da2534b312a7";
const JWT_USER_ID = "6883960af0ec374194ed428"; // From JWT token (shorter)
const DB_USER_ID = "6883960af0ec3741945ed428"; // Actual user ID in DB (longer)

async function debugOwnership() {
  let client;
  try {
    console.log("🔍 Debugging ownership issue...");
    console.log("📁 Project ID:", PROJECT_ID);
    console.log("🔍 Search ID:", SEARCH_ID);
    console.log("👤 JWT User ID:", JWT_USER_ID);
    console.log("👤 DB User ID:", DB_USER_ID);

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // Check project ownership with ObjectId
    console.log("\n📁 Checking project with ObjectId...");
    let project;
    try {
      project = await db
        .collection("projects")
        .findOne({ _id: new ObjectId(PROJECT_ID) });
    } catch (err) {
      console.log("Failed with ObjectId, trying string...");
      project = await db.collection("projects").findOne({ _id: PROJECT_ID });
    }

    if (project) {
      console.log("✅ Project found:", project.name);
      console.log("👤 Project owner:", project.userId);
      console.log("🔢 Project owner type:", typeof project.userId);
      console.log(
        "🔒 Ownership match with JWT (===):",
        project.userId === JWT_USER_ID
      );
      console.log(
        "🔒 Ownership match with JWT (string):",
        String(project.userId) === String(JWT_USER_ID)
      );
      console.log(
        "🔒 Ownership match with DB user (===):",
        project.userId === DB_USER_ID
      );
      console.log(
        "🔒 Ownership match with DB user (string):",
        String(project.userId) === String(DB_USER_ID)
      );
    } else {
      console.log("❌ Project not found");
    }

    // Check search ownership with ObjectId
    console.log("\n🔍 Checking search with ObjectId...");
    let search;
    try {
      search = await db
        .collection("searches")
        .findOne({ _id: new ObjectId(SEARCH_ID) });
    } catch (err) {
      console.log("Failed with ObjectId, trying string...");
      search = await db.collection("searches").findOne({ _id: SEARCH_ID });
    }

    if (search) {
      console.log("✅ Search found");
      console.log("👤 Search owner:", search.userId);
      console.log("🔢 Search owner type:", typeof search.userId);
      console.log(
        "🔒 Ownership match with JWT (===):",
        search.userId === JWT_USER_ID
      );
      console.log(
        "🔒 Ownership match with JWT (string):",
        String(search.userId) === String(JWT_USER_ID)
      );
      console.log(
        "🔒 Ownership match with DB user (===):",
        search.userId === DB_USER_ID
      );
      console.log(
        "🔒 Ownership match with DB user (string):",
        String(search.userId) === String(DB_USER_ID)
      );
    } else {
      console.log("❌ Search not found");
    }

    // Check existing searches in project
    console.log("\n🔗 Project's existing searches:");
    if (project && project.searchIds) {
      console.log("📋 SearchIds array:", project.searchIds);
      console.log("📋 Array length:", project.searchIds.length);
      console.log("🔍 Contains search?", project.searchIds.includes(SEARCH_ID));
      console.log(
        "🔍 Contains search (string)?",
        project.searchIds.map(String).includes(String(SEARCH_ID))
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

debugOwnership();
