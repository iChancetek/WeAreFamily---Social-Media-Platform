import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Ignore build output & deps
  {
    ignores: ["lib/**", "node_modules/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.ts"],
    rules: {
      // Firebase / TS safety
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "off",

      // 🚫 Disable Next.js pages check (NOT a Next app)
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];