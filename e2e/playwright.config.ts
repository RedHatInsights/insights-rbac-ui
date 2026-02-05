/**
 * Playwright Configuration for E2E Tests
 *
 * Auth Strategy:
 *   Each persona has an auth setup project that runs the CLI login command.
 *   Test projects depend on their auth setup, ensuring fresh tokens.
 *
 * Usage:
 *   # Run all V1 tests (all personas in one run, results preserved):
 *   npm run e2e:v1
 *
 *   # Run specific persona:
 *   npm run e2e:v1:admin
 *
 *   # Run directly with Playwright:
 *   npx playwright test --project=v1-admin --project=v1-userviewer
 *
 * Environment Variables:
 *   E2E_BASE_URL - Override the base URL (default: https://console.stage.redhat.com)
 *   TEST_PREFIX_V1 - Prefix for V1 test data isolation (required for V1 CRUD tests)
 *   TEST_PREFIX_V2 - Prefix for V2 test data isolation (required for V2 CRUD tests)
 *   TEST_VERSION - Set by npm scripts to indicate which version is running (v1 or v2)
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { E2E_TIMEOUTS } from './utils/timeouts';

const baseURL = process.env.E2E_BASE_URL || 'https://console.stage.redhat.com';

// Auth file paths
const authDir = path.join(__dirname, 'auth');

export default defineConfig({
  testDir: '.',

  /* Output directory for screenshots, traces, etc. */
  outputDir: './test-results',

  /* Asset cache warming is done in auth-v1-admin.setup.ts (first auth to run) */

  /* Run tests in files in parallel locally, sequential in CI for stability */
  fullyParallel: !process.env.CI,

  /* Single worker in CI to avoid OOM and scrambled output */
  workers: process.env.CI ? 1 : undefined,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* No retries - fail fast */
  retries: 0,

  /* Reporter to use - list for CI, multiple for local dev */
  reporter: process.env.CI
    ? 'list'
    : [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }], ['json', { outputFile: './test-results/results.json' }]],

  /* Shared settings for all projects */
  use: {
    baseURL,
    ignoreHTTPSErrors: true, // Always ignore - dev server uses self-signed certs
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  /* Global timeout for each test */
  timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD,

  /* Expect timeout */
  expect: {
    timeout: E2E_TIMEOUTS.SLOW_DATA,
  },

  /* Configure projects with auth dependencies */
  projects: [
    // ═══════════════════════════════════════════════════════════════════════
    // V1 Auth Setup Projects
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'auth-v1-admin',
      testMatch: /auth-v1-admin\.setup\.ts/,
    },
    {
      name: 'auth-v1-userviewer',
      testMatch: /auth-v1-userviewer\.setup\.ts/,
    },
    {
      name: 'auth-v1-readonly',
      testMatch: /auth-v1-readonly\.setup\.ts/,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // V1 Test Projects (depend on auth)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'v1-admin',
      testMatch: 'journeys/v1/**/*.spec.ts',
      grep: /\[Admin\]/,
      dependencies: ['auth-v1-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-admin.json'),
      },
    },
    {
      name: 'v1-userviewer',
      testMatch: 'journeys/v1/**/*.spec.ts',
      grep: /\[UserViewer\]/,
      dependencies: ['auth-v1-userviewer'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-userviewer.json'),
      },
    },
    {
      name: 'v1-readonly',
      testMatch: 'journeys/v1/**/*.spec.ts',
      grep: /\[ReadOnlyUser\]/,
      dependencies: ['auth-v1-readonly'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-readonly.json'),
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // V2 Auth Setup Projects
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'auth-v2-admin',
      testMatch: /auth-v2-admin\.setup\.ts/,
    },
    {
      name: 'auth-v2-userviewer',
      testMatch: /auth-v2-userviewer\.setup\.ts/,
    },
    {
      name: 'auth-v2-readonly',
      testMatch: /auth-v2-readonly\.setup\.ts/,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // V2 Test Projects (depend on auth)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'v2-admin',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[Admin\]/,
      dependencies: ['auth-v2-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-admin.json'),
      },
    },
    {
      name: 'v2-userviewer',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[UserViewer\]/,
      dependencies: ['auth-v2-userviewer'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-userviewer.json'),
      },
    },
    {
      name: 'v2-readonly',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[ReadOnlyUser\]/,
      dependencies: ['auth-v2-readonly'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-readonly.json'),
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Utility Projects
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'smoke',
      testMatch: 'smoke.spec.ts',
      dependencies: ['auth-v1-admin'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-admin.json'),
      },
    },
  ],
});
