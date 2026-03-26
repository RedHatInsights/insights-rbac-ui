# workspaces

**API generation:** v2 (`@redhat-cloud-services/rbac-client/v2`)

Workspace management for the new Access Management model. Workspaces are hierarchical resource containers. Access is granted by assigning roles to groups at a specific workspace level.

## Sub-features

- `overview/` — workspace list with create/edit/delete actions; entry point for the workspaces section
  - `components/EnableWorkspacesAlert` — banner shown on the overview page when the org is eligible but hasn't enabled workspaces yet
- `workspace-detail/` — detail view for a single workspace showing its role bindings and group assignments
  - `components/GroupDetailsDrawer` — slide-in drawer with group member and role details
  - `components/BaseGroupAssignmentsTable` — shared table for group→role binding display (also used by `organization-management`)
  - `components/RoleAccessModal` — route-driven modal (`role-access/:groupId`, child of workspace-detail) for editing which roles a group has in a workspace. Split into route wrapper (`RoleAccessModal` — fetches group, workspace, roles, bindings) and pure UI (`RoleAccessModalContent` — `useTableState` over the in-memory roles list). Calls `useUpdateGroupRolesMutation` on save.
- `create-workspace/` — wizard for creating a new workspace under a parent. After the POST succeeds, a **progress modal** (`WaitForWorkspaceReady`) polls the Kessel `/checkselfbulk` endpoint every 1s for all 5 workspace relations (`view`, `edit`, `delete`, `create`, `move`). SpiceDB replication can cause permission checks to flap (returning `true` then `false` before settling), so the modal requires **5 consecutive** "all allowed" responses (`CONSECUTIVE_SUCCESS_THRESHOLD`) before declaring the workspace ready. Only once the threshold is met does the user see the success state and navigate back. The `useWorkspaceReadyCheck` hook drives the polling; the mutation uses `deferSuccessSideEffects` to delay cache invalidation and the success notification until the user clicks "Close".
- `grant-access/` — modal for granting a group access to a workspace by selecting a role
- `components/managed-selector/` — the **federated workspace selector** component, exposed via module federation for use in other console apps. Has its own Zustand store for selection state.
- `hooks/` — workspace-specific hooks (e.g. `useWorkspacesFlag`)

## Data

All fetching uses hooks from `src/data/queries/workspaces.ts`. See `workspacesKeys` for the query key factory.

**Known constraint:** the role bindings API uses cursor-based pagination. Pages that need to show all bindings (workspace detail, organization management) fetch a high limit (1000) and paginate client-side. True server-side pagination requires cursor iteration — not yet implemented.

## Permission model

V2 uses **Kessel domain hooks** from `src/v2/hooks/useRbacAccess.ts`, not V1 patterns. Chrome identity (`orgAdmin`) comes from `useIdentity` (shared). Permissions are resolved per workspace, per relation.

- **`useWorkspaceTenantAccess()`** — tenant-level workspace permissions (view, edit, create, delete, move); fetches org ID internally
- **`useRoleBindingsAccess(workspaceId)`** — role binding operations (view, grant, revoke, update)

Workspace-specific hooks below call Kessel directly; V2 code cannot import from V1 (enforced by `rbac-local/no-cross-version-imports`).

**Five relations:** `view` | `edit` | `delete` | `create` | `move`

**The hooks (use these, don't call `useSelfAccessCheck` directly):**

```ts
// All workspaces + all their permissions in one shot:
const { workspaces, canEditAny, canCreateAny, isLoading } = useWorkspacesWithPermissions();
// Each workspace has ws.permissions.{ view, edit, delete, create, move }

// Just the permission layer, if you already have workspaces:
const { permissionsFor, hasPermission, canEdit, canCreateIn } = useWorkspacePermissions(workspaces);
permissionsFor(ws.id)           // → WorkspacePermissions record
hasPermission(ws.id, 'delete')  // → boolean
```

**Workspace-type constraints (RHCLOUD-39826):** `useWorkspacePermissions` applies workspace-type constraints on top of Kessel results before exposing permissions to consumers. Kessel doesn't model type-based constraints, so the hook acts as defense-in-depth:

| Type | view | edit | create | move | delete |
|------|------|------|--------|------|--------|
| root | yes | **no** | **no** | **no** | **no** |
| default | yes | yes | yes | **no** | **no** |
| ungrouped-hosts | yes | **no** | **no** | **no** | **no** |
| standard | yes | yes | yes | yes | yes |

The rules are defined in `workspaceTypes.ts` (`canEditType`, `canMoveType`, `canDeleteType`, `canCreateInType`) and applied inside the hook's `allowedIds` memo. Consumers (list table, detail page, etc.) do not need their own type guards — `hasPermission()` and `permissionsFor()` already return the correct answer.

**Feature flag bypass:** When `platform.rbac.workspaces.trust-kessel-permissions` is **ON**, the hook skips type-constraint filtering and trusts Kessel as the sole authority — `hasPermission()` returns raw Kessel results. When **OFF** (default), the defense-in-depth filtering above is applied. Flip the flag once the backend enforces these constraints natively.

**Propagation (PR1 — Kessel Permission Guards):** Permissions are now checked across all workspace surfaces:
- **List table:** name link gated on `view`, row actions use correct per-action relations (`edit` for edit, `move` for move, `delete` for delete, `create` for sub-workspace)
- **Create workspace:** parent selector passes `requiredPermission="create"` to `ManagedWorkspaceSelector`
- **Detail page:** renders `<UnauthorizedAccess>` when `view` is denied; `WorkspaceActions` menu items disabled per relation; delete calls `useDeleteWorkspaceMutation` and navigates to list; move uses `MoveWorkspaceDialog` + `useMoveWorkspaceMutation`; create-subworkspace navigates to wizard with pre-selected parent; hierarchy breadcrumb gates links on `view` permission
- **Edit modal:** protected by `v2WorkspaceGuard('edit')` route guard in Routing.tsx

**Role binding permission mapping (MVP):**

| Operation | MVP Kessel relation | Post-MVP relation |
|-----------|-------------------|-------------------|
| View role bindings | `view` | `role_binding_view` |
| Create role binding (Grant access) | `create` | `role_binding_create` |
| Edit role binding (Edit access modal) | `create` | `role_binding_update` |
| Revoke role binding (Remove from workspace) | `delete` | `role_binding_revoke` |

**Enforcement points:**
- **Toolbar "Grant access" button** (`BaseGroupAssignmentsTable`): `canGrantAccess` prop, gated on `create` + M4 flag
- **Row kebab "Edit access"** (`BaseGroupAssignmentsTable`): `canEditAccess` prop, gated on `create`
- **Row kebab "Remove from workspace"** (`BaseGroupAssignmentsTable`): `canRevokeAccess` prop, gated on `delete`
- **Drawer "Edit access" / "Remove from workspace" buttons** (`GroupDetailsDrawer`): same props, passed through
- **`RoleAccessModal`** (route-driven): Kessel `create` permission guard — redirects back if denied (direct URL defense)

## Federated modules

`components/managed-selector/` is exposed as a federated module (`./WorkspaceSelector`). Changes to its public API or props must be coordinated with consuming apps. Its Storybook story (`WorkspaceSelector.stories.tsx`) in `src/federated-modules/` serves as the isolated dev environment.
