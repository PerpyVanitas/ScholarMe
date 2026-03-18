/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Compiler for optimization (moved to top level in Next.js 16)
  reactCompiler: true,
  // Explicitly set Turbopack root to fix workspace inference
  turbopack: {
    root: '.',
  },
};

module.exports = nextConfig;
