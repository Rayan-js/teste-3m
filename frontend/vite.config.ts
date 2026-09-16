import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 127.0.0.1 e não localhost: o Node resolve para IPv6 e o uvicorn escuta em IPv4
      "/api": "http://127.0.0.1:8000",
    },
  },
});
