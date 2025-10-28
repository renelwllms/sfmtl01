import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow 'any' type - convert errors to warnings
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow unused variables - convert errors to warnings
      "@typescript-eslint/no-unused-vars": "warn",

      // Allow HTML entities without escaping - convert errors to warnings
      "react/no-unescaped-entities": "warn",

      // Allow HTML links for internal navigation - convert errors to warnings
      "@next/next/no-html-link-for-pages": "warn",

      // Allow img tags - convert errors to warnings
      "@next/next/no-img-element": "warn",

      // Allow missing hook dependencies - convert errors to warnings
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
