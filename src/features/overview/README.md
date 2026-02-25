# overview

**API generation:** none (static content + feature flags)

The RBAC landing/overview page. Entry point for users arriving at `/iam/access-management`. Displays onboarding content, supporting features, and recommended learning resources.

## Behavior

- Checks two feature flags:
  - `platform.rbac.workspaces-m5` — whether workspaces are enabled for this org
  - `platform.rbac.workspaces-eligible` — whether this org is eligible for workspaces
- If eligible but not yet enabled, shows `EnableWorkspacesAlert` (a banner prompting migration).
- No API calls — content is static.

## Components

- `GetStartedCard` — quick-start CTA card
- `SupportingFeaturesSection` — grid of feature highlights
- `RecommendedContentTable` — links to documentation and learning resources

## Constraints

- No data fetching, no mutations.
- The "Enable Workspaces" alert is imported from `workspaces/overview/` — the two islands share this UI concern.
