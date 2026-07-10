import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The API base URL defaults to the backend service. In dev, requests to the
// (base-prefixed) /api path are proxied to the FastAPI backend so the frontend
// can use relative URLs.
const API_TARGET = process.env.VITE_API_TARGET || "http://localhost:8000";

// BASE_PATH is the URL prefix the app is served under. It is "/" for the
// standalone Docker build and something like "/pulseboard/" when served behind
// Replit's path-based reverse proxy. Vite requires it to end with a slash.
const BASE_PATH = process.env.BASE_PATH || "/";
const PREFIX = BASE_PATH.replace(/\/$/, ""); // "" or "/pulseboard"

// Requests from the browser are prefixed with BASE_PATH (e.g.
// "/pulseboard/api/..."), so the proxy key must include that prefix and the
// rewrite strips it back to "/api/..." for the backend.
const apiProxyKey = `${PREFIX}/api`;

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    allowedHosts: true,
    proxy: {
      [apiProxyKey]: {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) =>
          PREFIX ? path.replace(new RegExp(`^${PREFIX}`), "") : path,
      },
    },
  },
});
