# organization-management

**API generation:** v2 (`@redhat-cloud-services/rbac-client/v2`)

Displays role bindings assigned at the **organization level** — the root resource above all workspaces. Shows which groups have been granted which roles across the entire organization. Supports granting organization-wide access via the shared `GrantAccessWizard`.

## Behavior

- Fetches the current organization's ID via `useOrganizationData()`.
- Queries role bindings with `resourceType: 'tenant'` and `resource.tenant.org_id` using `useOrgGroups`.
- Renders results in `BaseGroupAssignmentsTable` (shared with workspace detail).
- Passes `currentWorkspace` with `type: 'tenant'` and `id: redhat/<orgId>` to enable grant/edit/revoke access actions.
- The **Grant access** wizard filters available roles via `resource_type=tenant` so only tenant-level roles appear.

## Known Limitation

The role bindings API uses cursor-based pagination with no offset support. To avoid N+1 cursor iteration, this page fetches up to 1000 bindings in a single request and paginates/filters client-side. True server-side pagination requires cursor walking — tracked as a separate feature.

## Permission model

V2 uses **Kessel domain hooks** from `src/v2/hooks/useRbacAccess.ts`, not V1 patterns. For organization-level role bindings, access is gated by the same Kessel relations used for workspace role bindings. `useIdentity()` from `src/shared/hooks/useIdentity.ts` provides `orgAdmin` when needed. The grant access button is enabled only for `orgAdmin` users.

## Constraints

- Edit/revoke row actions are not yet wired for tenant-level bindings (requires route support for `role-access/:groupId` at the org level).
