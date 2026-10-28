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

## Service access tokens

The Service Accounts selection and detail tables share SAT presentation with `platform.service-accounts.sat` enabled. SSO selection responses identify SATs with `type: 'service_access_token'`; RBAC group-principal responses use `service_account_type: 'service_access_token'` (insights-rbac PR #3524). Missing and unrecognized values retain regular service-account presentation. SATs show a blue Token label and the CIAM-12578 login username (`|service-account-${clientId}`) in the Client ID / Username column. Selection and membership mutations always use the original client ID and `type: 'service-account'`; the UI never creates a second row for the underlying service account or reads credentials. Flag-off preserves existing labels and identifiers.

The existing SSO selection API and RBAC membership API remain separate. Type filtering across pages requires a server-side contract and is tracked independently in RHCLOUD-52279.
