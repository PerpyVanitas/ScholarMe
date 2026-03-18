/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Compiler for optimization
  reactCompiler: true,
  // Use webpack instead of Turbopack to clear build cache issues
  experimental: {
    turbopack: false,
  },
};

module.exports = nextConfig;
