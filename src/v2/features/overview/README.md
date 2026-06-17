# overview (V2)

**API generation:** none (static content)

The V2 landing/overview page. Thin wrapper around `WorkspacesOverview` at `src/v2/features/workspaces/overview/WorkspacesOverview.tsx`.

## Behavior

- Renders the Access Management landing page with service cards (Workspaces, Groups, Roles, Bindings), an "Understanding access" section, and recommended content links.
- Navigation targets V2 routes (`/access-management/workspaces`, `/access-management/users-and-user-groups`, `/access-management/roles`).

## Route

`/overview` — V2 route (the YAML nav defines `href: /iam/overview`). V1 uses `/user-access/overview` and renders the shared V1-style `Overview` component instead.

## Constraints

- No data fetching, no mutations.
- V1 and V2 overview pages are different: V1 uses the shared `Overview` component ("User Access"); V2 uses `WorkspacesOverview` ("Access Management").
