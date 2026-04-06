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
 *   npm run e2e:v1:orgadmin
 *
 *   # Run directly with Playwright:
 *   npx playwright test --project=v1-orgadmin --project=v1-userviewer
 *
 * Environment Variables:
 *   E2E_BASE_URL - Override the base URL (default: https://console.stage.redhat.com)
 *   E2E_PROXY - Optional proxy server URL (e.g., http://proxy.example.com:port)
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

  /* Asset cache warming runs in a dedicated cache-warmup setup project */

  /* Run tests in files in parallel locally, sequential in CI for stability */
  fullyParallel: !process.env.CI,

  /* CI: 1 worker (avoid OOM). Local: 4 workers to cut wall-clock time. */
  workers: process.env.CI ? 1 : 4,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* 1 local retry separates flaky from broken; CI gets 2 for extra stability */
  retries: process.env.CI ? 2 : 1,

  /* Reporter to use - list for CI, multiple for local dev */
  reporter: process.env.CI
    ? [['list'], ['json', { outputFile: './test-results/results.json' }]]
    : [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }], ['json', { outputFile: './test-results/results.json' }]],

  /* Shared settings for all projects */
  use: {
    baseURL,
    ignoreHTTPSErrors: true, // Always ignore - dev server uses self-signed certs
    actionTimeout: 30_000, // Bound stuck .click()/.fill() to 30s instead of global timeout
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Optional proxy support via environment variable
    ...(process.env.E2E_PROXY && { proxy: { server: process.env.E2E_PROXY } }),
  },

  /* Global timeout for each test */
  timeout: E2E_TIMEOUTS.TEST_GLOBAL,

  /* Expect timeout — explicit SLOW_DATA overrides on workspace assertions remain */
  expect: {
    timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
  },

  /* Configure projects with auth dependencies */
  projects: [
    // ═══════════════════════════════════════════════════════════════════════
    // V1 Auth Setup Projects
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'auth-v1-orgadmin',
      testMatch: /auth-v1-orgadmin\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },
    {
      name: 'auth-v1-userviewer',
      testMatch: /auth-v1-userviewer\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },
    {
      name: 'auth-v1-readonly',
      testMatch: /auth-v1-readonly\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Cache Warmup (depends on auth-v1-orgadmin — needs any valid session)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'cache-warmup',
      testMatch: /cache-warmup\.setup\.ts/,
      dependencies: ['auth-v1-orgadmin'],
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // V1 Test Projects (depend on auth + cache)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'v1-orgadmin',
      testMatch: 'journeys/v1/**/*.spec.ts',
      grep: /\[OrgAdmin\]/,
      dependencies: ['auth-v1-orgadmin', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-orgadmin.json'),
      },
    },
    {
      name: 'v1-userviewer',
      testMatch: 'journeys/v1/**/*.spec.ts',
      grep: /\[UserViewer\]/,
      dependencies: ['auth-v1-userviewer', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-userviewer.json'),
      },
    },
    {
      name: 'v1-readonly',
      testMatch: 'journeys/v1/**/*.spec.ts',
      grep: /\[ReadOnlyUser\]/,
      dependencies: ['auth-v1-readonly', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v1-readonly.json'),
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // V2 Auth Setup Projects
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'auth-v2-orgadmin',
      testMatch: /auth-v2-orgadmin\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },
    {
      name: 'auth-v2-userviewer',
      testMatch: /auth-v2-userviewer\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },
    {
      name: 'auth-v2-readonly',
      testMatch: /auth-v2-readonly\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },
    {
      name: 'auth-v2-rbacadmin',
      testMatch: /auth-v2-rbacadmin\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },
    {
      name: 'auth-v2-workspaceuser',
      testMatch: /auth-v2-workspaceuser\.setup\.ts/,
      timeout: 3 * E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // V2 Test Projects (depend on auth + cache)
    // ═══════════════════════════════════════════════════════════════════════
    {
      name: 'v2-orgadmin',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[OrgAdmin\]/,
      dependencies: ['auth-v2-orgadmin', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-orgadmin.json'),
      },
    },
    {
      name: 'v2-userviewer',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[UserViewer\]/,
      dependencies: ['auth-v2-userviewer', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-userviewer.json'),
      },
    },
    {
      name: 'v2-readonly',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[ReadOnlyUser\]/,
      dependencies: ['auth-v2-readonly', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-readonly.json'),
      },
    },
    {
      name: 'v2-rbacadmin',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[RbacAdmin\]/,
      dependencies: ['auth-v2-rbacadmin', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-rbacadmin.json'),
      },
    },
    {
      name: 'v2-workspaceuser',
      testMatch: 'journeys/v2/**/*.spec.ts',
      grep: /\[WorkspaceUser\]/,
      dependencies: ['auth-v2-workspaceuser', 'cache-warmup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'v2-workspaceuser.json'),
      },
    },
  ],
});
