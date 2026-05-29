#!/bin/sh
set -e

# Regenerate the runtime config from the container environment on every start, so a
# single built image can be deployed to any environment without rebuilding.
#
# Only VITE_* variables are exposed to the browser — never leak server-side secrets
# into this client-readable file. Using `node` guarantees correct JSON/JS escaping.

CONFIG_FILE="${APP_CONFIG_FILE:-/app/refine/config.js}"

node -e '
  const cfg = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("VITE_") && value !== undefined) cfg[key] = value;
  }
  process.stdout.write("window.__APP_CONFIG__ = " + JSON.stringify(cfg) + ";\n");
' > "$CONFIG_FILE"

echo "Runtime config written to $CONFIG_FILE"

exec "$@"
