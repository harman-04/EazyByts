// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Add this define configuration to polyfill 'global' for browser environments
  define: {
    global: "window", // Maps `global` to `window`
  },
  // ------------------------------------------
  // ADD THIS 'server' OBJECT WITH 'proxy' CONFIGURATION BELOW
  // ------------------------------------------
  server: {
    port: 5173, // This is your frontend development server port
    proxy: {
      // Proxy for your REST API endpoints (e.g., /api/messages/public, /api/messages/private)
      "/api": {
        target: "http://localhost:8081", // <--- IMPORTANT: Make sure this matches your Spring Boot backend URL and port
        changeOrigin: true, // Necessary for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, "/api"), // Keeps '/api' in the path when forwarding to backend
      },
      // Proxy for your WebSocket (STOMP) connection
      // Make sure '/websocket' matches the base path you configured in your Spring Boot WebSocketConfig
      "/websocket": {
        // This is a common path for STOMP. Adjust if yours is different (e.g., '/ws')
        target: "ws://localhost:8081", // <--- IMPORTANT: Make sure this matches your Spring Boot backend WebSocket URL and port
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
      },
      // If you have other paths like '/stomp-endpoint' etc., add them here too:
      // '/stomp-endpoint': {
      //   target: 'ws://localhost:8081',
      //   ws: true,
      //   changeOrigin: true,
      // },
    },
  },
});
