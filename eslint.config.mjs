// @ts-check
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  {
    ignores: [".git/**", ".next/**", "out/**", "coverage/**", "node_modules/**", "next-env.d.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  // Vault adapter privacy boundary: pages must import from lib/vault/index,
  // never directly from adapter-local or adapter-github (AGENTS.md load-bearing rule).
  // The import-plugin needs a resolver to compare imports against the `from`
  // path; we use the node resolver (built into eslint-plugin-import) and ask
  // it to recognize TS extensions so `import "../../lib/vault/adapter-local"`
  // resolves to the .ts file on disk.
  {
    files: ["pages/**/*.{ts,tsx}"],
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
        },
      },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./pages",
              from: "./lib/vault/adapter-local.ts",
              message:
                "Public pages must import vault API from 'lib/vault/index', not directly from adapter-local.",
            },
            {
              target: "./pages",
              from: "./lib/vault/adapter-github.ts",
              message:
                "Public pages must import vault API from 'lib/vault/index', not directly from adapter-github.",
            },
          ],
        },
      ],
    },
  },
);
