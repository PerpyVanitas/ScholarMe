import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  globalIgnores([
    ".next/**",
    "android/**",
    "backend/**",
    "mobile/**",
    "node_modules/**",
    "scratch/**",
    "scripts/**",
    "tests/**",
    "public/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  ...nextVitals,
  ...nextTypescript,
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off"
    },
  },
];
