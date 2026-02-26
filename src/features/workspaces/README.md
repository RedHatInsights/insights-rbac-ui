# workspaces

**API generation:** v2 (`@redhat-cloud-services/rbac-client/v2`)

Workspace management for the new Access Management model. Workspaces are hierarchical resource containers. Access is granted by assigning roles to groups at a specific workspace level.

## Sub-features

- `overview/` — workspace list with create/edit/delete actions; entry point for the workspaces section
  - `components/EnableWorkspacesAlert` — banner shown on the overview page when the org is eligible but hasn't enabled workspaces yet
- `workspace-detail/` — detail view for a single workspace showing its role bindings and group assignments
  - `components/GroupDetailsDrawer` — slide-in drawer with group member and role details
  - `components/BaseGroupAssignmentsTable` — shared table for group→role binding display (also used by `organization-management`)
- `create-workspace/` — wizard for creating a new workspace under a parent
- `grant-access/` — modal for granting a group access to a workspace by selecting a role
- `components/managed-selector/` — the **federated workspace selector** component, exposed via module federation for use in other console apps. Has its own Zustand store for selection state.
- `hooks/` — workspace-specific hooks (e.g. `useWorkspacesFlag`)

## Data

All fetching uses hooks from `src/data/queries/workspaces.ts`. See `workspacesKeys` for the query key factory.

**Known constraint:** the role bindings API uses cursor-based pagination. Pages that need to show all bindings (workspace detail, organization management) fetch a high limit (1000) and paginate client-side. True server-side pagination requires cursor iteration — not yet implemented.

## Permission model

v2 uses **Kessel access checks** via `@project-kessel/react-kessel-access-check`, not `orgAdmin`. Permissions are resolved per workspace, per relation.

**Six relations:** `view` | `edit` | `delete` | `create` | `move` | `rename`

**The hooks (use these, don't call `useSelfAccessCheck` directly):**

```ts
// All workspaces + all their permissions in one shot:
const { workspaces, canEditAny, canCreateAny, isLoading } = useWorkspacesWithPermissions();
// Each workspace has ws.permissions.{ view, edit, delete, create, move, rename }

// Just the permission layer, if you already have workspaces:
const { permissionsFor, hasPermission, canEdit, canCreateIn } = useWorkspacePermissions(workspaces);
permissionsFor(ws.id)           // → WorkspacePermissions record
hasPermission(ws.id, 'delete')  // → boolean
```

**Propagation (PR1 — Kessel Permission Guards):** Permissions are now checked across all workspace surfaces:
- **List table:** name link gated on `view`, row actions use correct per-action relations (`rename` for edit, `move` for move, `delete` for delete, `create` for sub-workspace)
- **Create workspace:** parent selector passes `requiredPermission="create"` to `ManagedWorkspaceSelector`
- **Detail page:** renders `<UnauthorizedAccess>` when `view` is denied; `WorkspaceActions` menu items disabled per relation
- **Edit modal:** redirects if `rename` permission is denied (direct URL guard)

**Role binding permission mapping (MVP):**

| Operation | MVP Kessel relation | Post-MVP relation |
|-----------|-------------------|-------------------|
| View role bindings | `view` | `role_binding_view` |
| Create role binding | `create` | `role_binding_create` |
| Revoke role binding | `delete` | `role_binding_revoke` |

## Federated modules

`components/managed-selector/` is exposed as a federated module (`./WorkspaceSelector`). Changes to its public API or props must be coordinated with consuming apps. Its Storybook story (`WorkspaceSelector.stories.tsx`) in `src/federated-modules/` serves as the isolated dev environment.
