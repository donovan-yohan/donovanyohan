// @ts-check
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  {
    ignores: [
      ".git/**",
      ".next/**",
      ".next-leak-test/**",
      ".claude/**",
      ".worktrees/**",
      "out/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
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
  // never directly from adapter-local or adapter-github (Slice 1 rule per AGENTS.md).
  //
  // Two rules on purpose. `no-restricted-imports` is the primary gate: it is a
  // core ESLint rule that matches the import specifier as text, so it cannot be
  // silently disabled by a broken or missing import resolver.
  // `import/no-restricted-paths` is kept as defense in depth because it matches
  // the *resolved* file.
  //
  // NOTE: the `from` paths below MUST carry the `.ts` extension. The rule
  // compares against the resolved module path (`lib/vault/adapter-local.ts`); an
  // extensionless `from` never matches and the rule silently passes everything.
  {
    files: ["pages/**/*.{ts,tsx}"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/vault/adapter-*", "@/lib/vault/adapter-*"],
              message:
                "Public pages must import vault API from 'lib/vault/index', not directly from an adapter.",
            },
          ],
        },
      ],
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
