# E2E Test Routing Index

> 🛑 **IMPORTANT FOR AGENTS:**
> When creating a NEW test file, you **MUST** copy the structure from [`e2e/_TEMPLATE.spec.ts`](./_TEMPLATE.spec.ts).
> Do not write a file from scratch. Copy the template and fill in the blanks.
>
> **Checklist for new files:**
> - [ ] Copied ASCII header from `_TEMPLATE.spec.ts`?
> - [ ] Included `UserViewer` describe block for negative tests?
> - [ ] Included `ReadOnlyUser` describe block if applicable?
> - [ ] Added scenarios to the tables below?
> - [ ] Used `E2E_TIMEOUTS` constants (no magic numbers)?

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
| Admin searches for user | `user-list.spec.ts` | `Admin` | Use getAdminUsername() |
| Admin views user detail | `user-list.spec.ts` | `Admin` | Use getAdminUsername() |
| Admin sees invite button | `user-management.spec.ts` | `Admin Status Management` | No setup needed |
| Admin opens invite modal | `user-management.spec.ts` | `Admin Status Management` | No setup needed |
| Admin sees bulk actions | `user-management.spec.ts` | `Admin Status Management` | Select users first |
| Admin invites users | `user-management.spec.ts` | `Admin Invitation` | Mock API response |
| ReadOnlyUser gets unauthorized | `user-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |

## V2 User Groups

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a user group | `user-group-management.spec.ts` | `Admin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| Admin edits a user group | `user-group-management.spec.ts` | `Admin Lifecycle` (serial) | Follows create test |
| Admin deletes a user group | `user-group-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin sees Create button | `user-group-management.spec.ts` | `Admin` | Atomic, no setup needed |
| UserViewer gets unauthorized | `user-group-management.spec.ts` | `UserViewer` | Navigate to URL directly |
| ReadOnlyUser gets unauthorized | `user-group-management.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |
| Admin views user groups list | `user-group-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for user group | `user-group-list.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |
| Admin views group in drawer | `user-group-detail.spec.ts` | `Admin` | Use SEEDED_GROUP_NAME |

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
| Admin filters by username | `user-list.spec.ts` | `Admin` | Use getAdminUsername() |
| Admin views user in drawer | `user-list.spec.ts` | `Admin` | Use getAdminUsername() |
| UserViewer views users list | `user-list.spec.ts` | `UserViewer` | No setup needed |
| UserViewer views user in drawer | `user-list.spec.ts` | `UserViewer` | Use getAdminUsername() |
| ReadOnlyUser gets unauthorized | `user-list.spec.ts` | `ReadOnlyUser` | Navigate to URL directly |
| Admin invites users | `user-invite.spec.ts` | `Admin` | Mock API response |
| UserViewer cannot invite | `user-invite.spec.ts` | `UserViewer` | Check button disabled |

## V2 Workspaces

| Scenario | File | Describe Block | Setup Notes |
|----------|------|----------------|-------------|
| Admin creates a workspace | `workspace-management.spec.ts` | `Admin Lifecycle` (serial) | Use TEST_PREFIX, select parent workspace |
| Admin edits a workspace | `workspace-management.spec.ts` | `Admin Lifecycle` (serial) | Follows create test |
| Admin deletes a workspace | `workspace-management.spec.ts` | `Admin Lifecycle` (serial) | Follows edit test |
| Admin sees Create button | `workspace-management.spec.ts` | `Admin` | Atomic, no setup needed |
| UserViewer sees disabled Create | `workspace-management.spec.ts` | `UserViewer` | Button visible but disabled |
| ReadOnlyUser sees disabled Create | `workspace-management.spec.ts` | `ReadOnlyUser` | Button visible but disabled |
| Admin views workspaces list | `workspace-list.spec.ts` | `Admin` | No setup needed |
| Admin searches for workspace | `workspace-list.spec.ts` | `Admin` | Use SEEDED_WORKSPACE_NAME |
| UserViewer views workspaces list | `workspace-list.spec.ts` | `UserViewer` | No setup needed |
| Admin views workspace detail | `workspace-detail.spec.ts` | `Admin` | Use SEEDED_WORKSPACE_NAME |
| UserViewer views workspace detail | `workspace-detail.spec.ts` | `UserViewer` | Use SEEDED_WORKSPACE_NAME |

---

## Data Setup Reference

| Data Type | How to Get | When to Use |
|-----------|------------|-------------|
| Seeded Group (V1) | `getSeededGroupName('v1')` | Read-only tests, viewer tests |
| Seeded Group (V2) | `getSeededGroupName('v2')` | Read-only tests, viewer tests |
| Seeded Role (V1) | `getSeededRoleName('v1')` | Read-only tests, viewer tests |
| Seeded Role (V2) | `getSeededRoleName('v2')` | Read-only tests, viewer tests |
| Seeded Workspace (V2) | `getSeededWorkspaceName('v2')` | Read-only tests, viewer tests |
| Admin Username (V1) | `getAdminUsername('v1')` | User search/filter tests |
| Admin Username (V2) | `getAdminUsername('v2')` | User search/filter tests |
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
