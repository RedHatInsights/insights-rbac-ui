# access-management

**API generation:** v2 (workspaces model)

The v2 equivalent of `src/features/users/` and `src/features/groups/` combined. Near feature parity with v1. Entry point is the "Users and User Groups" tabbed page under Access Management.

## Sub-features

### users-and-user-groups/

Top-level container (`UsersAndUserGroups.tsx`) — owns the Users / User Groups tab bar, routes to child pages via `<Outlet>`.

**users/**

- `Users.tsx` — paginated, filterable user list
- `user-detail/UserDetailsDrawer` — slide-in drawer with tabs: groups the user belongs to, roles
- `add-user-to-group/AddUserToGroupModal` — add an existing user to a group
- `remove-user-from-group/RemoveUserFromGroupModal` — remove a user from a group
- `components/UsersTable` — table with row actions
- `components/BulkDeactivateUsersModal` — multi-user deactivation

**user-groups/**

- `UserGroups.tsx` — paginated, filterable group list
- `user-group-detail/` — detail tabs: users in the group, service accounts, roles
- `edit-user-group/EditUserGroup` — edit group name/description
- `edit-user-group/EditUserGroupUsers` — add/remove users from a group
- `edit-user-group/EditUserGroupServiceAccounts` — add/remove service accounts
- `edit-user-group/EditUserGroupUsersAndServiceAccounts` — combined add members view
- `components/GroupDetailsDrawer` — slide-in drawer for quick group inspection
- `components/DeleteGroupModal` — group deletion confirmation

## Permission model

V2 uses **Kessel domain hooks** from `src/v2/hooks/useRbacAccess.ts`, not V1 patterns. Chrome identity (`orgAdmin`) comes from `useIdentity` (shared):

- **`useGroupsAccess()`** — groups tab: create/edit/delete, add/remove members (`rbac_groups_read`, `rbac_groups_write`)
- **`useRolesAccess()`** — roles tab in user detail drawer: list/view roles (`rbac_roles_read`), create/edit/delete (`rbac_roles_write`)
- **`usePrincipalsAccess()`** — users tab: list users; `canInvite`, `canDelete`, `canToggleOrgAdmin` come from `useIdentity().orgAdmin` in `src/shared/hooks/useIdentity.ts`

**Tab gating in `UserDetailsDrawer`:** The user detail drawer conditionally renders tabs based on permissions — the groups tab requires `useGroupsAccess().canList` and the roles tab requires `useRolesAccess().canList`. Tabs the user cannot access are hidden entirely so the underlying queries never fire, avoiding 403 errors.

**Data layer:** V2 owns its own data layer in `src/v2/data/queries/` (roles, groups). Shared APIs (users, permissions, service accounts) live in `src/shared/data/queries/`. No cross-version imports (enforced by `rbac-local/no-cross-version-imports`).

## Constraints

- **Do not merge with `src/features/users/` or `src/features/groups/`** — both API generations must coexist until v1 is retired.
- Create/edit/delete user groups on the Groups tab is gated by `useGroupsAccess` (`rbac_groups_write`), not `orgAdmin` or `userAccessAdministrator`.
- Navigation between tabs uses `replace: true` to avoid polluting the browser history stack.
- **Manage Support Cases column**: Visible only when the `platform.rbac.common-auth-model` flag is on **and** `orgAdmin && !isITLess`. The toggle state is the presence/absence of `portal_manage_cases` in each user's `permissions` array. Permissions for the **whole page** are fetched in a **single** `POST /account/v1/accounts/{org_id}/users/search` (body `{ by: { ids: [...] } }`) via the shared `useSupportCasesPermissions(users, { enabled })` hook (which wraps `useAccountUsersPermissionsQuery`) — not one GET per row, which would hit the account API rate limit. `useSupportCasesPermissions` is the single entry point for this orchestration: any page rendering `SupportCasesToggle` must call it with the same visibility gate, or the toggle silently disables itself (no seeded cache entry). That bulk query seeds the per-user cache `SupportCasesToggle` reads (cache-only) and threads its loading state down as a prop (for the spinner). The toggle disables itself whenever its cache entry is missing — so a cold bulk-fetch failure (nothing seeded) disables it, while a failed *background* refetch (cache still populated) leaves it usable. Toggling is a read-modify-write: it adds/removes `portal_manage_cases` from the array and `POST`s the result back to `.../users/{user_id}`. The POST body contains only the `permissions` array — not the full user object (sending other fields like `id`/`username`/`roles` is rejected with a 400). `accounts/{X}` is `org_id` from the JWT (not `account_id`). The account API is not available in ITLess/FedRAMP environments — column is hidden. See `SupportCasesToggle` in `src/shared/components/`.
- **Manage Support Cases at invite time**: The V2 invite flow reuses the common-auth invite modal (`src/shared/components/invite-users/invite-users-modal-common-auth.tsx`), which exposes a "Manage support cases" checkbox (hidden in ITLess/FedRAMP via `!isITLess`). It is a shipped field, independent of the advanced-permissions flag. The permission is granted in a **single call** — `useInviteUsersMutation` adds `portal_manage_cases` to the `permissions` **string array** in the invite POST body (e.g. `{ emails, localeCode, roles?, permissions: ['portal_manage_cases'] }`). The IT Account API models portal permissions as a flat array of permission-code strings; sending them as top-level boolean fields (`portal_manage_cases: true`) is rejected with 400 "Failed to read request". There is no follow-up POST or polling.

## Service access tokens

The Service Accounts selection and detail tables share SAT presentation with `platform.service-accounts.sat` enabled. SSO selection responses identify SATs with `type: 'service_access_token'`; RBAC group-principal responses use `service_account_type: 'service_access_token'` (insights-rbac PR #3524). Missing and unrecognized values retain regular service-account presentation. SATs show a blue Token label and the CIAM-12578 login username (`|service-account-${clientId}`) in the Client ID / Username column. Selection and membership mutations always use the original client ID and `type: 'service-account'`; the UI never creates a second row for the underlying service account or reads credentials. Flag-off preserves existing labels and identifiers.

The existing SSO selection API and RBAC membership API remain separate. Type filtering across pages requires a server-side contract and is tracked independently in RHCLOUD-52279.

For existing group memberships, the edit form passes RBAC `service_account_type` values separately from client IDs so preselected rows keep their Token presentation when the SSO list has no matching account or omits its type. Selection diffs and mutation payloads remain client-ID strings.
