import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import designSystem from "./eslint-rules/design-system.js";

export default tseslint.config(
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Classic react-hooks contract (matches the pre-v7 `recommended`).
      // eslint-plugin-react-hooks@7 also ships the React Compiler rule set
      // (set-state-in-effect, immutability, …) — opt in via
      // `reactHooks.configs.flat.recommended` once the flagged effects are
      // refactored.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Remaining `any` lives in form/hook and data-layer boundaries
      // (e.g. useTableFilters, admin-users create, dataProvider). Kept a
      // warning rather than an error.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Design-system boundary guard. Feature code (everything under `src` EXCEPT
  // the design system itself) must not hand-roll palette colors — status color
  // flows through the tone module. `src/components/ui/**` is the design system
  // and is exempt; it's where the palette legitimately lives.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    plugins: { "design-system": designSystem },
    rules: { "design-system/no-raw-palette": "error" },
  },
);
