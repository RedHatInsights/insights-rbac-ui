# overview (V2)

**API generation:** none (static content + feature flags)

The V2 landing/overview page. Thin wrapper around the shared `Overview` component at `src/shared/components/overview/Overview.tsx`.

## Behavior

- Passes V2 pathnames (`/access-management/users-and-user-groups/user-groups`, `/access-management/roles`) to the shared Overview component.
- The shared component checks feature flags and conditionally shows workspace alerts.

## Route

`/overview` — V2 route (the YAML nav defines `href: /iam/overview`). V1 uses `/user-access/overview`.

## Constraints

- No data fetching, no mutations.
- V1 and V2 share the same Overview UI — only the navigation links differ.
