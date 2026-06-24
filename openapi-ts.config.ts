import { defineConfig } from "@hey-api/openapi-ts";

// Generates a fully-typed client + types from the committed `openapi.json`
// snapshot. Re-pull the spec with `pnpm openapi:pull` (needs the backend
// running), then regenerate with `pnpm gen:api`.
//
// The generated output lands in `src/client/` and is committed, so builds and
// CI never depend on a running backend. The client runtime (baseUrl + auth) is
// wired in `src/providers/apiClient.ts`; do not edit `src/client/*` by hand.
export default defineConfig({
  input: "./openapi.json",
  output: "./src/client",
  plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
});
