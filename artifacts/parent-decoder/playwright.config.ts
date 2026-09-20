import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'browser-regression.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:4174',
  },
  fullyParallel: false,
  timeout: 20_000,
  expect: {
    timeout: 5_000,
  },
  reporter: process.env.CI ? 'line' : 'list',
  webServer: {
    command: 'PORT=4174 BASE_PATH=/ pnpm run dev',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});