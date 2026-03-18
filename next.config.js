/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Compiler for optimization (moved to top level in Next.js 16)
  reactCompiler: true,
  // Force rebuild to clear cache
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
