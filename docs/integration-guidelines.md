# Integration Guidelines

Module federation, Chrome API, platform services, and cross-app integration patterns.

## Module federation

### Exposed modules (`fec.config.js`)

| Module | Entry point | Description |
|--------|-------------|-------------|
| `./Iam` | `src/federated-modules/Iam.tsx` | Full RBAC application (V1/V2 toggle) |
| `./modules/CreateWorkspaceWizard` | `src/federated-modules/CreateWorkspaceWizard.tsx` | Self-contained workspace creation wizard |
| `./modules/WorkspaceSelector` | `src/federated-modules/WorkspaceSelector.tsx` | Self-contained workspace selector dropdown |

- Federated module entry points wrap V2 components with all required providers (ServiceProvider, QueryClient, IntlProvider, etc.).
- `react-router-dom` is excluded from federation and shared as a singleton (`^6.18.0`).
- App URL: `/iam`.

### Federated module rules
- Entry points live in `src/federated-modules/` — the only place that may import from `src/v2/`.
- Each entry point must be self-contained: include all providers so consuming apps don't need RBAC-specific context.
- See `src/docs/ModuleFederation.mdx` for the full guide.

## Chrome API integration

### Platform hooks (semantic wrappers)

| Hook | Source | Purpose |
|------|--------|---------|
| `usePlatformAuth` | `src/shared/hooks/usePlatformAuth.ts` | `getToken()`, `getUser()` |
| `usePlatformEnvironment` | `src/shared/hooks/usePlatformEnvironment.ts` | Environment detection |
| `usePlatformTracking` | `src/shared/hooks/usePlatformTracking.ts` | Analytics tracking |
| `useIdentity` | `src/shared/hooks/useIdentity.ts` | `orgAdmin`, `identity`, `ready` |

- **Never import `useChrome` directly** — ESLint-enforced. Use the semantic wrappers above.
- Direct `useChrome` imports are only allowed in the wrapper hooks themselves (allowlisted in `eslint.config.js`).

### Navigation

- `AppLink` (`src/shared/components/navigation/AppLink.tsx`) — internal links.
- `ExternalLink` (`src/shared/components/navigation/ExternalLink.tsx`) — external platform paths.
- `useAppNavigate` (`src/shared/hooks/useAppNavigate.ts`) — programmatic navigation.
- `useExternalLink` (`src/shared/hooks/useExternalLink.ts`) — external navigation.
- All paths come from `src/*/utilities/pathnames.ts` — no hardcoded URL strings (ESLint-enforced).

## Data layer (DI pattern)

- All data hooks use `useAppServices()` for dependencies (token, environment, notifications, identity).
- `ServiceProvider` is configured per environment:
  - **Browser**: `createBrowserServices()` in the app shell (wires Chrome auth, Redux notifications, Unleash flags).
  - **Storybook**: mock services in `.storybook/preview.tsx` (mock token, `fn()` spies, mock environment).
  - **CLI**: CLI-specific services (Bearer token, chalk output, env config).
- See `src/docs/DataLayerDI.mdx` for the full contract.

## Feature flags (Unleash)

- `@unleash/proxy-client-react` provides `useFlag()`.
- Key flag: `platform.rbac.workspaces` — toggles V1/V2 in `src/Iam.tsx`.
- In data layer hooks, read `isITLess` from `useAppServices()` — never import `useFlag` directly (ESLint-enforced).
- In Storybook, feature flags are provided by `FeatureFlagsProvider` in `.storybook/context-providers.tsx`. Configure per-story via `parameters.featureFlags`.

## Storybook as integration environment

- MSW intercepts all API calls — `onUnhandledRequest: 'error'` catches unhandled routes.
- `StorybookMockProvider` provides mock Chrome context: permissions, environment, identity, workspace.
- Kessel SDK is mocked via `.storybook/hooks/kesselAccessCheck.tsx` — provides permission checks based on story `parameters.permissions`.
- `ComponentProviders` in `.storybook/preview.tsx` wires ServiceProvider, QueryClient, ApiErrorProvider, and React Query DevTools.

## i18n

- `react-intl` with `IntlProvider` wrapping the app.
- Messages defined in `src/Messages.js`, compiled to `src/locales/translations.json`.
- Extract: `npm run translations:extract`. Compile: `npm run translations:compile`.

## CI / Deployment

- **Build**: `fec build` (webpack with module federation).
- **Dev server**: `fec dev-proxy` (proxied to stage) or `fec dev` (no proxy).
- **CI**: `.tekton/` contains Konflux/Tekton pipeline definitions.
- **Chromatic**: Storybook auto-deployed on pushes to `master` and PRs from team members.
- **Frontend CRD**: `deploy/frontend.yaml` — registered in Chrome's navigation config.

## API clients

- V1 APIs: `@redhat-cloud-services/rbac-client` (wrapped in `src/*/data/api/`).
- V2 APIs: Kessel SDK (`@project-kessel/react-kessel-access-check`).
- Shared APIs (users, groups, permissions, inventory, cost, service accounts): `src/shared/data/api/`.
- All API client imports are restricted to `src/*/data/api/` files — other code imports through the data layer.
