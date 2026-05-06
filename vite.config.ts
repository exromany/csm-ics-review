import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  oxc: {
    target: 'es2022',
  },
  optimizeDeps: {
    exclude: ['@base-org/account'],
  },
  build: {
    target: 'es2022',
  },
});
