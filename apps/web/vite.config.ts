import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
