/**
 * Playwright Configuration for E2E Tests
 *
 * This config is used for running E2E tests that verify the
 * headless CLI commands work correctly with Playwright.
 *
 * Usage:
 *   npx playwright test --config=e2e/playwright.config.ts
 *
 * Environment Variables:
 *   E2E_BASE_URL - Override the base URL (default: https://console.stage.redhat.com)
 *                  Set to https://stage.foo.redhat.com:1337 for local dev server testing
 *                  (HTTPS errors are ignored for self-signed certs)
 *
 * Global Setup:
 *   The globalSetup script warms the asset cache before any tests run.
 *   This downloads JS/CSS/fonts once and serves them from HAR cache.
 */

import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',

  /* Global setup - warms asset cache before all tests */
  globalSetup: require.resolve('./setup/global.setup.ts'),

  /* Storage state files are relative to this config file's directory (e2e/) */
  // Note: Tests using `test.use({ storageState: 'e2e/auth-admin.json' })` should
  // use paths relative to the project root, OR use __dirname for absolute paths.

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use - disable auto-open for local HTML reports */
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL,

    /* Ignore HTTPS errors (needed for local dev server with self-signed certs) */
    ignoreHTTPSErrors: true,

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
