// Runtime configuration placeholder.
//
// In local development this stays empty and the app falls back to `import.meta.env`
// (the values from your `.env` file, inlined by Vite).
//
// In Docker, `docker-entrypoint.sh` OVERWRITES this file at container start with the
// real environment variables, so a single built image can serve any environment.
window.__APP_CONFIG__ = {};
