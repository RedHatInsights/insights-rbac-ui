# E2E Test Routing Index

> 🛑 **IMPORTANT FOR AGENTS:**
> When creating a NEW test file, you **MUST** copy the structure from [`e2e/_TEMPLATE.spec.ts`](./_TEMPLATE.spec.ts).
> Do not write a file from scratch. Copy the template and fill in the blanks.
>
> **Checklist for new files:**
>
> - [ ] Copied ASCII header (DECISION TREE, CAPABILITIES & PERSONAS, DATA PREREQUISITES) from `_TEMPLATE.spec.ts`?
> - [ ] Each persona has its own `test.describe('PersonaName')` block with `test.use({ storageState: AUTH_... })`?
> - [ ] Consulted [`TEST_PERSONAS.md`](./TEST_PERSONAS.md) for persona capabilities and page access?
> - [ ] Added scenarios to the tables below?
> - [ ] Used `E2E_TIMEOUTS` constants (no magic numbers)?
>
> **Required persona blocks** (see [TEST_PERSONAS.md](./TEST_PERSONAS.md) for details):
>
> - `OrgAdmin` — Full CRUD tests, serial lifecycle
> - `UserViewer` — Verify buttons disabled/hidden, no write access
> - `ReadOnlyUser` — Verify unauthorized message or blocked access

Quick reference for where to add tests. Search this file before creating new tests.

## File Taxonomy

| File Pattern                             | Purpose               | Contains                                                   |
| ---------------------------------------- | --------------------- | ---------------------------------------------------------- |
| `<entity>-list.spec.ts`                  | Table/list view       | Sort, filter, search, pagination, visibility               |
| `<entity>-detail.spec.ts`                | Detail page reads     | View content, tabs, navigation to related entities         |
| `<entity>-management.spec.ts`            | CRUD mutations        | Create, edit, delete with serial lifecycle                 |
| `<entity>-<capability>.spec.ts`          | Specific features     | e.g., membership, invite, system-protected                 |
| `navigation-structure.spec.ts`           | V2 nav structure      | Nav order, limited nav for non-admin, cross-page nav       |
| `organization-management-access.spec.ts` | Org Management access | Org admin access, non-org admin blocked (nav + direct URL) |

---

## V2 Navigation & Organization Management

| Scenario                                                                         | File                                                | Describe Block | Setup Notes                                                |
| -------------------------------------------------------------------------------- | --------------------------------------------------- | -------------- | ---------------------------------------------------------- |
| OrgAdmin sees V2 nav structure and order                                         | `navigation/navigation-structure.spec.ts`           | `OrgAdmin`     | Use NavigationSidebar, gotoOverview                        |
| OrgAdmin cross-page nav works (Overview → Users and Groups → Roles → Workspaces) | `navigation/navigation-structure.spec.ts`           | `OrgAdmin`     | Use NavigationSidebar                                      |
| UserViewer does not see Organization Management in nav                           | `navigation/navigation-structure.spec.ts`           | `UserViewer`   | gotoMyAccess                                               |
| ReadOnlyUser does not see Organization Management in nav                         | `navigation/navigation-structure.spec.ts`           | `ReadOnlyUser` | gotoMyAccess                                               |
| Org admin can access Organization Management page                                | `navigation/organization-management-access.spec.ts` | `OrgAdmin`     | Goto /iam/organization-management/organization-wide-access |
| UserViewer blocked from direct URL to Organization Management                    | `navigation/organization-management-access.spec.ts` | `UserViewer`   | Goto URL, expect unauthorized                              |
| ReadOnlyUser blocked from direct URL to Organization Management                  | `navigation/organization-management-access.spec.ts` | `ReadOnlyUser` | Goto URL, expect unauthorized                              |

---

## V1 Groups

