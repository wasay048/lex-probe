const puppeteer = require("puppeteer");

async function testProjectDetail() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ["--disable-web-security", "--disable-features=VizDisplayCompositor"],
  });

  const page = await browser.newPage();

  // Listen to console messages
  page.on("console", (msg) => {
    console.log("🌐 Browser:", msg.text());
  });

  try {
    console.log("📱 Navigating to frontend...");
    await page.goto("http://localhost:3001", { waitUntil: "networkidle2" });

    console.log("🔐 Looking for login form...");
    // We'll need to login first if there's auth
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: "frontend-state.png", fullPage: true });
    console.log("📷 Screenshot saved as frontend-state.png");

    // Check if we can directly access the project page
    const projectId = "689489c666c38ba47ca0460f"; // The project ID we know exists
    console.log(`🎯 Attempting to navigate directly to project: ${projectId}`);

    await page.goto(`http://localhost:3001/dashboard/projects/${projectId}`, {
      waitUntil: "networkidle2",
    });

    // Wait a bit to see console logs
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Take another screenshot
    await page.screenshot({ path: "project-detail-state.png", fullPage: true });
    console.log(
      "📷 Project detail screenshot saved as project-detail-state.png"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  // Keep browser open for manual inspection
  console.log("🔍 Browser will stay open for manual inspection...");
  // await browser.close();
}

testProjectDetail();
