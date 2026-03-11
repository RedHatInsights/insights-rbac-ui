# E2E Test Suite

This directory contains the Playwright E2E test suite for RBAC UI.

> **📚 Full Documentation**: For the complete testing strategy and architecture, see the [E2E Testing Strategy](https://master--687a10bbc18d4b17063770ba.chromatic.com/?path=/docs/documentation-e2e-testing-strategy--docs) in Storybook.

## Quick Start

### 1. Setup Credentials (One-Time)

Copy the template env files and fill in your credentials:

```bash
# Copy templates for all personas
cp e2e/auth/.env.v1-admin.template e2e/auth/.env.v1-admin
cp e2e/auth/.env.v1-userviewer.template e2e/auth/.env.v1-userviewer
cp e2e/auth/.env.v1-readonly.template e2e/auth/.env.v1-readonly
cp e2e/auth/.env.v2-admin.template e2e/auth/.env.v2-admin
cp e2e/auth/.env.v2-userviewer.template e2e/auth/.env.v2-userviewer
cp e2e/auth/.env.v2-readonly.template e2e/auth/.env.v2-readonly

# Edit each file with your credentials
# RBAC_USERNAME=your-user@redhat.com
# RBAC_PASSWORD=your-password
```

### 2. Configure Persona Usernames

Edit the seed fixtures to match your test users:

- `e2e/fixtures/seed-v1.json` - V1 persona usernames
- `e2e/fixtures/seed-v2.json` - V2 persona usernames

```json
{
  "personas": {
    "admin": { "username": "your-admin-user" },
    "readonly": { "username": "your-readonly-user" }
  }
}
```

### 3. Run Tests

Run the entire E2E lifecycle with a single command:

```bash
# Run ALL tests (V1 + V2, all personas)
TEST_PREFIX_V1=jdoe-v1 TEST_PREFIX_V2=jdoe-v2 npm run e2e

# Run ALL V1 tests (all personas)
TEST_PREFIX_V1=jdoe npm run e2e:v1

# Run ALL V2 tests (all personas)
TEST_PREFIX_V2=jdoe npm run e2e:v2

# Or run specific personas
TEST_PREFIX_V1=jdoe npm run e2e:v1:admin
TEST_PREFIX_V1=jdoe npm run e2e:v1:userviewer
TEST_PREFIX_V1=jdoe npm run e2e:v1:readonly
```

**What happens:**
1. **Seed** — Creates test data prefixed with `TEST_PREFIX_V1`/`TEST_PREFIX_V2`
2. **Auth** — Logs in all personas and saves session state
3. **Test** — Runs the test suite
4. **Cleanup** — Deletes all data matching the prefixes

### Prerequisites

- VPN connection to access stage environment
- Playwright browsers: `npx playwright install chromium`
- Node.js 20+

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_PREFIX_V1` | For V1 | Prefix for V1 seeded data (min 4 chars, e.g., `jdoe-v1`) |
| `TEST_PREFIX_V2` | For V2 | Prefix for V2 seeded data (min 4 chars, e.g., `jdoe-v2`) |
| `E2E_BASE_URL` | No | Override target URL (default: `https://console.stage.redhat.com`) |

Credentials (`RBAC_USERNAME`, `RBAC_PASSWORD`) are loaded from env files in `e2e/auth/`.

---

## Available Commands

### Supershortcuts (All Personas)

| Command | Description |
|---------|-------------|
| `npm run e2e:v1` | Full lifecycle for ALL V1 personas |
| `npm run e2e:v2` | Full lifecycle for ALL V2 personas |

### Per-Persona (Full Lifecycle)

| Command | Description |
|---------|-------------|
| `npm run e2e:v1:admin` | V1 Admin tests (full CRUD) |
| `npm run e2e:v1:userviewer` | V1 UserViewer tests (read-only) |
| `npm run e2e:v1:readonly` | V1 ReadOnlyUser tests (unauthorized) |
| `npm run e2e:v2:admin` | V2 Admin tests (full CRUD) |
| `npm run e2e:v2:userviewer` | V2 UserViewer tests (read-only) |
| `npm run e2e:v2:readonly` | V2 ReadOnlyUser tests (unauthorized) |

### Primitives (For Debugging)

All primitives follow the pattern `e2e:version:action:persona`:

| Command | Description |
|---------|-------------|
| `npm run e2e:v1:seed` | Seed V1 test data |
| `npm run e2e:v1:cleanup` | Cleanup V1 test data |
| `npm run e2e:v1:auth` | Auth all V1 personas (parallel) |
| `npm run e2e:v1:auth:admin` | Auth V1 admin |
| `npm run e2e:v1:auth:userviewer` | Auth V1 userviewer |
| `npm run e2e:v1:auth:readonly` | Auth V1 readonly |
| `npm run e2e:v1:test` | Run all V1 tests |
| `npm run e2e:v1:test:admin` | Run V1 Admin tests |
| `npm run e2e:v1:test:userviewer` | Run V1 UserViewer tests |
| `npm run e2e:v1:test:readonly` | Run V1 ReadOnlyUser tests |

Same pattern for V2 (`e2e:v2:*`).

---

## Manual Workflow (Debugging)

When you need more control, run steps individually:

```bash
# 1. Set environment (prefix must be at least 4 characters)
export TEST_PREFIX_V1=jdoe

# 2. Seed test data
npm run e2e:v1:seed

# 3. Run tests (auth is handled automatically via Playwright projects)
npm run e2e:v1:test:admin

# Or run specific file
TEST_PREFIX_V1=jdoe npx playwright test e2e/journeys/v1/roles/view.spec.ts --project=v1-admin --headed

# 4. Cleanup when done
npm run e2e:v1:cleanup
```

---

## Test Personas

The E2E suite supports 3 personas per version:

| Persona | SSO Flag | RBAC Permissions | What They Can Do |
|---------|----------|------------------|------------------|
| **Admin** | `is_org_admin: true` | Full access | Full CRUD on all resources |
| **UserViewer** | `is_org_admin: false` | `rbac:*:read` | Read-only access to RBAC pages |
| **ReadOnlyUser** | `is_org_admin: false` | None | My User Access page only (unauthorized elsewhere) |

### Persona Setup Requirements

1. **Admin**: Must be an Org Admin in SSO
2. **UserViewer**: Regular user with a role granting `rbac:*:read`
3. **ReadOnlyUser**: Regular user with no RBAC permissions

### Seeded Users

Pre-existing stage accounts used as test data (for search/filter/membership tests) are configured in seed fixtures under `seededUsers`, separate from personas:

```json
// e2e/fixtures/seed-v2.json
{
  "seededUsers": [
    { "username": "rbac-e2e-seed-user" }
  ]
}
```

Tests use `getSeededUsername()` from `seed-map.ts` to access these values. Seeded users are **not** personas — personas are auth-linked accounts used to run tests, while seeded users are data targets that tests interact with.

---

## Testing the console search fix (IAM search entries)

The console **global search** (header search bar) shows results from `searchEntries` in `deploy/frontend.yaml`. That config is consumed by the Frontend Operator and the platform’s search index. To confirm the IAM search fix:

### 1. Validate config locally (before deploy)

Ensures `frontend.yaml` has required fields and expected IAM coverage. Does **not** hit the live search.

```bash
npm run validate:search-entries
```

Runs `scripts/validate-search-entries.ts`: checks that every search entry has `id`, `title`, `description`, `href`, that expected IAM entry ids exist, and that at least one entry has IAM-related `alt_title` terms for discoverability.

### 2. Manual test in stage (or ephemeral)

After your branch is deployed and the Frontend Operator has reconciled:

1. Open the target environment (e.g. `https://console.stage.redhat.com`).
2. Log in as a user with RBAC access (e.g. org admin or user with principal/role/group read).
3. Use the **global search** in the header (magnifying glass).
4. Try queries: **roles**, **workspaces**, **users**, **groups**, **IAM**, **user access**, **My Access**.
5. Confirm that IAM/RBAC results appear (e.g. “Roles”, “Workspaces”, “Users”) and that links go to `/iam/...` (user-access or access-management depending on your feature flag).

**Note:** The search index may be built or cached by the platform; if results don’t appear immediately after deploy, wait for the next index run or ask the platform/Chrome team about cache or delay.

---

## Testing that the nav shows correctly

The **left navigation** (Chrome sidebar) is driven by `bundleSegments` in `deploy/frontend.yaml`. Visibility of items (e.g. Organization Management) depends on permissions and feature flags. You can verify nav in three ways:

### 1. Config validation (local)

Ensures nav permissions in `frontend.yaml` stay in sync with `src/utilities/route-definitions.ts`. Does **not** check that the UI renders the nav.

```bash
npm run lint:permissions
```

### 2. Storybook (local, visual)

User-journey stories use `FrontendYamlNavigation`, which reads **`deploy/frontend.yaml`** and renders the same structure as the platform Chrome. Use it to confirm labels and structure without deploying.

- Open **User Journeys** or **Production V2** (e.g. **Production V2 Org Admin**, **Production V2 UserViewer**) in Storybook.
- The sidebar is the YAML-driven nav; expand “Access Management” to see Users and Groups, Roles, Workspaces. Org Admin stories can show “Organization Management” when the story context has `orgAdmin: true`.

Default Storybook feature flags include `platform.rbac.workspaces-organization-management: true`, so you see the V2 nav (Overview, My Access, Access Management, Organization Management).


---

## Test Structure

```
e2e/
├── auth/                    # Auth storage state files (gitignored)
│   ├── .env.v1-admin        # Admin credentials
│   ├── .env.v1-userviewer   # UserViewer credentials
│   ├── .env.v1-readonly     # ReadOnlyUser credentials
│   ├── v1-admin.json        # Playwright session state
│   └── ...
├── fixtures/
│   ├── seed-v1.json         # V1 seed: personas, roles, groups
│   └── seed-v2.json         # V2 seed: personas, roles, groups, workspaces
├── journeys/
│   ├── v1/
│   │   ├── groups/
│   │   │   ├── view.spec.ts       # Admin, UserViewer
│   │   │   ├── crud.spec.ts       # Admin only
│   │   │   └── unauthorized.spec.ts # ReadOnlyUser
│   │   ├── roles/
│   │   ├── users/
│   │   └── my-user-access.spec.ts # All personas
│   └── v2/
│       ├── roles/
│       ├── user-groups/
│       ├── users/
│       ├── workspaces/
│       └── my-user-access.spec.ts
├── pages/                   # Page Objects
│   ├── v1/
│   └── v2/
├── utils/                   # Shared test utilities
├── smoke.spec.ts            # Basic page load verification
└── playwright.config.ts     # Playwright configuration
```

---

## CI Setup (Konflux)

In CI environments, credentials come from Vault. The `e2e:ci:setup` script generates `.env` files from CI environment variables.

**Required Konflux secrets:**

| Secret Name | Description |
|-------------|-------------|
| `E2E_V1_ADMIN_USERNAME` | V1 Admin username |
| `E2E_V1_ADMIN_PASSWORD` | V1 Admin password |
| `E2E_V1_USERVIEWER_USERNAME` | V1 UserViewer username |
| `E2E_V1_USERVIEWER_PASSWORD` | V1 UserViewer password |
| `E2E_V1_READONLY_USERNAME` | V1 ReadOnlyUser username |
| `E2E_V1_READONLY_PASSWORD` | V1 ReadOnlyUser password |
| `E2E_V2_ADMIN_USERNAME` | V2 Admin username |
| `E2E_V2_ADMIN_PASSWORD` | V2 Admin password |
| `E2E_V2_USERVIEWER_USERNAME` | V2 UserViewer username |
| `E2E_V2_USERVIEWER_PASSWORD` | V2 UserViewer password |
| `E2E_V2_READONLY_USERNAME` | V2 ReadOnlyUser username |
| `E2E_V2_READONLY_PASSWORD` | V2 ReadOnlyUser password |

**CI Pipeline usage:**

```bash
# 1. Konflux sets E2E_* vars from Vault
# 2. Generate .env files from templates
npm run e2e:ci:setup

# 3. Run tests
npm run e2e:v1
npm run e2e:v2
```

---

## Debugging

### Playwright Debugging

```bash
# Run with visible browser
npx playwright test e2e/journeys/v1/roles/view.spec.ts --headed

# Step-through debugging
npx playwright test e2e/journeys/v1/roles/view.spec.ts --debug

# Interactive UI mode
npx playwright test --ui

# View HTML report after run
npx playwright show-report
```

### Seed Dry-Run

Preview what would be seeded without creating anything:

```bash
TEST_PREFIX_V1=debug npm run cli -- seed --file e2e/fixtures/seed-v1.json --prefix "${TEST_PREFIX_V1}" --dry-run
```
