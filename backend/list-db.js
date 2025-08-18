const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI = "mongodb://localhost:27017/cartel-detection-platform";

async function listData() {
  let client;
  try {
    console.log("🔍 Listing database contents...");

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // List projects with detailed information
    console.log("\n📁 Projects in database with search details:");
    const projects = await db
      .collection("projects")
      .find({})
      .limit(10)
      .toArray();
    projects.forEach((project, index) => {
      console.log(
        `${index + 1}. ID: ${project._id}, Name: "${project.name}", Owner: ${
          project.userId
        }`
      );
      console.log(`   📋 SearchIds: [${project.searchIds ? project.searchIds.join(', ') : 'None'}]`);
      console.log(`   📊 Search Count: ${project.searchIds ? project.searchIds.length : 0}`);
    });

    // List searches
    console.log("\n🔍 Searches in database:");
    const searches = await db
      .collection("searches")
      .find({})
      .limit(5)
      .toArray();
    searches.forEach((search, index) => {
      console.log(`${index + 1}. ID: ${search._id}, Owner: ${search.userId}`);
    });

    console.log("\n👤 Looking for user:", "6883960af0ec374194ed428");
    const userProjects = await db
      .collection("projects")
      .find({ userId: "6883960af0ec374194ed428" })
      .toArray();
    console.log(`Found ${userProjects.length} projects for this user:`);
    userProjects.forEach((project) => {
      console.log(`- ${project._id}: ${project.name}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

listData();
