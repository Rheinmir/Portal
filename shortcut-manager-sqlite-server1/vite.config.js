import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.VITE_API_URL || "",
    ),
  },
  server: {
    proxy: {
      "/api": "http://localhost:5464",
      "/temp": "http://localhost:5464",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["lucide-react", "recharts"],
        },
      },
    },
  },
});
