// Fix Authentication - Run this in browser console on localhost:3001

// The correct JWT token with proper user ID
const CORRECT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOTYwYWYwZWMzNzQxOTQ1ZWQ0MjgiLCJlbWFpbCI6Indhc2F5aGF5ZWVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2Mzk5MzIsImV4cCI6MTc1NDcyNjMzMn0.lVZDVCm7pNK9QfeYp4Jb0_DS2KEvF-45KUTFPq7b370";

// Store the correct token in localStorage
localStorage.setItem("accessToken", CORRECT_TOKEN);

// Remove any old refresh token to force using the new access token
localStorage.removeItem("refreshToken");

// Show current storage state
console.log("🔑 Updated authentication tokens:");
console.log(
  "- Access Token:",
  localStorage.getItem("accessToken")?.substring(0, 50) + "..."
);
console.log("- Refresh Token:", localStorage.getItem("refreshToken") || "None");

// Refresh the page to apply the new token
console.log("🔄 Refreshing page to apply new authentication...");
window.location.reload();