| Scenario                              | File                       | Describe Block                | Setup Notes                      |
| ------------------------------------- | -------------------------- | ----------------------------- | -------------------------------- |
| OrgAdmin creates a group              | `group-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| OrgAdmin edits a group                | `group-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows create test              |
| OrgAdmin deletes a group              | `group-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows edit test                |
| OrgAdmin sees Create button           | `group-management.spec.ts` | `OrgAdmin`                    | Atomic, no setup needed          |
| OrgAdmin sees Edit/Delete actions     | `group-management.spec.ts` | `OrgAdmin`                    | Use SEEDED_GROUP_NAME            |
| UserViewer gets unauthorized          | `group-management.spec.ts` | `UserViewer`                  | Navigate to URL directly         |
| ReadOnlyUser gets unauthorized        | `group-management.spec.ts` | `ReadOnlyUser`                | Navigate to URL directly         |
| OrgAdmin views groups list            | `group-list.spec.ts`       | `OrgAdmin`                    | No setup needed                  |
| OrgAdmin searches for group           | `group-list.spec.ts`       | `OrgAdmin`                    | Use SEEDED_GROUP_NAME            |
| OrgAdmin views group detail           | `group-detail.spec.ts`     | `OrgAdmin`                    | Use SEEDED_GROUP_NAME            |
| OrgAdmin navigates to role from group | `group-detail.spec.ts`     | `OrgAdmin`                    | Requires seeded role attached    |
| OrgAdmin adds member to group         | `group-membership.spec.ts` | `OrgAdmin Lifecycle`          | Use SEEDED_GROUP_NAME            |

## V1 Roles

| Scenario                            | File                      | Describe Block                     | Setup Notes                      |
| ----------------------------------- | ------------------------- | ---------------------------------- | -------------------------------- |
| OrgAdmin creates a role             | `role-management.spec.ts` | `OrgAdmin Lifecycle` (serial)      | Use unique name with TEST_PREFIX |
| OrgAdmin edits a role               | `role-management.spec.ts` | `OrgAdmin Lifecycle` (serial)      | Follows create test              |
| OrgAdmin deletes a role             | `role-management.spec.ts` | `OrgAdmin Lifecycle` (serial)      | Follows edit test                |
| OrgAdmin copies a role              | `role-management.spec.ts` | `OrgAdmin Copy Lifecycle` (serial) | Use SEEDED_ROLE_NAME as source   |
| OrgAdmin sees Create button         | `role-management.spec.ts` | `OrgAdmin`                         | Atomic, no setup needed          |
| OrgAdmin sees Edit/Delete on detail | `role-management.spec.ts` | `OrgAdmin`                         | Use SEEDED_ROLE_NAME             |
| UserViewer gets unauthorized        | `role-management.spec.ts` | `UserViewer`                       | Navigate to URL directly         |
| ReadOnlyUser gets unauthorized      | `role-management.spec.ts` | `ReadOnlyUser`                     | Navigate to URL directly         |
| OrgAdmin views roles list           | `role-list.spec.ts`       | `OrgAdmin`                         | No setup needed                  |
| OrgAdmin searches for role          | `role-list.spec.ts`       | `OrgAdmin`                         | Use SEEDED_ROLE_NAME             |
| OrgAdmin views role detail          | `role-detail.spec.ts`     | `OrgAdmin`                         | Use SEEDED_ROLE_NAME             |

## V1 Users

| Scenario                       | File                      | Describe Block               | Setup Notes              |
| ------------------------------ | ------------------------- | ---------------------------- | ------------------------ |
| OrgAdmin views users list      | `user-list.spec.ts`       | `OrgAdmin`                   | No setup needed          |
| OrgAdmin searches for user     | `user-list.spec.ts`       | `OrgAdmin`                   | Use getSeededUsername()  |
| OrgAdmin views user detail     | `user-list.spec.ts`       | `OrgAdmin`                   | Use getSeededUsername()  |
| OrgAdmin sees invite button    | `user-management.spec.ts` | `OrgAdmin Status Management` | No setup needed          |
| OrgAdmin opens invite modal    | `user-management.spec.ts` | `OrgAdmin Status Management` | No setup needed          |
| OrgAdmin sees bulk actions     | `user-management.spec.ts` | `OrgAdmin Status Management` | Select users first       |
| OrgAdmin invites users         | `user-management.spec.ts` | `OrgAdmin Invitation`        | Mock API response        |
| ReadOnlyUser gets unauthorized | `user-management.spec.ts` | `ReadOnlyUser`               | Navigate to URL directly |

## V2 User Groups

### List & Detail

| Scenario                                     | File                        | Describe Block | Setup Notes           |
| -------------------------------------------- | --------------------------- | -------------- | --------------------- |
| OrgAdmin views user groups list              | `user-group-list.spec.ts`   | `OrgAdmin`     | No setup needed       |
| OrgAdmin searches for user group             | `user-group-list.spec.ts`   | `OrgAdmin`     | Use SEEDED_GROUP_NAME |
| OrgAdmin views group in drawer               | `user-group-detail.spec.ts` | `OrgAdmin`     | Use SEEDED_GROUP_NAME |
| OrgAdmin sees drawer tabs (Users, SA, Roles) | `user-group-detail.spec.ts` | `OrgAdmin`     | Use SEEDED_GROUP_NAME |
| OrgAdmin navigates drawer tabs               | `user-group-detail.spec.ts` | `OrgAdmin`     | Use SEEDED_GROUP_NAME |
| OrgAdmin clicks drawer Edit → edit page      | `user-group-detail.spec.ts` | `OrgAdmin`     | Use SEEDED_GROUP_NAME |
| OrgAdmin closes drawer via X button          | `user-group-detail.spec.ts` | `OrgAdmin`     | Use SEEDED_GROUP_NAME |

### Management (CRUD)

| Scenario                                 | File                            | Describe Block                | Setup Notes                                      |
| ---------------------------------------- | ------------------------------- | ----------------------------- | ------------------------------------------------ |
| OrgAdmin creates a user group            | `user-group-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Use unique name with TEST_PREFIX                 |
| OrgAdmin edits a user group (name/desc)  | `user-group-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Verifies edit page URL, pre-populated form, tabs |
| OrgAdmin deletes a user group            | `user-group-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows edit test                                |
| OrgAdmin sees Create button              | `user-group-management.spec.ts` | `OrgAdmin`                    | Atomic, no setup needed                          |
| OrgAdmin Create button navigates to form | `user-group-management.spec.ts` | `OrgAdmin`                    | Verify empty form, cancel returns                |
| UserViewer gets unauthorized             | `user-group-management.spec.ts` | `UserViewer`                  | Navigate to URL directly                         |
| ReadOnlyUser gets unauthorized           | `user-group-management.spec.ts` | `ReadOnlyUser`                | Navigate to URL directly                         |

