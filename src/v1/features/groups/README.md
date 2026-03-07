# groups

**API generation:** v1 (`@redhat-cloud-services/rbac-client`)

Full CRUD for groups in the v1 User Access model. A group is a collection of principals (users, service accounts) that can be assigned roles.

## Sub-features

- `add-group/` — wizard for creating a group with optional initial members and roles
- `group/` — detail page for a single group, with tabs:
  - `members/` — add/remove users
  - `member/` — (legacy) single-member view
  - `role/` — add/remove roles assigned to the group
  - `service-account/` — add/remove service accounts
- `components/` — shared presentational components used across the group pages
- `hooks/` — group-specific hooks

## Data

All data fetching uses hooks from `src/data/queries/groups.ts`. See `groupsKeys` for the query key factory. Cache invalidation happens at `groupsKeys.all` after any mutation.

## Constraints

- The v1 API types are broken — use the `(api.method as any)` pattern. See [API Client Patterns](../../docs/APIClientPatterns.mdx).
- The v2 equivalent is `src/features/access-management/` — near feature parity. Both islands coexist until v1 is retired. Do not merge them.
- Permission model: `orgAdmin` gates all mutations. `isProd()` disables destructive actions.
