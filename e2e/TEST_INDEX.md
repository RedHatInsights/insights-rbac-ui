# E2E Test Routing Index

> 🛑 **IMPORTANT FOR AGENTS:**
> When creating a NEW test file, you **MUST** copy the structure from [`e2e/_TEMPLATE.spec.ts`](./_TEMPLATE.spec.ts).
> Do not write a file from scratch. Copy the template and fill in the blanks.
>
> **Checklist for new files:**
> - [ ] Copied ASCII header (DECISION TREE, CAPABILITIES & PERSONAS, DATA PREREQUISITES) from `_TEMPLATE.spec.ts`?
> - [ ] Each persona has its own `test.describe('PersonaName')` block with `test.use({ storageState: AUTH_... })`?
> - [ ] Consulted [`TEST_PERSONAS.md`](./TEST_PERSONAS.md) for persona capabilities and page access?
> - [ ] Added scenarios to the tables below?
> - [ ] Used `E2E_TIMEOUTS` constants (no magic numbers)?
>
> **Required persona blocks** (see [TEST_PERSONAS.md](./TEST_PERSONAS.md) for details):
> - `Admin` — Full CRUD tests, serial lifecycle
> - `UserViewer` — Verify buttons disabled/hidden, no write access
> - `ReadOnlyUser` — Verify unauthorized message or blocked access

Quick reference for where to add tests. Search this file before creating new tests.

## File Taxonomy

| File Pattern | Purpose | Contains |
|--------------|---------|----------|
| `<entity>-list.spec.ts` | Table/list view | Sort, filter, search, pagination, visibility |
| `<entity>-detail.spec.ts` | Detail page reads | View content, tabs, navigation to related entities |
| `<entity>-management.spec.ts` | CRUD mutations | Create, edit, delete with serial lifecycle |
| `<entity>-<capability>.spec.ts` | Specific features | e.g., membership, invite, system-protected |

---

## V1 Groups

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a group | `group-management.spec.ts` | `Admin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| Admin edits a group | `group-management.spec.ts` | `Admin Lifecycle` (serial) | Follows create test |
| Admin deletes a group | `group-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin sees Create button | `group-management.spec.ts` | `Admin` | Atomic, no setup needed |
| Admin sees Edit/Delete actions | `group-management.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| UserViewer gets unauthorized | `group-management.spec.ts` | `UserViewer` | Navigate to URL directly |
| ReadOnlyUser gets unauthorized | `group-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |
| Admin views groups list | `group-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for group | `group-list.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin views group detail | `group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin navigates to role from group | `group-detail.spec.ts` | `Admin` | Requires seeded role attached |
| Admin adds member to group | `group-membership.spec.ts` | `Admin Lifecycle` | Use SEEDED_GROUP_NAME |

## V1 Roles

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a role | `role-management.spec.ts` | `Admin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| Admin edits a role | `role-management.spec.ts` | `Admin Lifecycle` (serial) | Follows create test |
| Admin deletes a role | `role-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin copies a role | `role-management.spec.ts` | `Admin Copy Lifecycle` (serial) | Use SEEDED_ROLE_NAME as source |
| Admin sees Create button | `role-management.spec.ts` | `Admin` | Atomic, no setup needed |
| Admin sees Edit/Delete on detail | `role-management.spec.ts` | `Admin` | Use SEEDED_ROLE_NAME |
| UserViewer gets unauthorized | `role-management.spec.ts` | `UserViewer` | Navigate to URL directly |
| ReadOnlyUser gets unauthorized | `role-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |
| Admin views roles list | `role-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for role | `role-list.spec.ts` | `Admin` | Use SEEDED_ROLE_NAME |
| Admin views role detail | `role-detail.spec.ts` | `Admin` | Use SEEDED_ROLE_NAME |

## V1 Users

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin views users list | `user-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for user | `user-list.spec.ts` | `Admin` | Use getSeededUsername() |
| Admin views user detail | `user-list.spec.ts` | `Admin` | Use getSeededUsername() |
| Admin sees invite button | `user-management.spec.ts` | `Admin Status Management` | No setup needed |
| Admin opens invite modal | `user-management.spec.ts` | `Admin Status Management` | No setup needed |
| Admin sees bulk actions | `user-management.spec.ts` | `Admin Status Management` | Select users first |
| Admin invites users | `user-management.spec.ts` | `Admin Invitation` | Mock API response |
| ReadOnlyUser gets unauthorized | `user-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |

## V2 User Groups

### List & Detail

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin views user groups list | `user-group-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for user group | `user-group-list.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin views group in drawer | `user-group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin sees drawer tabs (Users, SA, Roles) | `user-group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin navigates drawer tabs | `user-group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin clicks drawer Edit → edit page | `user-group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin closes drawer via X button | `user-group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |

