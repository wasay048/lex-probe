// Frontend Authentication Debug Script
// Open browser developer tools and run this in the console

console.log("🔍 Frontend Auth Debug");

// Check if tokens exist
const accessToken = localStorage.getItem("accessToken");
const refreshToken = localStorage.getItem("refreshToken");

console.log("📝 Access Token:", accessToken ? "Present" : "Missing");
console.log("📝 Refresh Token:", refreshToken ? "Present" : "Missing");

if (accessToken) {
  // Decode JWT token to check user info
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    console.log("👤 Token User ID:", payload.userId);
    console.log("📧 Token Email:", payload.email);
    console.log("⏰ Token Expires:", new Date(payload.exp * 1000));

    // Check if token is expired
    const now = Date.now() / 1000;
    if (payload.exp < now) {
      console.log("⚠️ Token is EXPIRED");
    } else {
      console.log("✅ Token is VALID");
    }
  } catch (e) {
    console.log("❌ Invalid token format");
  }
}

// Test dashboard API manually
if (accessToken) {
  fetch("http://localhost:5000/api/v1/dashboard/stats", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("📊 Dashboard API Response:", data);
    })
    .catch((error) => {
      console.log("❌ Dashboard API Error:", error);
    });
}
