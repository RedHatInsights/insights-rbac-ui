# my-access (V2)

**API generation:** V1 Groups API + V2 Workspaces API + Kessel permissions

Self-service page where users view their own group memberships and workspace assignments. Route: `/my-access`.

## Behavior

Two route-based tabs (following the `UsersAndUserGroups` pattern):

### My groups (default tab)

- Lists groups the current user belongs to via `useGroupsQuery({ username })`.
- Columns: Group name, Description.
- Row click opens `MyGroupDrawer` showing assigned roles + workspace for each role (via `useGroupRoleBindingsQuery` from `src/v2/data/queries/roleBindings.ts`).

### My workspaces

- Lists workspaces the user has edit access to via `useWorkspacesWithPermissions()`, filtered to `permissions.edit === true`.
- Columns: Workspace name (links to workspace detail), Admin/Viewer role badge.
- Admin/Viewer is derived from Kessel permissions: `delete` or `create` = Admin, otherwise Viewer.
- Row click opens `MyWorkspaceDrawer` showing role bindings for the user in that workspace (via `useRoleBindingsQuery`).

## Components

- `MyAccess.tsx` — tab layout container (PageHeader + Tabs + Outlet)
- `my-groups/MyGroups.tsx` — groups tab with TableView
- `my-groups/MyGroupDrawer.tsx` — simplified drawer (roles only, no edit)
- `my-workspaces/MyWorkspaces.tsx` — workspaces tab with TableView
- `my-workspaces/MyWorkspaceDrawer.tsx` — drawer with Admin/Viewer badge + roles table

## Routes

| Path | Component |
|------|-----------|
| `/my-access` | `MyAccess` (redirects to groups) |
| `/my-access/groups` | `MyGroups` |
| `/my-access/workspaces` | `MyWorkspaces` |

## APIs called

- `GET /api/rbac/v1/groups/?username=<current>` — user's groups
- `GET /api/rbac/v2/role-bindings/?subject_type=group&subject_id=<id>` — group's role bindings
- `GET /api/rbac/v2/workspaces/` — all visible workspaces
- `POST /api/rbac/v2/role-bindings/list-by-subject` — role bindings per workspace for current user
- Kessel `/checkselfbulk` — workspace permission checks (view, edit, delete, create, move)

## Constraints

- Read-only page — no mutations.
- Workspace tab filters out workspaces where user only has view permission (parent workspaces they can't act on).
