/**
 * Runtime wiring for the generated hey-api client.
 *
 * Every SDK function in `src/client/sdk.gen.ts` shares a single `client`
 * singleton. Importing this module (for its side effect) configures that
 * singleton — base URL + bearer auth — before any request goes out.
 *
 * Auth is declarative: each admin operation carries `security: bearer` in the
 * spec, so hey-api invokes the `auth` callback per request and injects the
 * `Authorization` header itself. No manual header plumbing.
 */
import type { HttpError } from "@refinedev/core";
import { client } from "@/client/client.gen";
import { appConfig } from "@/config/env";
import { TOKEN_KEY } from "./authTokens";

client.setConfig({
  baseUrl: appConfig.apiBaseUrl,
  auth: () => localStorage.getItem(TOKEN_KEY) ?? undefined,
});

/** The fields-style result every SDK call resolves to (throwOnError: false). */
type SdkResult<T> = {
  data?: T;
  error?: unknown;
  response?: Response;
};

/**
 * Adapts a hey-api result into the throw-on-failure contract Refine expects.
 *
 * On failure it throws an error carrying both `statusCode` (Refine's
 * `HttpError`) and `status` — the latter is what `authProvider.onError`
 * inspects to trigger 401/403 auto-logout.
 */
export async function unwrap<T>(call: Promise<SdkResult<T>>): Promise<NonNullable<T>> {
  const { data, error, response } = await call;

  if (!response?.ok) {
    const message =
      (error as { message?: string } | undefined)?.message ??
      `HTTP Error: ${response?.status ?? "network error"}`;
    const status = response?.status ?? 0;
    const httpError: HttpError & { status: number } = {
      message,
      statusCode: status,
      status,
    };
    throw httpError;
  }

  return data as NonNullable<T>;
}

export { client };
