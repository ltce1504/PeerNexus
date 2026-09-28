import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("firebase")) return "firebase";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/")) return "react";
          return "vendor";
        },
      },
    },
  },
  server: { proxy: { "/api": "http://localhost:4000" } },
});
