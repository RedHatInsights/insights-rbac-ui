# E2E Test Suite

This directory contains the Playwright E2E test suite for RBAC UI.

> **📚 Full Documentation**: For the complete testing strategy and architecture, see the [E2E Testing Strategy](https://master--687a10bbc18d4b17063770ba.chromatic.com/?path=/docs/documentation-e2e-testing-strategy--docs) in Storybook.

## Quick Start

### 1. Setup Credentials (One-Time)

Copy the template env files and fill in your credentials:

```bash
# Copy templates for all personas
cp e2e/auth/.env.v1-admin.template e2e/auth/.env.v1-admin
cp e2e/auth/.env.v1-user.template e2e/auth/.env.v1-user
cp e2e/auth/.env.v1-useradmin.template e2e/auth/.env.v1-useradmin
cp e2e/auth/.env.v1-userviewer.template e2e/auth/.env.v1-userviewer
cp e2e/auth/.env.v2-admin.template e2e/auth/.env.v2-admin
cp e2e/auth/.env.v2-user.template e2e/auth/.env.v2-user
cp e2e/auth/.env.v2-useradmin.template e2e/auth/.env.v2-useradmin
cp e2e/auth/.env.v2-userviewer.template e2e/auth/.env.v2-userviewer

# Edit each file with your credentials
# RBAC_USERNAME=your-user@redhat.com
# RBAC_PASSWORD=your-password
```

### 2. Run Tests (One-Shot Commands)

Run the entire E2E lifecycle (Auth → Seed → Test → Cleanup) with a single command:

```bash
# V1 Admin tests (full CRUD on User Access pages)
TEST_PREFIX=jdoe npm run e2e:v1:admin

# V1 User tests (read-only verification)
TEST_PREFIX=jdoe npm run e2e:v1:user

# V2 Admin tests (full CRUD on Access Management pages)
TEST_PREFIX=jdoe npm run e2e:v2:admin

# V2 User tests (read-only verification)
TEST_PREFIX=jdoe npm run e2e:v2:user
```

> **Note**: Credentials are loaded from `e2e/auth/.env.*` files via `dotenv-cli`.

**What happens:**
1. **Seed** — Creates test data prefixed with `TEST_PREFIX` (uses API auth)
   - V1 seeds roles and groups only (`seed-v1.json`)
   - V2 seeds roles, groups, and workspaces (`seed-v2.json`)
2. **Auth** — Logs in via browser and saves session state for Playwright
3. **Test** — Runs the specific test suite using saved browser session
4. **Cleanup** — Deletes all data matching `TEST_PREFIX`

### Prerequisites

- VPN connection to access stage environment
- Playwright browsers: `npx playwright install chromium`
- Node.js 20+

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_PREFIX` | Yes | Prefix for seeded data (min 4 chars, e.g., `jdoe`) |
| `E2E_BASE_URL` | No | Override target URL (default: `https://console.stage.redhat.com`) |

Credentials (`RBAC_USERNAME`, `RBAC_PASSWORD`) are loaded from env files in `e2e/auth/`.

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
| `npm run e2e:v1:admin` | Full lifecycle for V1 admin tests (seed → auth → test → cleanup) |
| `npm run e2e:v1:user` | Full lifecycle for V1 user tests |
| `npm run e2e:v1:useradmin` | Auth + test for V1 User Access Administrator |
| `npm run e2e:v1:userviewer` | Auth + test for V1 User Viewer |
| `npm run e2e:v2:admin` | Full lifecycle for V2 admin tests |
| `npm run e2e:v2:user` | Full lifecycle for V2 user tests |
| `npm run e2e:v2:useradmin` | Auth + test for V2 User Access Administrator |
| `npm run e2e:v2:userviewer` | Auth + test for V2 User Viewer |

> **Note**: `useradmin` and `userviewer` commands don't include seed/cleanup because they
> use the existing seeded data from admin tests.

### Primitives (For Debugging)

Run individual steps when troubleshooting. Credentials are loaded from `e2e/auth/.env.*` files:

| Command | Description |
|---------|-------------|
| `npm run e2e:auth:v1:admin` | Login as V1 admin |
| `npm run e2e:auth:v1:user` | Login as V1 user |
| `npm run e2e:auth:v1:useradmin` | Login as V1 User Access Administrator |
| `npm run e2e:auth:v1:userviewer` | Login as V1 User Viewer |
| `npm run e2e:auth:v2:admin` | Login as V2 admin |
| `npm run e2e:auth:v2:user` | Login as V2 user |
| `npm run e2e:auth:v2:useradmin` | Login as V2 User Access Administrator |
| `npm run e2e:auth:v2:userviewer` | Login as V2 User Viewer |
| `npm run e2e:seed:v1:admin` | Seed V1 data as admin |
| `npm run e2e:seed:v2:admin` | Seed V2 data as admin |
| `npm run e2e:cleanup:v1:admin` | Cleanup as V1 admin |
| `npm run e2e:cleanup:v2:admin` | Cleanup as V2 admin |
| `npm run e2e:test:v1:admin` | Run only V1 admin specs |
| `npm run e2e:test:v1:user` | Run only V1 user specs |
| `npm run e2e:test:v1:useradmin` | Run only V1 User Admin specs |
| `npm run e2e:test:v1:userviewer` | Run only V1 User Viewer specs |
| `npm run e2e:test:v2:admin` | Run only V2 admin specs |
| `npm run e2e:test:v2:user` | Run only V2 user specs |
| `npm run e2e:test:v2:useradmin` | Run only V2 User Admin specs |
| `npm run e2e:test:v2:userviewer` | Run only V2 User Viewer specs |

---

## Manual Workflow (Debugging)

When you need more control, run steps individually:

```bash
# 1. Set environment (prefix must be at least 4 characters)
export TEST_PREFIX=jdoe

# 2. Seed test data (uses API auth internally)
npm run e2e:seed:v1:admin

# 3. Auth (saves browser session for Playwright)
npm run e2e:auth:v1:admin

# 4. Run tests (repeatedly while debugging)
npm run e2e:test:v1:admin

# Or run specific file
npx playwright test e2e/journeys/v1/roles/admin.spec.ts --headed

# 5. Cleanup when done
npm run e2e:cleanup:v1:admin
```

---

## Test Structure

```
e2e/
├── auth/                    # Auth storage state files (gitignored)
│   ├── v1-admin.json        # Org Admin
│   ├── v1-user.json         # Regular user
│   ├── v1-useradmin.json    # User Access Administrator (rbac:*:*)
│   ├── v1-userviewer.json   # User Viewer (read-only)
│   ├── v2-admin.json        # Org Admin (Preview mode)
│   ├── v2-user.json         # Regular user (Preview mode)
│   ├── v2-useradmin.json    # User Access Administrator (Preview mode)
│   └── v2-userviewer.json   # User Viewer (Preview mode)
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

### Test Personas

The E2E suite supports 8 different user personas (4 per version):

| Persona | SSO Flag | RBAC Permissions | What They Can Do |
|---------|----------|------------------|------------------|
| **admin** | `is_org_admin: true` | Full access | Full CRUD on all resources |
| **user** | `is_org_admin: false` | None | My User Access page only |
| **useradmin** | `is_org_admin: false` | `rbac:*:*` | CRUD via RBAC role (User Access Administrator) |
| **userviewer** | `is_org_admin: false` | `rbac:*:read` | Read-only (may show as no access) |

**Prerequisites for useradmin/userviewer:**

These users require RBAC role setup (one-time manual configuration):

1. Create SSO users that are NOT org admins
2. Create RBAC roles:
   - "E2E User Administrator" with `rbac:*:*` permission
   - "E2E User Viewer" with `rbac:*:read` permission (or similar read-only)
3. Create RBAC groups with these roles attached
4. Add the useradmin/userviewer users to the appropriate groups

> **Note**: The app may not have explicit "viewer" support. Users with only read permissions
> may see the UnauthorizedAccess screen (same as regular user). Tests should document this behavior.

### V1 vs V2

- **V1** — User Access pages (`/iam/user-access/*`) - Legacy experience
- **V2** — Access Management pages (`/iam/access-management/*`) - Preview mode enabled

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
