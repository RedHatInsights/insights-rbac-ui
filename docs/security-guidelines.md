# Security Guidelines

Rules for authentication, authorization, and data access boundaries in the RBAC UI.

## Authentication layer

- **Never import `useChrome` directly.** ESLint bans `@redhat-cloud-services/frontend-components/useChrome` in all source files except the wrapper hooks listed in `eslint.config.js`. Use the semantic wrappers instead:
  - `usePlatformAuth` (`src/shared/hooks/usePlatformAuth.ts`) — `getToken()` and `getUser()`
  - `usePlatformEnvironment` (`src/shared/hooks/usePlatformEnvironment.ts`) — environment detection
  - `useIdentity` (`src/shared/hooks/useIdentity.ts`) — `orgAdmin`, `identity`, `ready`
- **`useIdentity` is the shared identity primitive.** Both V1 and V2 use it. It returns Chrome-only identity without any RBAC API dependency.
- **Token handling**: `getToken()` returns a promise. The data layer gets tokens via `useAppServices().getToken` (DI), not by importing `usePlatformAuth` directly. See `src/docs/DataLayerDI.mdx`.

## Authorization — V1 vs V2

### V1 (`src/v1/`)
- `useAccessPermissions` — calls `/api/rbac/v1/access/` with `app:resource:action` strings (e.g. `rbac:role:write`). V1-only.
- `useUserData` — composes `useIdentity` + `useAccessPermissions`. Returns `orgAdmin` and `userAccessAdministrator`.
- Route guards: `guard()` / `guardOrgAdmin()` from `src/v1/components/PermissionGuard.tsx`.

### V2 (`src/v2/`)
- Kessel domain hooks in `src/v2/hooks/useRbacAccess.ts` — `useRolesAccess()`, `useGroupsAccess()`, `usePrincipalsAccess()`, `useWorkspaceTenantAccess()`.
- Each hook returns UI-action booleans: `canCreate`, `canView`, `canList`, `canUpdate`, `canDelete`.
- Hooks call `useSelfAccessCheck` from `@project-kessel/react-kessel-access-check` internally. **Components never call `useSelfAccessCheck` directly.**
- Route guards: `v2Guard()` / `v2GuardOrgAdmin()` from `src/v2/components/V2PermissionGuard.tsx` (Kessel-backed).

### Non-RBAC domains
- `useNonRbacPermissions` (`src/shared/hooks/useNonRbacPermissions.ts`) — for cost-management, inventory, and other non-RBAC permissions. Shared by both versions.

## V1/V2 import boundary (ESLint-enforced)

- `src/v1/` cannot import from `src/v2/` and vice versa.
- `src/shared/` cannot import from either `src/v1/` or `src/v2/`.
- Enforced by `rbac-local/no-cross-version-imports`. No exceptions.
- New files go in `src/v1/`, `src/v2/`, or `src/shared/` — never directly under `src/` (except `Iam.tsx` and federated module entry points).

## API client restrictions (ESLint-enforced)

- `@redhat-cloud-services/rbac-client`, `@redhat-cloud-services/javascript-clients-shared`, and `@redhat-cloud-services/host-inventory-client` are banned outside `src/*/data/api/` files. Import types and functions through the data layer re-exports.
- The V1 `rbac-client` function call signatures are broken — use `(api.method as any)` and `undefined` for optional params. Data types (`RoleOut`, `Principal`, `GroupOut`) are fine.

## Navigation security (ESLint-enforced)

- No `<a>` tags for internal paths — use `AppLink` or `ExternalLink`.
- No `Link` or `useNavigate` from `react-router-dom` — use `AppLink` / `useAppNavigate`.
- No hardcoded paths in JSX `to` prop or `navigate()` — use `pathnames` from `src/*/utilities/pathnames.ts`.
- No `window.location.href` assignments — use `useExternalLink().navigate()`.

## Data layer DI security

- Data layer hooks (`src/*/data/queries/`) must not import platform hooks, feature flag hooks, or notification packages directly. All dependencies come from `useAppServices()` (ServiceContext).
- This ensures the data layer runs in browser, CLI, and Storybook without environment-specific imports. See `src/docs/DataLayerDI.mdx`.

## Feature flags

- Feature flag `platform.rbac.workspaces` controls V1/V2 toggle in `src/Iam.tsx`.
- In data layer hooks, read `isITLess` from `useAppServices()` — never import `useFlag` directly.

## `getUser()` restriction

- `getUser()` from `usePlatformAuth` is banned by `rbac-local/no-direct-get-user` in most files. Only `useIdentity` (the canonical Chrome identity wrapper) may call it.

## Modal portal rendering

- All `<Modal>` components must include `appendTo={getModalContainer()}` — enforced by ESLint `no-restricted-syntax`. This ensures proper portal rendering in both Storybook and production.
