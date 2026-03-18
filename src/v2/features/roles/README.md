# roles

**API generation:** v2 (native V2 roles API)

Roles in the V2 Access Management model. Uses cursor-based pagination, workspace-aware role bindings, and Kessel-based permissions.

## File structure

```
src/v2/features/roles/
├── add-role/                    # AddRoleWizard (V2, uses V2 API)
├── components/                  # RolePermissionsTable, AssignedUserGroupsTable, RolesEmptyState, RoleCreationSuccess
├── edit-role/                   # EditRole page
├── RolesWithWorkspaces.tsx      # V2 roles list page
├── RolesWithWorkspacesDetails.tsx  # Role detail drawer
└── useRolesWithWorkspaces.ts    # V2 roles business logic hook
```

## Data

All fetching uses hooks from `src/v2/data/queries/roles.ts`. See `rolesV2Keys` for the query key factory.

Hooks: `useRolesV2Query`, `useRoleQuery`, `useCreateRoleMutation`, `useBatchDeleteRolesV2Mutation`, etc.

API layer: `src/v2/data/api/roles.ts`

## Permissions

`useRolesAccess` (from `src/v2/hooks/useRbacAccess.ts`) provides tenant-scoped checks: `canCreate`, `canView`, `canList`, `canUpdate`, `canDelete`. These check `rbac_roles_read` / `rbac_roles_write` against the org (tenant) resource in Kessel.

`useRolePermissions` (from `hooks/useRolePermissions.ts`) combines the tenant-scoped write check with a data-level guard using `org_id`:

- `org_id: undefined` → system/canned role, immutable regardless of tenant permission
- `org_id: string` → user-created role, editable/deletable if `canUpdate`/`canDelete` is true

The `org_id` field is fetched as part of the roles list query (`fields` param includes `org_id`). The `Role` type from `@redhat-cloud-services/rbac-client` (v7+) includes `org_id?: string`.

V2 role permissions use Kessel domain hooks only. Chrome identity (orgAdmin) comes from `useIdentity` (shared).

## V1 API delegation

Some V2 add-role wizard components (cost resources, inventory groups, permissions) currently delegate to V1 APIs via thin wrappers in `src/v2/data/queries/`. These will be migrated to V2 APIs when available.
