# users

**API generation:** v1 (`@redhat-cloud-services/rbac-client`)

User management in the v1 User Access model. Lists organization principals and provides admin actions: activate/deactivate, invite, toggle org admin status. The v2 equivalent is `src/features/access-management/users-and-user-groups/users/` — near feature parity. Both coexist until v1 is retired. Do not merge them.

## Sub-features

- `add-user-to-group/` — modal for adding an existing user to a group
- `invite-users/` — modal for inviting new users via email
- `components/` — shared presentational components (user rows, status badges)

## Data

Fetching uses `useUsersQuery` from `src/data/queries/users.ts`. Mutations:
- `useChangeUserStatusMutation` — activate/deactivate
- `useInviteUsersMutation` — invite by email
- `useUpdateUserOrgAdminMutation` — toggle org admin flag

## Constraints

- v1 API types are broken — use `(api.method as any)`. See [API Client Patterns](../../docs/APIClientPatterns.mdx).
- Permission model: `orgAdmin` gates all mutations.
- The invite flow uses a different base URL derived from `fetchEnvBaseUrl()`. Do not hardcode `/api/rbac/v1/` for this endpoint — the URL resolves to an empty prefix in test environments.
- `accountId` type varies by action: some endpoints use `org_id` (number), others use `internal.account_id` (string). Preserve the original source per action — do not standardize.
