const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["example.com"], // Add your image domains here
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1", // Add your API URL here
  },
};

module.exports = nextConfig;
