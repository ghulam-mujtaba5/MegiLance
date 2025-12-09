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
    ignores: ["node_modules/", ".next/", "out/", "build/", "**/*.js"],
  },
  {
    rules: {
      // @AI-HINT: The 'style' prop is used for dynamic theming with CSS custom properties.
      // This is a deliberate architectural choice, so we disable the rule that forbids it.
      "@next/next/no-inline-styles": "off",
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      // Allow any type in specific cases (migration in progress)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
