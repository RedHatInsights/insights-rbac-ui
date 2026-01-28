import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for insights-rbac-ui E2E tests
 * Designed to work both locally and in the Konflux E2E pipeline
 */
export default defineConfig({
  // Test directory
  testDir: './playwright',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially for now
  forbidOnly: !!process.env.CI, // Fail CI if test.only is left in
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : 1, // Run one test at a time

  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github' as const]] : []),
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests - can be overridden by environment variable
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://stage.foo.redhat.com:1337',

    // Collect trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (needed for stage environment)
    ignoreHTTPSErrors: true,
  },

  // Projects configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration (optional - for local development)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'https://stage.foo.redhat.com:1337',
  //   reuseExistingServer: !process.env.CI,
  //   ignoreHTTPSErrors: true,
  //   timeout: 120 * 1000,
  // },
});
