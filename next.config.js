/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable React Compiler for optimization
  experimental: {
    reactCompiler: true,
  },
  // Configure Turbopack to use the correct root directory
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
