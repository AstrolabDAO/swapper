import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import";
import noOnlyTests from "eslint-plugin-no-only-tests";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
        ecmaVersion: 2020,
        sourceType: "module",
        allowDefaultProject: true,
        allowNonTsExtensions: true,
      },
      globals: {
        node: true,
        mocha: true,
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        performance: "readonly",
        setTimeout: "readonly",
        Buffer: "readonly",
      },
    },
    files: ["**/*.ts"],
    plugins: {
      import: importPlugin,
      "no-only-tests": noOnlyTests,
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "no-only-tests/no-only-tests": "error",
    },
  },
  // Special configuration for tests and index.ts
  {
    files: ["tests/**/*.ts", "index.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
      }
    },
    rules: {
      // Relax rules for test files
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  prettier,
  {
    ignores: [
      "scripts/**",
      "dist/**",
      "**/dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "artifacts/**",
      "coverage/**",
      "**/*.d.ts",
    ],
  },
];
