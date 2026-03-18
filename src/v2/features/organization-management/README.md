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

V2 uses **Kessel domain hooks** from `src/v2/hooks/useRbacAccess.ts`, not V1 patterns. For organization-level role bindings, access is gated by the same Kessel relations used for workspace role bindings. `useIdentity()` from `src/shared/hooks/useIdentity.ts` provides `orgAdmin` when needed.

## Constraints

- This island has a single component (`OrganizationManagement.tsx`) with no sub-features yet.
