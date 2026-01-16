import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
  },
  webServer: {
    command: "npm run dev --workspace apps/web",
    port: 3000,
    reuseExistingServer: true,
    env: {
      NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000"
    }
  }
});
