import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    exclude: ["node_modules", "e2e"],
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70,
      },
      exclude: [
        "node_modules/**",
        ".next/**",
        "components/**",
        "app/dashboard/**/components/**",
        "app/dashboard/**/page.tsx",
        "app/dashboard/**/layout.tsx",
        "features/**/components/**",
        "features/**/hooks/**",
        "**/*.d.ts",
        "*.config.js",
        "*.config.ts",
        "*.config.mjs",
      ]
    }
  },
});