### Membership (via Edit Page)

> **Note**: V2 does NOT use modals for membership. Users/service accounts are
> managed through selectable tables on the Edit User Group page.

| Scenario                                   | File                            | Describe Block                         | Setup Notes                            |
| ------------------------------------------ | ------------------------------- | -------------------------------------- | -------------------------------------- |
| Edit page shows selectable users table     | `user-group-membership.spec.ts` | `OrgAdmin - Member Lifecycle` (serial) | Use SEEDED_GROUP_UUID                  |
| OrgAdmin adds member via edit page         | `user-group-membership.spec.ts` | `OrgAdmin - Member Lifecycle` (serial) | Select readonly persona in users table |
| OrgAdmin verifies member in drawer         | `user-group-membership.spec.ts` | `OrgAdmin - Member Lifecycle` (serial) | Follows add, check drawer Users tab    |
| OrgAdmin removes member via edit page      | `user-group-membership.spec.ts` | `OrgAdmin - Member Lifecycle` (serial) | Deselect user, submit                  |
| OrgAdmin verifies member removed in drawer | `user-group-membership.spec.ts` | `OrgAdmin - Member Lifecycle` (serial) | Self-cleaning: member removed at end   |
| Edit page shows SA table                   | `user-group-membership.spec.ts` | `OrgAdmin - Service Accounts`          | Switch to SA tab on edit page          |
| Drawer Edit button → edit page             | `user-group-membership.spec.ts` | `OrgAdmin - Navigation`                | Open drawer, click Edit                |
| Row action Edit → edit page                | `user-group-membership.spec.ts` | `OrgAdmin - Navigation`                | Kebab menu Edit action                 |
| Edit page Cancel → list page               | `user-group-membership.spec.ts` | `OrgAdmin - Navigation`                | Click Cancel, verify URL               |
| Submit disabled when name empty            | `user-group-membership.spec.ts` | `OrgAdmin - Form Validation`           | Clear name, check button state         |
| Duplicate name prevents submission         | `user-group-membership.spec.ts` | `OrgAdmin - Form Validation`           | Enter "Default access"                 |
| UserViewer cannot access edit page         | `user-group-membership.spec.ts` | `UserViewer`                           | Navigate to edit URL directly          |
| ReadOnlyUser cannot access edit page       | `user-group-membership.spec.ts` | `ReadOnlyUser`                         | Navigate to edit URL directly          |

