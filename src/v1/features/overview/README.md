# overview

**API generation:** none (static content + feature flags)

The RBAC landing/overview page. This is a thin V1 wrapper around the shared `Overview` component at `src/shared/components/overview/Overview.tsx`.

## Behavior

- Passes V1 pathnames (`/user-access/groups`, `/user-access/roles`) to the shared Overview component.
- The shared component checks feature flags (`platform.rbac.workspaces-m5`, `platform.rbac.workspaces-eligible`) and conditionally shows `EnableWorkspacesAlert`.

## Shared component

The actual Overview UI lives in `src/shared/components/overview/`:

- `Overview.tsx` — container accepting `links: OverviewLinks` prop
- `components/GetStartedCard.tsx` — CTA card with parameterized group/role links
- `components/SupportingFeaturesSection.tsx` — feature highlights with parameterized group link
- `components/RecommendedContentTable.tsx` — static links to docs and learning resources

## Constraints

- No data fetching, no mutations.
- V1 and V2 share the same Overview UI — only the navigation links differ.
