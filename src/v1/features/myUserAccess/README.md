# myUserAccess

**API generation:** v1 (`usePrincipalAccessQuery`)

Read-only self-service page where the current user views their own permissions and roles, organized by product bundle (RHEL, OpenShift, etc.).

## Behavior

- Fetches entitlements and `isOrgAdmin` from the Chrome auth API (`getUser()`), not from RBAC.
- The active bundle is stored in the URL as `?bundle=<entitlement>` and defaults to `DEFAULT_MUA_BUNDLE`.
- **Admins** (`orgAdmin` or `userAccessAdministrator`): see a roles table (`RolesTable`) with resource definitions.
- **Regular users**: see a permissions table (`AccessTable`) scoped to the selected bundle's apps.
- `useBundleApps` resolves which apps belong to the selected bundle.
- On mobile, bundle selection uses a dropdown instead of the sidebar card layout.

## Components

- `BundleCard` — sidebar card for desktop bundle navigation
- `UserAccessLayout` — two-column layout (bundle cards | content)
- `StatusLabel` — badge showing "Org Administrator" or "User Access Administrator" status
- `ResourceDefinitionsModal` — expandable modal for viewing permission resource definitions
- `AccessTable` / `RolesTable` — the two table views depending on admin status

## Constraints

- This page is **read-only**. Users cannot modify their own access here.
- No writes, no mutations — no cache invalidation needed.
- The bundle list comes from `bundleData.ts` (static). Entitlements from Chrome determine which bundles are "entitled" and shown as active.
