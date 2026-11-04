import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Same-origin API calls in dev: /api -> backend
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: false,
      },
      // Live updates (Socket.io) go to the same backend.
      "/socket.io": {
        target: "http://localhost:8000",
        changeOrigin: false,
        ws: true,
      },
    },
  },
});
