# roles

**API generation:** v1 (`@redhat-cloud-services/rbac-client`)

Full CRUD for roles in the v1 User Access model. A role is a named collection of permissions (access rules) that can be assigned to groups.

## Sub-features

- `add-role/` — multi-step wizard for creating a role with permissions and resource definitions
- `add-role-permissions/` — step within the wizard for selecting permissions
- `edit-role/` — edit role name, description, and access rules
- `role/` — role detail page showing assigned groups and permissions
  - `components/` — detail-page-specific components
- `components/` — shared presentational components across role pages
- `utils/` — role-specific utilities (permission filtering, resource definition helpers)

## Data

All fetching uses hooks from `src/data/queries/roles.ts`. See `rolesKeys` for the query key factory. Mutations invalidate at `rolesKeys.all`.

Form submission uses the type-safe form guard pattern — see `AddRoleWizard.tsx` for the canonical `isAddRoleFormData` implementation and [Type-Safe Form Submission](../../docs/TypeSafeFormSubmission.mdx).

## Constraints

- v1 API types are broken — use `(api.method as any)`. See [API Client Patterns](../../docs/APIClientPatterns.mdx).
- Permission model: `orgAdmin` gates all mutations. `isProd()` disables destructive actions.
- System roles (shipped by Red Hat) cannot be edited or deleted — check the `system` flag before rendering edit/delete actions.
