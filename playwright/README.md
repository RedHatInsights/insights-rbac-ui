# Playwright E2E Tests

This directory contains end-to-end tests for insights-rbac-ui using Playwright.

## Running Tests Locally

### Prerequisites

- Node.js 22+ installed
- Dependencies installed: `npm install`
- Access to the stage environment

### Run All Tests

```bash
npm run test:playwright
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Specific Test File

```bash
npx playwright test smoke.spec.ts
```

### Debug Tests

```bash
npx playwright test --debug
```

## Test Structure

- `smoke.spec.ts` - Basic smoke tests to verify the app loads and navigation works
- More test files can be added here for specific features

## Configuration

Tests are configured in `playwright.config.ts` at the repository root.

### Environment Variables

- `PLAYWRIGHT_BASE_URL` - Override the base URL (default: https://stage.foo.redhat.com:1337)
- `E2E_USER` - Test user credentials (used in pipeline)
- `E2E_PASSWORD` - Test user password (used in pipeline)

## CI/CD Pipeline

These tests run automatically in the Konflux E2E pipeline on every pull request.

The pipeline:
1. Builds the application container image
2. Starts the app, chrome, and proxy sidecars
3. Runs Playwright tests against the running application
4. Reports results back to the PR

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in this directory
2. Use descriptive test names
3. Follow the existing patterns for page navigation and assertions
4. Ensure tests are idempotent and can run in any order
5. Clean up any test data created during the test

## Debugging Tips

- Use `await page.pause()` to pause execution and inspect the page
- Screenshots are automatically captured on failure
- Video recordings are saved for failed tests
- Use `--headed` flag to see the browser: `npx playwright test --headed`

## Authentication

In the pipeline, authentication is handled by the test infrastructure which:
- Logs in using the E2E_USER credentials
- Maintains session state across tests
- Handles RedHat SSO authentication automatically

For local testing, you may need to log in manually or set up authentication state.
