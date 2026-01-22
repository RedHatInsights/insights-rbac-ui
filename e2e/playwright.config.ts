/**
 * Playwright Configuration for E2E Tests
 *
 * This config is used for running E2E tests that verify the
 * headless CLI commands work correctly with Playwright.
 *
 * Usage:
 *   npx playwright test --config=e2e/playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',

  /* Global setup - login before all tests */
  // globalSetup: require.resolve('./global-setup'),

  /* Storage state files are relative to this config file's directory (e2e/) */
  // Note: Tests using `test.use({ storageState: 'e2e/auth-admin.json' })` should
  // use paths relative to the project root, OR use __dirname for absolute paths.

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'https://console.stage.redhat.com',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'on-first-retry',
  },

  /* Global timeout for each test */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting the tests (optional) */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
