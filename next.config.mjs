/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: "/vercel/share/v0-next-shadcn",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    CACHE_BUST: "v12",
  },
};

export default nextConfig;
