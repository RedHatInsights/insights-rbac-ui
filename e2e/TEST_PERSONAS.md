# E2E Test Personas

This document defines the test personas used in E2E tests and their capabilities.
Use this as the single source of truth when deciding which persona to use for a test.

## Permission Model

Both V1 and V2 use the same **granular permission model**. The difference between V1 and V2 is:
- **V1**: User Access routes (`/iam/user-access/...`)
- **V2**: Access Management routes (`/iam/access-management/...`) — enabled by `platform.rbac.workspaces-organization-management` flag

Permissions are checked against route definitions in `src/utilities/route-definitions.ts`.

### Permission Namespaces

This app uses two permission namespaces:

| Namespace | Permissions | Controls |
|-----------|-------------|----------|
| `rbac:*:*` | `rbac:principal:read/write` | Users |
| | `rbac:group:read/write` | Groups / User Groups |
| | `rbac:role:read/write` | Roles |
| | `rbac:*:read` | Overview (wildcard read) |
| `inventory:*:*` | `inventory:groups:read/write` | Workspaces |

The `rbac:*:*` wildcard grants all RBAC permissions but does **not** include `inventory:*:*`.
For workspace access, users need explicit `inventory:groups:*` permissions.

## Quick Reference

| Persona      | Permissions             | V1 Fixture           | V2 Fixture           |
| ------------ | ----------------------- | -------------------- | -------------------- |
| Admin        | `rbac:*:*`              | `AUTH_V1_ADMIN`      | `AUTH_V2_ADMIN`      |
| UserViewer   | `rbac:principal:read`   | `AUTH_V1_USERVIEWER` | `AUTH_V2_USERVIEWER` |
| ReadOnlyUser | (none)                  | `AUTH_V1_READONLY`   | `AUTH_V2_READONLY`   |

---

## Persona Details

### Admin

**Permissions**: `rbac:*:*` (wildcard — full RBAC access)

> Note: `rbac:*:*` does NOT include `inventory:*:*`. Admin users on stage typically
> also have `inventory:groups:*` for workspace access, but this is separate.

**Page Access**:
| Page | Read | Write | Permission Required |
|------|------|-------|---------------------|
| Users | ✅ | ✅ Invite | `rbac:principal:*` |
| Groups / User Groups | ✅ | ✅ Create, Edit, Delete | `rbac:group:*` |
| Roles | ✅ | ✅ Create, Edit, Delete, Copy | `rbac:role:*` |
| Overview | ✅ | — | `rbac:*:read` |
| Workspaces | ✅ (if flag + permission) | ✅ | `inventory:groups:*` |

**Test Patterns**:
- CRUD lifecycle tests (`test.describe.serial`)
- Feature functionality (modals, forms, wizards)
- Happy-path workflows

```typescript
import { AUTH_V1_ADMIN } from '../../../utils'; // or AUTH_V2_ADMIN

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test.describe.serial('Admin Lifecycle', () => {
    test('Create entity', async ({ page }) => { /* ... */ });
    test('Edit entity', async ({ page }) => { /* ... */ });
    test('Delete entity', async ({ page }) => { /* ... */ });
  });
});
```

---

### UserViewer

**Permissions**: `rbac:principal:read` + `inventory:groups:read` (on stage)

**Page Access**:
| Page | Read | Write | Why |
|------|------|-------|-----|
| Users | ✅ | ❌ No invite button | Has `rbac:principal:read`, lacks `:write` |
| Groups / User Groups | ❌ Blocked | ❌ | Lacks `rbac:group:read` |
| Roles | ❌ Blocked | ❌ | Lacks `rbac:role:read` |
| Overview | ❌ Blocked | — | Lacks `rbac:*:read` |
| Workspaces | ✅ | ❌ Create disabled | Has `inventory:groups:read`, lacks `:write` |

**Test Patterns**:
- Verify unauthorized message on blocked pages
- Verify write buttons are disabled/hidden on accessible pages