### Management (CRUD)

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a user group | `user-group-management.spec.ts` | `Admin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| Admin edits a user group (name/desc) | `user-group-management.spec.ts` | `Admin Lifecycle` (serial) | Verifies edit page URL, pre-populated form, tabs |
| Admin deletes a user group | `user-group-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin sees Create button | `user-group-management.spec.ts` | `Admin` | Atomic, no setup needed |
| Admin Create button navigates to form | `user-group-management.spec.ts` | `Admin` | Verify empty form, cancel returns |
| UserViewer gets unauthorized | `user-group-management.spec.ts` | `UserViewer` | Navigate to URL directly |
| ReadOnlyUser gets unauthorized | `user-group-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |

### Membership (via Edit Page)

> **Note**: V2 does NOT use modals for membership. Users/service accounts are
> managed through selectable tables on the Edit User Group page.

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Edit page shows selectable users table | `user-group-membership.spec.ts` | `Admin - Member Lifecycle` (serial) | Use SEEDED_GROUP_UUID |
| Admin adds member via edit page | `user-group-membership.spec.ts` | `Admin - Member Lifecycle` (serial) | Select readonly persona in users table |
| Admin verifies member in drawer | `user-group-membership.spec.ts` | `Admin - Member Lifecycle` (serial) | Follows add, check drawer Users tab |
| Admin removes member via edit page | `user-group-membership.spec.ts` | `Admin - Member Lifecycle` (serial) | Deselect user, submit |
| Admin verifies member removed in drawer | `user-group-membership.spec.ts` | `Admin - Member Lifecycle` (serial) | Self-cleaning: member removed at end |
| Edit page shows SA table | `user-group-membership.spec.ts` | `Admin - Service Accounts` | Switch to SA tab on edit page |
| Drawer Edit button → edit page | `user-group-membership.spec.ts` | `Admin - Navigation` | Open drawer, click Edit |
| Row action Edit → edit page | `user-group-membership.spec.ts` | `Admin - Navigation` | Kebab menu Edit action |
| Edit page Cancel → list page | `user-group-membership.spec.ts` | `Admin - Navigation` | Click Cancel, verify URL |
| Submit disabled when name empty | `user-group-membership.spec.ts` | `Admin - Form Validation` | Clear name, check button state |
| Duplicate name prevents submission | `user-group-membership.spec.ts` | `Admin - Form Validation` | Enter "Default access" |
| UserViewer cannot access edit page | `user-group-membership.spec.ts` | `UserViewer` | Navigate to edit URL directly |
| ReadOnlyUser cannot access edit page | `user-group-membership.spec.ts` | `ReadOnlyUser` | Navigate to edit URL directly |

## V2 Roles

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a role | `role-management.spec.ts` | `Admin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| Admin edits a role | `role-management.spec.ts` | `Admin Lifecycle` (serial) | Follows create test |
| Admin deletes a role | `role-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin sees Create button | `role-management.spec.ts` | `Admin` | Atomic, no setup needed |
| UserViewer gets unauthorized | `role-management.spec.ts` | `UserViewer` | Navigate to URL directly |
| ReadOnlyUser gets unauthorized | `role-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |
| Admin views roles list | `role-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for role | `role-list.spec.ts` | `Admin` | Use SEEDED_ROLE_NAME |
| Admin views role in drawer | `role-detail.spec.ts` | `Admin` | Use SEEDED_ROLE_NAME |

## V2 Users

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin views users list | `user-list.spec.ts` | `Admin` | No setup needed |
| Admin filters by username | `user-list.spec.ts` | `Admin` | Use getSeededUsername() |
| Admin views user in drawer | `user-list.spec.ts` | `Admin` | Use getSeededUsername() |
| UserViewer views users list | `user-list.spec.ts` | `UserViewer` | No setup needed |
| UserViewer views user in drawer | `user-list.spec.ts` | `UserViewer` | Use getSeededUsername() |
| ReadOnlyUser gets unauthorized | `user-list.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |
| Admin invites users | `user-invite.spec.ts` | `Admin` | Mock API response |
| UserViewer cannot invite | `user-invite.spec.ts` | `UserViewer` | Check button disabled |

