/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable body size limit for API routes to handle large files
    // Note: Individual route handlers will still need to handle large files appropriately
  },
  // Increase body size limit for large file uploads
  serverRuntimeConfig: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
}

module.exports = nextConfig

