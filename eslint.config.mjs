import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // scripts/ holds one-off content-migration tools that have already been run
  // against production data (translation passes, example generation, TTS
  // pregeneration). They ship with nothing and are kept for reference, so
  // leftover scaffolding — a helper that a later revision stopped calling, a
  // loosely typed API response — is expected rather than a defect. Everything
  // else still applies, so a genuine error there is not silenced.
  {
    files: ["scripts/**/*.mts", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
