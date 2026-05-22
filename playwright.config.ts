import { defineConfig, devices } from "@playwright/test";

const refreshBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3101/abbatech/refresh";
const shouldStartRefresh = process.env.PLAYWRIGHT_START_REFRESH === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: refreshBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] }
    }
  ],
  webServer: shouldStartRefresh
    ? {
        command: "npm run dev -w @abbatech/refresh",
        reuseExistingServer: true,
        timeout: 120_000,
        url: refreshBaseUrl
      }
    : undefined
});
