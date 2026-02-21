/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force rebuild - clear stale turbopack cache
  env: {
    CACHE_BUST: "v3",
  },
}

export default nextConfig
