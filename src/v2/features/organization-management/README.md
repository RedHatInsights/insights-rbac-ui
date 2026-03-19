# organization-management

**API generation:** v2 (`@redhat-cloud-services/rbac-client/v2`)

Displays role bindings assigned at the **organization level** — the root resource above all workspaces. Shows which groups have been granted which roles across the entire organization.

## Behavior

- Fetches the current organization's ID via `useOrganizationData()`.
- Queries role bindings with `resourceType: 'organization'` and `subjectType: 'group'` using `useRoleBindingsQuery`.
- Renders results in `BaseGroupAssignmentsTable` (shared with workspace detail).

## Known Limitation

The role bindings API uses cursor-based pagination with no offset support. To avoid N+1 cursor iteration, this page fetches up to 1000 bindings in a single request and paginates/filters client-side. True server-side pagination requires cursor walking — tracked as a separate feature.

## Permission model

V2 uses **Kessel domain hooks** from `src/v2/hooks/useRbacAccess.ts`, not V1 patterns.

Route access is gated by `v2Guard([assignments.canView])` in `src/v2/Routing.tsx`, which checks `rbac_assignments_read` on the tenant resource via Kessel. CRUD actions on the role bindings table use `useAssignmentsAccess()`:

| Action | Kessel relation |
|--------|-----------------|
| View/list org role bindings | `rbac_assignments_read` |
| Grant access | `rbac_assignments_write` |
| Edit access | `rbac_assignments_write` |
| Revoke access | `rbac_assignments_write` |

Org admins have these permissions by default. Non-org-admin users with explicitly granted `rbac_assignments_read`/`rbac_assignments_write` can also access this page.

## Constraints

- This island has a single component (`OrganizationManagement.tsx`) with no sub-features yet.