## V2 Roles

| Scenario                       | File                      | Describe Block                | Setup Notes                      |
| ------------------------------ | ------------------------- | ----------------------------- | -------------------------------- |
| OrgAdmin creates a role        | `role-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Use unique name with TEST_PREFIX |
| OrgAdmin edits a role          | `role-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows create test              |
| OrgAdmin deletes a role        | `role-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows edit test                |
| OrgAdmin sees Create button    | `role-management.spec.ts` | `OrgAdmin`                    | Atomic, no setup needed          |
| UserViewer gets unauthorized   | `role-management.spec.ts` | `UserViewer`                  | Navigate to URL directly         |
| ReadOnlyUser gets unauthorized | `role-management.spec.ts` | `ReadOnlyUser`                | Navigate to URL directly         |
| OrgAdmin views roles list      | `role-list.spec.ts`       | `OrgAdmin`                    | No setup needed                  |
| OrgAdmin searches for role     | `role-list.spec.ts`       | `OrgAdmin`                    | Use SEEDED_ROLE_NAME             |
| OrgAdmin views role in drawer  | `role-detail.spec.ts`     | `OrgAdmin`                    | Use SEEDED_ROLE_NAME             |

## V2 Users

| Scenario                        | File                  | Describe Block | Setup Notes              |
| ------------------------------- | --------------------- | -------------- | ------------------------ |
| OrgAdmin views users list       | `user-list.spec.ts`   | `OrgAdmin`     | No setup needed          |
| OrgAdmin filters by username    | `user-list.spec.ts`   | `OrgAdmin`     | Use getSeededUsername()  |
| OrgAdmin views user in drawer   | `user-list.spec.ts`   | `OrgAdmin`     | Use getSeededUsername()  |
| UserViewer views users list     | `user-list.spec.ts`   | `UserViewer`   | No setup needed          |
| UserViewer views user in drawer | `user-list.spec.ts`   | `UserViewer`   | Use getSeededUsername()  |
| ReadOnlyUser gets unauthorized  | `user-list.spec.ts`   | `ReadOnlyUser` | Navigate to URL directly |
| OrgAdmin invites users          | `user-invite.spec.ts` | `OrgAdmin`     | Mock API response        |
| UserViewer cannot invite        | `user-invite.spec.ts` | `UserViewer`   | Check button disabled    |

## V1 Workspaces

| Scenario                           | File                     | Describe Block | Setup Notes      |
| ---------------------------------- | ------------------------ | -------------- | ---------------- |
| OrgAdmin views workspaces list     | `workspace-list.spec.ts` | `OrgAdmin`     | No setup needed  |
| UserViewer views workspaces list   | `workspace-list.spec.ts` | `UserViewer`   | Read-only access |
| ReadOnlyUser views workspaces list | `workspace-list.spec.ts` | `ReadOnlyUser` | Read-only access |

## V2 Workspaces

### List & Management

| Scenario                            | File                           | Describe Block                | Setup Notes                              |
| ----------------------------------- | ------------------------------ | ----------------------------- | ---------------------------------------- |
| OrgAdmin creates a workspace        | `workspace-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Use TEST_PREFIX, select parent workspace |
| OrgAdmin edits a workspace          | `workspace-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows create test                      |
| OrgAdmin deletes a workspace        | `workspace-management.spec.ts` | `OrgAdmin Lifecycle` (serial) | Follows edit test                        |
| OrgAdmin sees Create button         | `workspace-management.spec.ts` | `OrgAdmin`                    | Atomic, no setup needed                  |
| UserViewer Create button disabled   | `workspace-management.spec.ts` | `UserViewer`                  | Lacks `inventory:groups:write`           |
| ReadOnlyUser Create button disabled | `workspace-management.spec.ts` | `ReadOnlyUser`                | Lacks `inventory:groups:write`           |
| OrgAdmin views workspaces list      | `workspace-list.spec.ts`       | `OrgAdmin`                    | No setup needed                          |
| OrgAdmin searches for workspace     | `workspace-list.spec.ts`       | `OrgAdmin`                    | Use SEEDED_WORKSPACE_NAME                |
| UserViewer views workspaces list    | `workspace-list.spec.ts`       | `UserViewer`                  | Read-only access                         |
| ReadOnlyUser views workspaces list  | `workspace-list.spec.ts`       | `ReadOnlyUser`                | Read-only access                         |

### Detail Page

| Scenario                                       | File                       | Describe Block  | Setup Notes                                          |
| ---------------------------------------------- | -------------------------- | --------------- | ---------------------------------------------------- |
| OrgAdmin views workspace detail                | `workspace-detail.spec.ts` | `OrgAdmin`      | Use SEEDED_WORKSPACE_NAME                            |
| OrgAdmin views roles tab                       | `workspace-detail.spec.ts` | `OrgAdmin`      | Use SEEDED_WORKSPACE_NAME                            |
| OrgAdmin views inherited tab                   | `workspace-detail.spec.ts` | `OrgAdmin`      | Use SEEDED_WORKSPACE_NAME                            |
| OrgAdmin views assets tab                      | `workspace-detail.spec.ts` | `OrgAdmin`      | Use SEEDED_WORKSPACE_NAME                            |
| Actions menu shows expected items              | `workspace-detail.spec.ts` | `OrgAdmin`      | Verify Edit, Move, Delete, Grant Access              |
| Workspace hierarchy displays full path         | `workspace-detail.spec.ts` | `OrgAdmin`      | Breadcrumb shows Root → Default → Seeded             |
| Navigate via breadcrumb to parent              | `workspace-detail.spec.ts` | `OrgAdmin`      | Click parent link, verify navigation                 |
| Navigate via breadcrumb to root                | `workspace-detail.spec.ts` | `OrgAdmin`      | Click root link, verify navigation                   |
| Nested workspace shows 4-level hierarchy       | `workspace-detail.spec.ts` | `OrgAdmin`      | Use SEEDED_CHILD_WORKSPACE_NAME                      |
| Walk hierarchy child to root                   | `workspace-detail.spec.ts` | `OrgAdmin`      | Step-by-step navigation through all levels           |
| Actions menu items disabled for Root workspace | `workspace-detail.spec.ts` | `OrgAdmin`      | Edit, Move, Delete disabled for protected workspace  |
| Assets tab link URL validation                 | `workspace-detail.spec.ts` | `OrgAdmin`      | Verify href points to inventory with workspace param |
| WorkspaceUser views workspace detail           | `workspace-detail.spec.ts` | `WorkspaceUser` | Read-only access                                     |
| Actions menu not visible                       | `workspace-detail.spec.ts` | `WorkspaceUser` | Non-admin cannot see actions                         |
| Grant access button not visible                | `workspace-detail.spec.ts` | `WorkspaceUser` | Non-admin cannot grant access                        |

### Role Bindings

| Scenario                                | File                              | Describe Block                       | Setup Notes                       |
| --------------------------------------- | --------------------------------- | ------------------------------------ | --------------------------------- |
| Seeded workspace shows seeded group     | `workspace-role-bindings.spec.ts` | `OrgAdmin — Direct role bindings`    | Use SEEDED_GROUP_NAME             |
| Child workspace shows child group       | `workspace-role-bindings.spec.ts` | `OrgAdmin — Direct role bindings`    | Use SEEDED_CHILD_WORKSPACE_NAME   |
| View group details drawer               | `workspace-role-bindings.spec.ts` | `OrgAdmin — Direct role bindings`    | Open drawer from role assignments |
| Close group details drawer              | `workspace-role-bindings.spec.ts` | `OrgAdmin — Direct role bindings`    | Verify drawer closes              |
| Child workspace shows inherited groups  | `workspace-role-bindings.spec.ts` | `OrgAdmin — Inherited role bindings` | Use SEEDED_CHILD_WORKSPACE_NAME   |
| Inherited from column shows parent link | `workspace-role-bindings.spec.ts` | `OrgAdmin — Inherited role bindings` | Verify parent workspace name      |
| Inherited group opens drawer            | `workspace-role-bindings.spec.ts` | `OrgAdmin — Inherited role bindings` | Drawer shows roles/users tabs     |
| Drawer shows inherited from cell        | `workspace-role-bindings.spec.ts` | `OrgAdmin — Inherited role bindings` | Parent workspace in roles table   |
| Direct groups not in inherited tab      | `workspace-role-bindings.spec.ts` | `OrgAdmin — Inherited role bindings` | Child group only in direct tab    |

---

## Data Setup Reference

| Data Type                   | How to Get                                   | When to Use                                |
| --------------------------- | -------------------------------------------- | ------------------------------------------ |
| Seeded Group (V1)           | `getSeededGroupName('v1')`                   | Read-only tests, viewer tests              |
| Seeded Group (V2)           | `getSeededGroupName('v2')`                   | Read-only tests, viewer tests              |
| Seeded Role (V1)            | `getSeededRoleName('v1')`                    | Read-only tests, viewer tests              |
| Seeded Role (V2)            | `getSeededRoleName('v2')`                    | Read-only tests, viewer tests              |
| Seeded Workspace (V2)       | `getSeededWorkspaceName('v2')`               | Read-only tests, viewer tests              |
| Seeded Child Workspace (V2) | `getSeededChildWorkspaceName('v2')`          | Nested workspace tests (4 levels deep)     |
| Seeded User                 | `getSeededUsername()`                        | User search/filter tests, membership tests |
| New Entity                  | Create in serial lifecycle                   | CRUD lifecycle tests only                  |
| Auth State                  | `AUTH_V1_ORGADMIN`, `AUTH_V2_ORGADMIN`, etc. | All tests via `test.use()`                 |
| Test Prefix (V1)            | `process.env.TEST_PREFIX_V1`                 | Creating new V1 entities                   |
| Test Prefix (V2)            | `process.env.TEST_PREFIX_V2`                 | Creating new V2 entities                   |

---

## Auth Fixtures

| Persona       | V1 Fixture           | V2 Fixture              |
| ------------- | -------------------- | ----------------------- |
| OrgAdmin      | `AUTH_V1_ORGADMIN`   | `AUTH_V2_ORGADMIN`      |
| UserViewer    | `AUTH_V1_USERVIEWER` | `AUTH_V2_USERVIEWER`    |
| ReadOnlyUser  | `AUTH_V1_READONLY`   | `AUTH_V2_READONLY`      |
| RbacAdmin     | N/A                  | `AUTH_V2_RBACADMIN`     |
| WorkspaceUser | N/A                  | `AUTH_V2_WORKSPACEUSER` |
