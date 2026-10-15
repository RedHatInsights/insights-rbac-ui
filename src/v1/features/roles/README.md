# roles

**API generation:** v1 (`@redhat-cloud-services/rbac-client`)

Full CRUD for roles in the v1 User Access model. A role is a named collection of permissions (access rules) that can be assigned to groups.

## File structure

```
src/v1/features/roles/
├── add-role/              # AddRoleWizard (V1, DDF-based)
├── role/                  # Role detail page
├── components/            # RolesTable, RolesEmptyState, RoleCreationSuccess
├── utils/                 # roleVisibility
├── add-role-permissions/   # Add permissions to existing role wizard
├── types.ts               # V1 role types
├── permissionWizardHelper.tsx
├── Roles.tsx              # V1 roles list page
├── EditRoleModal.tsx
├── RemoveRoleModal.tsx
├── EditResourceDefinitionsModal.tsx
├── RoleResourceDefinitions.tsx
└── ...
```

## Data

All fetching uses hooks from `src/v1/data/queries/roles.ts`. See `rolesKeys` for the query key factory. Mutations invalidate at `rolesKeys.all`.

Hooks: `useRolesQuery`, `useRoleQuery`, `useCreateRoleMutation`, `usePatchRoleMutation`, `useDeleteRoleMutation`, etc.

API layer: `src/v1/data/api/roles.ts`

Form submission uses the type-safe form guard pattern — see `AddRoleWizard.tsx` for the canonical `isAddRoleFormData` implementation and [Type-Safe Form Submission](../../../docs/TypeSafeFormSubmission.mdx).

## Constraints

- v1 API types are broken — use `(api.method as any)`. See [API Client Patterns](../../../docs/APIClientPatterns.mdx).
- Permission model: `orgAdmin` gates all mutations. `isProd()` disables destructive actions.
- System roles (shipped by Red Hat) cannot be edited or deleted — check the `system` flag before rendering edit/delete actions.
