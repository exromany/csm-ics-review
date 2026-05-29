/**
 * Application configuration — resolved once, used everywhere.
 *
 * Each value resolves through the same chain:
 *   1. `window.__APP_CONFIG__[key]` — injected at container start (Docker runtime,
 *      see `docker-entrypoint.sh`).
 *   2. `import.meta.env[key]`        — inlined by Vite at build time (local dev and
 *      the static GitHub Pages build).
 *   3. hard-coded default below.
 *
 * Because `config.js` is a classic (non-module) script, `window.__APP_CONFIG__` is
 * set before this module evaluates, so the resolved `appConfig` is correct on first
 * read. Defaults and type coercion live here only — call sites just read properties.
 */

type EnvKey = keyof ImportMetaEnv & `VITE_${string}`;

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<Record<EnvKey, string>>;
  }
}

function read(key: EnvKey): string | undefined {
  const runtime = window.__APP_CONFIG__?.[key];
  // Ignore unsubstituted placeholders (e.g. a value left as "${VITE_FOO}").
  if (runtime && !runtime.startsWith("${")) return runtime;

  const built = import.meta.env[key];
  return built ? String(built) : undefined;
}

export const appConfig = {
  apiBaseUrl: read("VITE_API_BASE_URL") ?? "http://localhost:3003",
  chainId: parseInt(read("VITE_CHAIN_ID") ?? "1", 10),
  walletConnectProjectId: read("VITE_WALLETCONNECT_PROJECT_ID"),
  appName: read("VITE_APP_NAME") ?? "CSM ICS Admin Panel",
  appVersion: read("VITE_APP_VERSION") ?? "0.1.0",
  siweDomain: read("VITE_SIWE_DOMAIN"),
  siweStatement: read("VITE_SIWE_STATEMENT") ?? "Sign in to CSM ICS Admin Panel",
  debugMode: read("VITE_DEBUG_MODE") === "true",
} as const;
