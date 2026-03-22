import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@tryangletree/tat/browser",
        replacement: fileURLToPath(
          new URL("../tat/browser.ts", import.meta.url),
        ),
      },
      {
        find: "@tryangletree/tat",
        replacement: fileURLToPath(
          new URL("../tat/browser.ts", import.meta.url),
        ),
      },
    ],
  },
  plugins: [react()],
});
