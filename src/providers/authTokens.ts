/**
 * localStorage keys for the admin session.
 *
 * Shared by `authProvider` (reads/writes the session) and `apiClient` (reads
 * the token to authorize requests). Kept in its own leaf module so those two
 * don't import each other and create a cycle.
 */
export const TOKEN_KEY = "admin-jwt-token";
export const ADMIN_DATA_KEY = "admin-data";
