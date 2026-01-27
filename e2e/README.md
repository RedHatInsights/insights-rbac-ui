# E2E Test Suite

This directory contains the Playwright E2E test suite for RBAC UI.

> **📚 Full Documentation**: For the complete testing strategy and architecture, see the [E2E Testing Strategy](https://master--687a10bbc18d4b17063770ba.chromatic.com/?path=/docs/documentation-e2e-testing-strategy--docs) in Storybook.

## Quick Start: One-Shot Commands

Run the entire E2E lifecycle (Auth → Seed → Test → Cleanup) with a single command:

```bash
# V1 Admin tests (full CRUD on User Access pages)
TEST_PREFIX=jdoe RBAC_USERNAME=your-admin RBAC_PASSWORD=secret npm run e2e:v1:admin

# V1 User tests (read-only verification)
TEST_PREFIX=jdoe RBAC_USERNAME=your-user RBAC_PASSWORD=secret npm run e2e:v1:user

# V2 Admin tests (full CRUD on Access Management pages)
TEST_PREFIX=jdoe RBAC_USERNAME=your-v2-admin RBAC_PASSWORD=secret npm run e2e:v2:admin

# V2 User tests (read-only verification)
TEST_PREFIX=jdoe RBAC_USERNAME=your-v2-user RBAC_PASSWORD=secret npm run e2e:v2:user
```

**What happens:**
1. **Auth** — Logs in and saves browser session state
2. **Seed** — Creates test data prefixed with `TEST_PREFIX`
   - V1 seeds roles and groups only (`seed-v1.json`)
   - V2 seeds roles, groups, and workspaces (`seed-v2.json`)
3. **Test** — Runs the specific test suite
4. **Cleanup** — Deletes all data matching `TEST_PREFIX`

### Prerequisites

- VPN connection to access stage environment
- Playwright browsers: `npx playwright install chromium`
- Node.js 20+

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_PREFIX` | Yes | Prefix for seeded data (min 4 chars, e.g., `jdoe`) |
| `RBAC_USERNAME` | Yes | Username for stage login |
| `RBAC_PASSWORD` | Yes | Password for stage login |
| `E2E_BASE_URL` | No | Override target URL (default: `https://console.stage.redhat.com`) |

**Testing against localhost:**

```bash
# Start local dev server in one terminal
npm run start

# Run tests against local in another terminal
E2E_BASE_URL=http://localhost:1337 TEST_PREFIX=jdoe npm run e2e:test:v1:admin
```

---

## Available Commands

### One-Shot (Recommended)

| Command | Description |
|---------|-------------|
| `npm run e2e:v1:admin` | Full lifecycle for V1 admin tests |
| `npm run e2e:v1:user` | Full lifecycle for V1 user tests |
| `npm run e2e:v2:admin` | Full lifecycle for V2 admin tests |
| `npm run e2e:v2:user` | Full lifecycle for V2 user tests |

### Primitives (For Debugging)

Run individual steps when troubleshooting:

| Command | Description |
|---------|-------------|
| `npm run e2e:auth:v1:admin` | Login as V1 admin |
| `npm run e2e:auth:v1:user` | Login as V1 user |
| `npm run e2e:auth:v2:admin` | Login as V2 admin |
| `npm run e2e:auth:v2:user` | Login as V2 user |
| `npm run e2e:seed:v1` | Seed V1 data: roles, groups (no workspaces) |
| `npm run e2e:seed:v2` | Seed V2 data: roles, groups, workspaces |
| `npm run e2e:cleanup` | Cleanup test data (requires `TEST_PREFIX`) |
| `npm run e2e:test:v1:admin` | Run only V1 admin specs |
| `npm run e2e:test:v1:user` | Run only V1 user specs |
| `npm run e2e:test:v2:admin` | Run only V2 admin specs |
| `npm run e2e:test:v2:user` | Run only V2 user specs |

---

## Manual Workflow (Debugging)

When you need more control, run steps individually:

```bash
# 1. Set environment (prefix must be at least 4 characters)
export TEST_PREFIX=jdoe
export RBAC_USERNAME=your-admin
export RBAC_PASSWORD=secret

# 2. Auth (once per session, or when expired)
npm run e2e:auth:v1:admin

# 3. Seed test data (use v1 or v2 based on which tests you're running)
npm run e2e:seed:v1   # For V1 tests (roles, groups)
# npm run e2e:seed:v2 # For V2 tests (roles, groups, workspaces)

# 4. Run tests (repeatedly while debugging)
npm run e2e:test:v1:admin

# Or run specific file
npx playwright test e2e/journeys/v1/roles/admin.spec.ts --headed

# 5. Cleanup when done
npm run e2e:cleanup
```

---

## Test Structure

```
e2e/
├── auth/                    # Auth storage state files (gitignored)
│   ├── v1-admin.json
│   ├── v1-user.json
│   ├── v2-admin.json
│   └── v2-user.json
├── fixtures/
│   ├── seed-v1.json        # V1 seed: roles, groups (no workspaces)
│   └── seed-v2.json        # V2 seed: roles, groups, workspaces
├── journeys/
│   ├── v1/                 # V1 (User Access) tests
│   │   ├── roles/
│   │   │   ├── admin.spec.ts
│   │   │   └── user.spec.ts
│   │   ├── groups/
│   │   └── users/
│   └── v2/                 # V2 (Access Management) tests
│       ├── roles/
│       ├── workspaces/
│       └── users-and-user-groups/
├── utils/                  # Shared test utilities
├── smoke.spec.ts          # Basic page load verification
└── playwright.config.ts   # Playwright configuration
```

---

## Performance: Asset Caching

The test suite uses **session-scoped HAR caching** to avoid re-downloading the heavy webpack bundles for every test.

### How It Works

1. **Global setup** (`e2e/setup/global.setup.ts`) runs once before any tests
2. Downloads all static assets (JS, CSS, fonts) to `e2e/cache/session-assets.har`
3. All tests call `setupPage(page)` which serves static assets from HAR cache
4. API requests (JSON) always go to the live server

### Usage in Tests

All spec files use `setupPage(page)` in their `beforeEach` hook:

```typescript
import { setupPage } from '../utils';

test.beforeEach(async ({ page }) => {
  await setupPage(page);  // Enables cache + blocks analytics
  await page.goto('/iam/user-access/roles');
  // Wait for actual content, not just containers
  await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
});
```

### Cache Behavior

- HAR file is **regenerated fresh** on each test run
- Uncached assets fall back to network (`notFound: 'fallback'`)
- Cache files are **gitignored** (never committed)

---

## Key Concepts

### TEST_PREFIX Safety Rail

All data-creating operations **require** `TEST_PREFIX` to prevent polluting the shared stage environment.

- **Minimum length**: 4 characters (e.g., `jdoe`, `ci-42`)
- **Forbidden values**: `test`, `dev`, `qa`, `ci`, `e2e` (too generic)

### Admin vs User Tests

- **`admin.spec.ts`** — Tests CRUD operations with full permissions
- **`user.spec.ts`** — Verifies read-only access, checks that "Create" buttons are hidden

### V1 vs V2

- **V1** — User Access pages (`/iam/user-access/*`)
- **V2** — Access Management pages (`/iam/access-management/*`)

---

## Debugging

### Seed Dry-Run

Preview what would be seeded without creating anything:

```bash
# Dry-run: authenticates and discovers system resources, but skips mutations
TEST_PREFIX=debug npm run cli -- seed --file e2e/fixtures/seed-v1.json --prefix "${TEST_PREFIX}" --dry-run
# Or for V2:
# TEST_PREFIX=debug npm run cli -- seed --file e2e/fixtures/seed-v2.json --prefix "${TEST_PREFIX}" --dry-run
```

**What dry-run does:**
- ✅ Authenticates to the API (validates credentials)
- ✅ Discovers system roles and groups (Phase 1)
- ❌ Skips resource creation (Phase 2 outputs curl commands instead)

This is useful for:
- Verifying seed data and credentials before running tests
- Checking what system resources are available
- Seeing the exact API calls that would be made

### Playwright Debugging

```bash
# Run with visible browser
npx playwright test e2e/journeys/v1/roles/admin.spec.ts --headed

# Step-through debugging
npx playwright test e2e/journeys/v1/roles/admin.spec.ts --debug

# Interactive UI mode
npx playwright test --ui

# View HTML report after run
npx playwright show-report
```
