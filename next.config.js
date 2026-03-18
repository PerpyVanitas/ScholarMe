/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable React Compiler for optimization (moved to top level in Next.js 16)
  reactCompiler: true,
  // Fix Turbopack root path inference
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
