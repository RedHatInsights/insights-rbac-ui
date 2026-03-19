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
- **`usePrincipalsAccess()`** — users tab: list users; `canInvite`, `canDelete`, `canToggleOrgAdmin` come from `useIdentity().orgAdmin` in `src/shared/hooks/useIdentity.ts`

**Data layer:** V2 owns its own data layer in `src/v2/data/queries/` (roles, groups). Shared APIs (users, permissions, service accounts) live in `src/shared/data/queries/`. No cross-version imports (enforced by `rbac-local/no-cross-version-imports`).

## Constraints

- **Do not merge with `src/features/users/` or `src/features/groups/`** — both API generations must coexist until v1 is retired.
- Create/edit/delete user groups on the Groups tab is gated by `useGroupsAccess` (`rbac_groups_write`), not `orgAdmin` or `userAccessAdministrator`.
- Navigation between tabs uses `replace: true` to avoid polluting the browser history stack.
