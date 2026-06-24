---
name: sync-api
description: Pull the OpenAPI spec from the running backend and regenerate the hey-api SDK (src/client). Use when the backend API changed, types/endpoints are stale, or after a backend deploy.
disable-model-invocation: true
---

# sync-api

Regenerates the fully-typed API client in `src/client/` from the backend's live
OpenAPI spec. `src/client/` is generated and committed — never hand-edited (a
PreToolUse hook enforces this).

## Steps

1. **Confirm the backend is up.** `openapi:pull` curls `http://localhost:3003/admin/api-json`.
   Verify it responds first:
   ```bash
   curl -fsS http://localhost:3003/admin/api-json >/dev/null && echo "backend OK" || echo "backend DOWN — start it before syncing"
   ```
   If it's down, stop and tell the user to start the backend (`VITE_API_BASE_URL`).

2. **Pull the spec, then regenerate:**
   ```bash
   pnpm openapi:pull && pnpm gen:api
   ```
   - `openapi:pull` → refreshes the committed `openapi.json` snapshot.
   - `gen:api` → runs `openapi-ts` (config in `openapi-ts.config.ts`), rewriting
     `src/client/` with `@hey-api/client-fetch` + `typescript` + `sdk` plugins.

3. **Review the diff.** Show the user what changed:
   ```bash
   git status --short openapi.json src/client && git --no-pager diff --stat openapi.json src/client
   ```

4. **Type-check** to surface any callsites broken by the new types:
   ```bash
   pnpm exec tsc --noEmit
   ```
   If the SDK shape changed, fix the consuming code (the runtime wiring lives in
   `src/providers/apiClient.ts`).

5. **Commit `openapi.json` and `src/client/` together** so the snapshot and the
   generated client never drift apart. Follow the repo's conventional-commit
   style, e.g. `chore: regenerate API SDK from updated spec`.

## Notes
- Builds/CI never hit the backend — they rely on the committed `openapi.json`.
- Don't edit `src/client/*` by hand; change `openapi-ts.config.ts` (generation
  options) or `openapi.json` (re-pull) instead.