```typescript
import { AUTH_V1_USERVIEWER } from '../../../utils'; // or AUTH_V2_USERVIEWER

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V1_USERVIEWER });

  // For pages UserViewer CAN access (Users)
  test('Invite button is disabled or hidden [UserViewer]', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    
    // Verify page loads but write action is blocked
    await expect(usersPage.inviteButton).toBeDisabled();
    // OR
    await expect(usersPage.inviteButton).not.toBeVisible();
  });

  // For pages UserViewer CANNOT access (Groups, Roles)
  test('Groups page shows unauthorized [UserViewer]', async ({ page }) => {
    await setupPage(page);
    await page.goto(GROUPS_URL);
    
    await expect(page.getByText(/You do not have access to/i)).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });
  });
});
```

---

### ReadOnlyUser

**Permissions**: `inventory:groups:read` only (on stage) — no RBAC permissions

**Page Access**:
| Page | Read | Write | Why |
|------|------|-------|-----|
| Users | ❌ Blocked | ❌ | Lacks `rbac:principal:read` |
| Groups / User Groups | ❌ Blocked | ❌ | Lacks `rbac:group:read` |
| Roles | ❌ Blocked | ❌ | Lacks `rbac:role:read` |
| Overview | ❌ Blocked | — | Lacks `rbac:*:read` |
| Workspaces | ✅ | ❌ Create disabled | Has `inventory:groups:read`, lacks `:write` |
| My User Access | ✅ (public) | — | No permissions required |

**Test Patterns**:
- Verify unauthorized message on all RBAC pages
- May only access My User Access page

```typescript
import { AUTH_V1_READONLY } from '../../../utils'; // or AUTH_V2_READONLY

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V1_READONLY });

  test('Page shows unauthorized [ReadOnlyUser]', async ({ page }) => {
    await setupPage(page);
    await page.goto(PAGE_URL);
    
    await expect(page.getByText(/You do not have access to/i)).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });
  });
});
```

---

## Route Permission Reference

From `src/utilities/route-definitions.ts`:

| Route | Required Permission |
|-------|---------------------|
| `/user-access/users` | `rbac:principal:read` |
| `/user-access/users/invite` | `rbac:principal:write` |
| `/user-access/groups` | `rbac:group:read` |
| `/user-access/groups/add-group` | `rbac:group:write` |
| `/user-access/roles` | `rbac:role:read` |
| `/user-access/roles/add-role` | `rbac:role:write` |
| `/user-access/overview` | `rbac:*:read` |
| `/user-access/workspaces` | `inventory:groups:read` |
| `/access-management/users-and-user-groups` | `rbac:principal:read` OR `rbac:group:read` |
| `/access-management/workspaces` | `inventory:groups:read` |
| `/access-management/roles` | `rbac:role:read` |
| `/my-user-access` | (public) |

---

## Workspaces Note

Workspaces require `inventory:groups:read/write` permissions (separate from `rbac:*:*`).

The workspace list is controlled by the `platform.rbac.workspaces-list` flag, which is **org-wide**.
On stage, all users appear to have `inventory:groups:read` permission, so they can all view workspaces.

For E2E tests on stage, assume:
- Admin has full workspace access (read + write)
- UserViewer and ReadOnlyUser can view workspaces but cannot create/edit/delete (Create button disabled)

---

## Auth Fixture Locations

All auth fixtures are stored in `e2e/.auth/` and exported from `e2e/utils/paths.ts`:

```typescript
// V1 (User Access routes)
export const AUTH_V1_ADMIN = path.join(AUTH_DIR, 'v1-admin.json');
export const AUTH_V1_USERVIEWER = path.join(AUTH_DIR, 'v1-userviewer.json');
export const AUTH_V1_READONLY = path.join(AUTH_DIR, 'v1-readonly.json');

// V2 (Access Management routes)
export const AUTH_V2_ADMIN = path.join(AUTH_DIR, 'v2-admin.json');
export const AUTH_V2_USERVIEWER = path.join(AUTH_DIR, 'v2-userviewer.json');
export const AUTH_V2_READONLY = path.join(AUTH_DIR, 'v2-readonly.json');
```

Import via the utils barrel export:
```typescript
import { AUTH_V1_ADMIN, AUTH_V1_USERVIEWER, AUTH_V1_READONLY } from '../../../utils';
```
