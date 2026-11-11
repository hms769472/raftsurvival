import { defineConfig, devices } from '@playwright/test';

// RAFT-606: a single end-to-end smoke test covering the critical run
// lifecycle (start → craft → save → load). It boots the real dev server so the
// canvas game renders exactly as it does locally.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    // `channel: 'chromium'` forces the full Chromium build instead of the
    // separate headless-shell download, so a single browser install is enough.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
