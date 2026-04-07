import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** When `VITE_API_URL` is unset, the client uses relative `/api/*` URLs; this forwards them to the BFF in dev. */
const devApiTarget = process.env.VITE_DEV_API_PROXY ?? "http://localhost:8787";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: devApiTarget,
        changeOrigin: true,
      },
    },
  },
});