## V1 Workspaces

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin views workspaces list | `workspace-list.spec.ts` | `Admin` | No setup needed |
| UserViewer views workspaces list | `workspace-list.spec.ts` | `UserViewer` | Read-only access |
| ReadOnlyUser views workspaces list | `workspace-list.spec.ts` | `ReadOnlyUser` | Read-only access |

## V2 Workspaces

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a workspace | `workspace-management.spec.ts` | `Admin Lifecycle` (serial) | Use TEST_PREFIX, select parent workspace |
| Admin edits a workspace | `workspace-management.spec.ts` | `Admin Lifecycle` (serial) | Follows create test |
| Admin deletes a workspace | `workspace-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin sees Create button | `workspace-management.spec.ts` | `Admin` | Atomic, no setup needed |
| UserViewer Create button disabled | `workspace-management.spec.ts` | `UserViewer` | Lacks `inventory:groups:write` |
| ReadOnlyUser Create button disabled | `workspace-management.spec.ts` | `ReadOnlyUser` | Lacks `inventory:groups:write` |
| Admin views workspaces list | `workspace-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for workspace | `workspace-list.spec.ts` | `Admin` | Use SEEDED_WORKSPACE_NAME |
| UserViewer views workspaces list | `workspace-list.spec.ts` | `UserViewer` | Read-only access |
| ReadOnlyUser views workspaces list | `workspace-list.spec.ts` | `ReadOnlyUser` | Read-only access |
| Admin views workspace detail | `workspace-detail.spec.ts` | `Admin` | Use SEEDED_WORKSPACE_NAME |
| UserViewer views workspace detail | `workspace-detail.spec.ts` | `UserViewer` | Read-only access |
| ReadOnlyUser views workspace detail | `workspace-detail.spec.ts` | `ReadOnlyUser` | Read-only access |

---

## Data Setup Reference

| Data Type | How to Get | When to Use |
|-----------|------------|-------------|
| Seeded Group (V1) | `getSeededGroupName('v1')` | Read-only tests, viewer tests |
| Seeded Group (V2) | `getSeededGroupName('v2')` | Read-only tests, viewer tests |
| Seeded Role (V1) | `getSeededRoleName('v1')` | Read-only tests, viewer tests |
| Seeded Role (V2) | `getSeededRoleName('v2')` | Read-only tests, viewer tests |
| Seeded Workspace (V2) | `getSeededWorkspaceName('v2')` | Read-only tests, viewer tests |
| Seeded User | `getSeededUsername()` | User search/filter tests, membership tests |
| New Entity | Create in serial lifecycle | CRUD lifecycle tests only |
| Auth State | `AUTH_V1_ADMIN`, `AUTH_V2_ADMIN`, etc. | All tests via `test.use()` |
| Test Prefix (V1) | `process.env.TEST_PREFIX_V1` | Creating new V1 entities |
| Test Prefix (V2) | `process.env.TEST_PREFIX_V2` | Creating new V2 entities |

---

## Auth Fixtures

| Persona | V1 Fixture | V2 Fixture |
|---------|------------|------------|
| Admin | `AUTH_V1_ADMIN` | `AUTH_V2_ADMIN` |
| UserViewer | `AUTH_V1_USERVIEWER` | `AUTH_V2_USERVIEWER` |
| ReadOnlyUser | `AUTH_V1_READONLY` | `AUTH_V2_READONLY` |
