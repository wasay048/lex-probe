const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI = "mongodb://localhost:27017/cartel-detection-platform";

async function listUsers() {
  let client;
  try {
    console.log("👤 Listing users in database...");

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // List users
    console.log("\n👤 Users in database:");
    const users = await db.collection("users").find({}).toArray();
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${user._id}, Email: ${user.email}, Name: ${
          user.firstName
        } ${user.lastName}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

listUsers();
