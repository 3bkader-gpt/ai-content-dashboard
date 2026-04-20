import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(clientDir, "..");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    cwd: monorepoRoot,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DEMO_MODE: "true",
      API_SECRET: "e2e-test-secret",
      CORS_ORIGIN: "http://localhost:5173",
      GEMINI_API_KEY: "",
      GEMINI_MODEL: "gemini-3-flash-preview",
      VITE_API_URL: "http://localhost:8787",
      VITE_DEMO_MODE: "true",
    },
  },
});
