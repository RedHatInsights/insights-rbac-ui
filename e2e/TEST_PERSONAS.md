# E2E Test Personas

This document defines the test personas used in E2E tests and their capabilities.
Use this as the single source of truth when deciding which persona to use for a test.

## Permission Model

Both V1 and V2 use the same **granular permission model**. The difference between V1 and V2 is:
- **V1**: User Access routes (`/iam/user-access/...`)
- **V2**: Access Management routes (`/iam/access-management/...`) — enabled by `platform.rbac.workspaces` flag

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
| OrgAdmin     | `rbac:*:*`              | `AUTH_V1_ORGADMIN`      | `AUTH_V2_ORGADMIN`      |
| UserViewer   | `rbac:principal:read`   | `AUTH_V1_USERVIEWER` | `AUTH_V2_USERVIEWER` |
| ReadOnlyUser | (none)                  | `AUTH_V1_READONLY`   | `AUTH_V2_READONLY`   |
| RbacAdmin    | `rbac:*:*` (not org admin)  | —                    | `AUTH_V2_RBACADMIN`  |
| WorkspaceUser| explicit workspace access   | —                    | `AUTH_V2_WORKSPACEUSER` |

---

## Persona Details

### OrgAdmin

**Permissions**: `rbac:*:*` (wildcard — full RBAC access)

> Note: `rbac:*:*` does NOT include `inventory:*:*`. OrgAdmin users on stage typically
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
import { AUTH_V1_ORGADMIN } from '../../../utils'; // or AUTH_V2_ORGADMIN

test.describe('OrgAdmin', () => {
  test.use({ storageState: AUTH_V1_ORGADMIN });

  test.describe.serial('OrgAdmin Lifecycle', () => {
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

### RbacAdmin

**Permissions**: `rbac:*:*` (wildcard — full RBAC access, but NOT an org admin)

> This persona has the same RBAC permissions as OrgAdmin but lacks the platform `is_org_admin` flag.
> Use it to test features gated by org admin (e.g., Audit Log, Organization Management).

**V2 only** — no V1 equivalent.

**Page Access**:
| Page | Read | Write | Permission Required |
|------|------|-------|---------------------|
| Users | ✅ | ✅ Invite | `rbac:principal:*` |
| User Groups | ✅ | ✅ Create, Edit, Delete | `rbac:group:*` |
| Roles | ✅ | ✅ Create, Edit, Delete, Copy | `rbac:role:*` |
| Overview | ✅ | — | `rbac:*:read` |
| Workspaces | ✅ (if flag + permission) | ✅ | `inventory:groups:*` |
| Audit Log | ❌ Blocked | — | Requires org admin |
| Organization Management | ❌ Blocked | — | Requires org admin |

**Test Patterns**:
- Verify org-admin-only pages show unauthorized
- Verify RBAC features work identically to OrgAdmin

```typescript
import { AUTH_V2_RBACADMIN } from '../../../utils';

test.describe('RbacAdmin', () => {
  test.use({ storageState: AUTH_V2_RBACADMIN });

  test('Audit log shows unauthorized [RbacAdmin]', async ({ page }) => {
    // Org-admin-only page should be blocked
  });
});
```

---

### WorkspaceUser

**Permissions**: Explicit workspace access granted via role bindings (non-admin)

> This persona has no wildcard RBAC permissions but has been granted access to specific workspaces
> via Kessel role bindings. Use it to test workspace-scoped access patterns.

**V2 only** — no V1 equivalent.

```typescript
import { AUTH_V2_WORKSPACEUSER } from '../../../utils';

test.describe('WorkspaceUser', () => {
  test.use({ storageState: AUTH_V2_WORKSPACEUSER });

  test('Can view assigned workspace [WorkspaceUser]', async ({ page }) => {
    // Should only see workspaces they have access to
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
| `/my-user-access` | (public) — V1 |
| `/my-access` | (public) — V2 |
| `/organization-management/organization-wide-access` | **requireOrgAdmin** (platform `is_org_admin`, not RBAC) |

---

## Organization Management (org admin)

Organization Management is gated by **org admin** (platform `is_org_admin`), not RBAC permissions. The Chrome nav shows "Organization Management" only when the user is an org admin.

- **V2 OrgAdmin** on stage is typically an org admin → use `AUTH_V2_ORGADMIN` to test access to Organization Management.
- **UserViewer** and **ReadOnlyUser** are not org admins → they must not see Organization Management in the nav and must see "You do not have access" when opening the URL directly.

E2E tests: `e2e/journeys/v2/navigation/navigation-structure.spec.ts` (nav visibility), `e2e/journeys/v2/navigation/organization-management-access.spec.ts` (page access and direct URL block).

---

## Workspaces Note

Workspaces require `inventory:groups:read/write` permissions (separate from `rbac:*:*`).

The workspace list is controlled by the `platform.rbac.workspaces-list` flag, which is **org-wide**.
On stage, all users appear to have `inventory:groups:read` permission, so they can all view workspaces.

For E2E tests on stage, assume:
- OrgAdmin has full workspace access (read + write)
- UserViewer and ReadOnlyUser can view workspaces but cannot create/edit/delete (Create button disabled)

---

## Auth Fixture Locations

All auth fixtures are stored in `e2e/.auth/` and exported from `e2e/utils/paths.ts`:

```typescript
// V1 (User Access routes)
export const AUTH_V1_ORGADMIN = path.join(AUTH_DIR, 'v1-orgadmin.json');
export const AUTH_V1_USERVIEWER = path.join(AUTH_DIR, 'v1-userviewer.json');
export const AUTH_V1_READONLY = path.join(AUTH_DIR, 'v1-readonly.json');

// V2 (Access Management routes)
export const AUTH_V2_ORGADMIN = path.join(AUTH_DIR, 'v2-orgadmin.json');
export const AUTH_V2_USERVIEWER = path.join(AUTH_DIR, 'v2-userviewer.json');
export const AUTH_V2_READONLY = path.join(AUTH_DIR, 'v2-readonly.json');
export const AUTH_V2_RBACADMIN = path.join(AUTH_DIR, 'v2-rbacadmin.json');
export const AUTH_V2_WORKSPACEUSER = path.join(AUTH_DIR, 'v2-workspaceuser.json');
```

Import via the utils barrel export:
```typescript
import { AUTH_V1_ORGADMIN, AUTH_V1_USERVIEWER, AUTH_V1_READONLY } from '../../../utils';
```
