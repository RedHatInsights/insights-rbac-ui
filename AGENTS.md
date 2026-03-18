# RBAC UI — Agent Context

React application for Red Hat's Role-Based Access Control system. Built on PatternFly (design system), React Query (server state), and Storybook as the primary development and testing environment. Playwright handles E2E against staging.

**Architecture**: The codebase is split into two application versions and a shared layer:

- **`src/v1/`** — User Access (V1). Uses Chrome-based permission checks (`useAccessPermissions`), `useUserData()` for identity flags. Routes defined in `src/v1/Routing.tsx`.
- **`src/v2/`** — Access Management (V2). Uses Kessel SDK domain hooks (`src/v2/hooks/useRbacAccess.ts`) for permissions. Routes defined in `src/v2/Routing.tsx`.
- **`src/shared/`** — Code shared between V1 and V2: platform hooks, UI components, table-view, contexts, and utilities.

`src/Iam.tsx` is the shell that conditionally renders `IamV1` or `IamV2` based on the `platform.rbac.workspaces-organization-management` feature flag.

**Boundary rules** (enforced by ESLint rule `rbac-local/no-cross-version-imports`):
- `src/v1/` cannot import from `src/v2/`
- `src/v2/` cannot import from `src/v1/`
- **Any file outside `src/v1/` and `src/v2/`** cannot import from either versioned directory. This includes `src/shared/` and prevents rogue paths (e.g. `src/data/`, `src/features/`) from bypassing the boundary. The only exceptions are `src/Iam.tsx` (app shell) and `src/federated-modules/` (module federation entry points that wrap V2 components with providers).
- New files must go in `src/v1/`, `src/v2/`, or `src/shared/` — never directly under `src/` (except `Iam.tsx` and federated module entry points).
- V2 RBAC feature islands (roles, groups, workspaces) use Kessel domain hooks for permission checks. Other V2 code may use `useAccessPermissions` for non-RBAC domains. V1 features use `useAccessPermissions` + `useUserData`.
- `useUserData` lives in `src/shared/hooks/useUserData.ts` and is used by both V1 and V2 for identity flags.

**V1 API ban scope**: Only **roles**, **groups** (eventually), and **role bindings** must use V2 APIs in V2 code. Users, permissions, inventory, cost, and service accounts use V1 APIs via `src/shared/data/` — this is correct, not a violation.

**Testing**: Storybook stories with MSW handlers and `fn()` API spies are the first-class test artifact. Unit tests exist but Storybook interaction tests are what CI enforces. Use `npm run test:storybook` for self-contained runs (builds Storybook, serves it, runs all tests, cleans up — no dev server required). For targeted runs against a running dev server, use `npm run test-storybook:fast -- --includeTags <tag>`.

All detailed documentation is in `src/docs/`. Read the relevant doc before writing code.

**Doc discipline**: `src/docs/` files document behavior, patterns, and non-obvious constraints. They do not duplicate TypeScript types — those live in source and are authoritative. When a doc references a type shape, it points to the source file.

**Feature READMEs**: Each feature island (`src/{v1,v2}/features/<domain>/`) should have a `README.md` explaining what the island owns, what APIs it calls, and any non-obvious constraints. These are the authoritative source for feature-level structure — `src/docs/Architecture.mdx` does not maintain a file tree.

---

## Non-negotiables (apply without reading further)

1. When modifying files inside `src/{v1,v2}/features/<island>/`, check the island's `README.md`. If your change adds a sub-feature, changes the data layer, alters the permission model, or introduces a new constraint — update the README as part of the same PR.
2. `TableView` always requires `useTableState` — enforced by ESLint rule `rbac-local/require-use-table-state`. Suppress only for display-only tables with `// eslint-disable-next-line rbac-local/require-use-table-state -- <reason>`.
3. Every added/modified file in `src/{v1,v2}/features/` or `src/shared/components/` requires a `.stories.tsx` update.
4. Route-level features (modals tied to routes, new pages) require user-journey Storybook stories with `fn()` spies on real API endpoints.
5. No hand-rolled pagination, sort, filter, or selection state. Use `useTableState`.
6. Shared component changes (`src/shared/components/`) require blast-radius analysis of all consumers before merging.
7. Use `clearAllFilters()` from `useTableState` — never manually reset individual filter keys.
8. Storybook test imports: `import { userEvent, within, expect, fn, waitFor } from 'storybook/test'` (no `@` prefix).
9. PatternFly imports: dynamic paths (`/dist/dynamic/`). Icons: absolute paths (`/dist/js/icons/`). Never global imports.
10. `@redhat-cloud-services/rbac-client`, `@redhat-cloud-services/javascript-clients-shared`, and `@redhat-cloud-services/host-inventory-client` are implementation details of the data layer. Only `src/*/data/api/*.ts` files may import from them — enforced by ESLint `no-restricted-imports`. Everyone else imports types through data layer re-exports (e.g., `import type { RoleOut } from '../../data/api/roles'`). The V1 function call signatures are broken — use `(api.method as any)` and `undefined` for optional params — but data types (`RoleOut`, `Principal`, `GroupOut`, etc.) are fine and must be used directly for mocks.
11. Components use named exports only. Features (route/page containers) may additionally have a default export. Never default-only.
12. Conventional commits. No git operations unless explicitly requested.
13. **V1/V2 boundary**: V2 RBAC feature islands (`roles/`, `users-and-user-groups/`, `workspaces/`) use Kessel domain hooks (`useRolesAccess`, `useGroupsAccess`, etc.) — never `useAccessPermissions`. Other V2 code may use `useAccessPermissions` for non-RBAC domains without Kessel equivalents (e.g. cost-management, inventory). Enforced by ESLint rule `rbac-local/no-cross-version-imports`.
14. **MSW handler boundary in stories**: V1 stories use only V1 role handlers. V2 stories use only V2 role handlers. Shared APIs (users/principals, groups, permissions) are the exceptions — V2 wraps V1 for these until V2 equivalents ship. If a V2 component accidentally calls a V1 roles endpoint (or vice versa), MSW's `onUnhandledRequest: 'error'` must catch it. User-journey stories use `createV1MockDb` + `createV1Handlers(db)` or `createV2MockDb` + `createV2Handlers(db)` — never a mixed set. Reset state via `db.reset()` in decorators or `resetStoryState(db)` in play functions. Access-management stories use `v1DefaultHandlers` or `v2DefaultHandlers` from `_shared/handlers.ts`.
15. **No inline MSW handlers in stories.** Stories must not define MSW request handlers (`http.get`, `http.post`, etc.) inline. Import handler factories from `src/{v1,v2,shared}/data/mocks/` instead. Handler factories are typed against the same API types the real code uses, so when `rbac-client` updates, type-safety tests catch mock drift at build time. If a factory doesn't exist yet for your endpoint, create one in the appropriate `data/mocks/` directory — don't add an inline handler. **Lint-enforced**: `import { http } from 'msw'` is banned in feature stories (`src/**/*.stories.tsx` excluding `src/user-journeys/`) via `no-restricted-imports`.

    **Factory pattern examples:**
    ```typescript
    // Happy path — default data
    handlers: [...v2RolesHandlers()]

    // Happy path — custom data
    handlers: [...v2RolesHandlers(customRoles, { onList: listSpy })]

    // Empty state
    handlers: [...groupsHandlers([])]

    // Error state — no magic URL strings needed
    handlers: [...groupsErrorHandlers(500)]

    // Loading state
    handlers: [...v2RolesLoadingHandlers()]
    ```

    **Stateful stories (CRUD with test isolation):**
    ```typescript
    import { createResettableCollection } from '../../shared/data/mocks/db';
    import { createGroupsHandlers } from '../../shared/data/mocks/groups.handlers';

    const groupsCollection = createResettableCollection(myGroups);
    const handlers = createGroupsHandlers(groupsCollection, { onDelete: deleteSpy });

    // In decorator: groupsCollection.reset();
    // In play: groupsCollection.all(), groupsCollection.findFirst(...)
    ```

    **Exceptions:** Only truly stateful journey stories (those tracking mutations across `play` steps) may retain minimal inline handlers. The shared `TableView.stories.tsx` is also exempt due to its complex testing needs. All other stories must use factory calls exclusively.

16. **No hardcoded mock data strings in stories.** Play functions must reference seed constants (`DEFAULT_USERS[0].username`, `DEFAULT_WORKSPACES[0].name`, etc.) — never hardcode entity names, usernames, or workspace names as string literals. Define descriptive aliases at module scope (e.g. `const FIRST_USER = DEFAULT_USERS[0]`). See `StorybookMandatoryRules.mdx` §11.
17. **No custom/inline types in MSW handlers.** Handler factories must use types from `src/*/data/api/` (re-exports from `@redhat-cloud-services/rbac-client`). Never define inline `Array<{ role: ...; subject: ... }>` shapes — import `RoleBindingsRoleBinding`, `RoleBindingsGroupSubject`, `Role`, etc. and use casts (`as RoleBindingsGroupSubject`) when the API sparse-field response extends the base type.
18. **Storybook test commands.** `npm run test:storybook` is the self-contained full-suite command (builds, serves on port 6007, runs all tests, kills the server). Use it for final validation — no running dev server needed. For fast iteration against a running dev server (`npm run storybook`), use `npm run test-storybook:fast -- --includeTags <tag>` to target specific stories. Never run the full suite without `--includeTags` during iteration — it takes 2+ minutes. See `DevelopmentWorkflow.mdx` §test-storybook.
19. **Play functions must use shared interaction helpers.** Do not inline modal waits, drawer scoping, tab switching, row selection, notification checks, destructive confirmations, or wizard navigation. Import generic helpers from `src/test-utils/` and feature-specific helpers from `*.helpers.tsx` next to the component. If a helper doesn't exist for your pattern, create one in the appropriate location — don't inline the sequence. Banned in play functions: `document.querySelector` / `document.getElementById`, `delay()` (except the initial MSW settle in `resetStoryState`), `dispatchEvent(new MouseEvent(...))` / raw `.click()`, hand-rolled polling loops, sync `getByRole` / `getByText` after any async boundary (use `findBy*`). **Lint-enforced** (error): `document.querySelector`, `document.querySelectorAll`, `document.getElementById`, and `delay()` are banned in all `*.stories.tsx` files via `no-restricted-syntax`. **Lint-enforced** (error): `canvasElement.querySelector` / `canvasElement.querySelectorAll` and `getBy*`/`getAllBy*` inside `waitFor` are enforced by `rbac-local/enforce-story-patterns`.
20. **Test helper ownership.** Generic interaction helpers (`waitForModal`, `clickWizardNext`, `clearAndType`, etc.) and domain helpers (`workspaceHelpers`, `rolesTableHelpers`, `tableHelpers`) live in `src/test-utils/`. Feature-specific form/wizard helpers live as `*.helpers.tsx` next to the component they exercise. User-journey stories consume from both — they never own reusable interaction logic. `src/user-journeys/_shared/helpers/` is limited to journey-only orchestration (`resetStoryState`, `navigateToPage`). Import directly from the owning module — no barrel re-exports.
21. **User-journey play functions must use `step` for every logical phase.** Destructure `step` from the play function context (`play: async ({ canvasElement, step, args }) => { ... }`) and wrap each phase in `await step('Label', async () => { ... })`. This creates closure boundaries that prevent stale DOM references from leaking between phases. DOM element references (`findByRole` results, `within()` scopes, helper returns like `waitForModal()`) must live inside steps. Stable non-DOM values (`canvas`, `user`, module-scope constants) live outside steps. `waitFor` is still needed inside steps for spy assertions and `findBy*` with `{ timeout: TEST_TIMEOUTS.ELEMENT_WAIT }` for async-rendered content (e.g. data-driven-forms). See `StorybookMandatoryRules.mdx` §13.
22. **Banned patterns in stories (ESLint-enforced).** Four pattern families are enforced by ESLint: (a) `findBy*` inside `waitFor` (double-retry — use `queryBy*` + `expect` instead) — `testing-library/no-wait-for-side-effects`; (b) `console.log`/`console.warn` in story files (debug noise triggers `failOnConsole`) — `no-console`; (c) try/catch swallowing assertion failures with `console.log(error)` (hides real failures); (d) `getBy*`/`getAllBy*` inside `waitFor` (throws before retry — use `queryBy*` + `expect` or `findBy*` outside) — `rbac-local/warn-story-patterns`. See `StorybookMandatoryRules.mdx` §15.
23. **Mock data types**: All mock entity types (`Group`, `GroupOut`, `Principal`, `RoleOutDynamic`, `RoleOut`, `RoleV2`, `WorkspacesWorkspace`, `MockServiceAccount`, `ServiceAccount`) are re-exported from `src/shared/data/mocks/db.ts` (shared) or `src/v2/data/mocks/db.ts` (V2). V2 role mocks use `RoleV2` (extends `Role` with `org_id`) from `src/v2/data/queries/roles.ts`. Import types from `db.ts` — never from `*.fixtures.ts` files. Handler factories accept `MockCollection<T>` (alias for `Collection<ZodType<T>>`). Version-specific mock databases: `V1MockDb` (from `src/v1/data/mocks/db.ts`) and `V2MockDb` (from `src/v2/data/mocks/db.ts`) bundle `ResettableMockCollection` + `ResettableMap` instances with a top-level `reset()`. Create with `createV1MockDb(seed)` / `createV2MockDb(seed)`. Wire handlers via `createV1Handlers(db, spies?)` / `createV2Handlers(db, spies?)`.

---

## Docs index

All docs are in `src/docs/`. Read the relevant file before writing or reviewing code.

```text
root: src/docs/

writing-a-story:           StorybookMandatoryRules.mdx
story-patterns:            StorybookPatterns.mdx
msw-handler-patterns:      StorybookPatterns.mdx  # @msw/data patterns documented in §MSW Handler Factories
user-journey-story:        UserJourneys.mdx
table-component:           TableView.mdx
patternfly-imports:        PatternFlyPatterns.mdx
icons-i18n-empty-states:   PatternFlyPatterns.mdx
component-organization:    ComponentGuidelines.mdx
js-to-ts-conversion:       DevelopmentWorkflow.mdx
file-naming-validation:    DevelopmentWorkflow.mdx
api-client-rbac-client:    APIClientPatterns.mdx
query-keys:                QueryKeysFactory.mdx
form-submission:           TypeSafeFormSubmission.mdx
e2e-testing:               E2ETesting.mdx
architecture:              Architecture.mdx
data-fetching-migration:   ReduxToTanstackQuery.mdx
v1-v2-boundary:            V1V2Boundary.mdx
module-federation:         ModuleFederation.mdx
federated-module-spike:    FederatedModuleSpike.mdx
patterns-overview:         PatternsIndex.mdx
contributing:              .github/pull_request_template.md
```

---

## Key file locations

```text
src/
├── Iam.tsx                           # App shell — renders IamV1 or IamV2
├── v1/                               # User Access (V1)
│   ├── IamV1.tsx                     # V1 app entry
│   ├── Routing.tsx                   # V1 routes (declarative JSX, guard() layout routes)
│   ├── features/                     # V1 feature islands
│   ├── data/
│   │   ├── api/                      # V1 API clients
│   │   ├── queries/                  # V1 React Query hooks
│   │   └── mocks/                    # V1 MSW handler factories + fixtures
│   │       ├── db.ts                 # V1MockDb, V1Seed, createV1MockDb()
│   │       ├── seed.ts              # DEFAULT_V1_ROLES, defaultV1Seed()
│   │       └── handlers.ts          # createV1Handlers(db, spies?) — composes all V1 handler factories
│   ├── hooks/                        # (empty — useUserData is in shared)
│   ├── utilities/
│   │   └── pathnames.ts              # V1-specific URL paths
│   └── components/                   # V1-only components
├── v2/                               # Access Management (V2)
│   ├── IamV2.tsx                     # V2 app entry (wraps Kessel Provider)
│   ├── Routing.tsx                   # V2 routes (declarative JSX, guard() layout routes)
│   ├── features/                     # V2 feature islands
│   ├── data/
│   │   ├── api/                      # V2 API clients
│   │   ├── queries/                  # V2 React Query hooks
│   │   └── mocks/                    # V2 MSW handler factories + fixtures
│   │       ├── db.ts                 # V2MockDb, V2Seed, createV2MockDb()
│   │       ├── seed.ts              # DEFAULT_V2_ROLES, DEFAULT_WORKSPACES, defaultV2Seed()
│   │       └── handlers.ts          # createV2Handlers(db, spies?) — composes all V2 handler factories
│   ├── hooks/
│   │   ├── useRbacAccess.ts          # Kessel domain hooks (useRolesAccess, etc.)
│   │   └── useOrganizationData.ts    # Org/tenant ID for Kessel checks
│   └── utilities/
│       └── pathnames.ts              # V2-specific URL paths
├── shared/                           # Code shared between V1 and V2
│   ├── components/
│   │   ├── PermissionGuard.tsx       # guard(), guardOrgAdmin() — route-level permission checks
│   │   └── table-view/
│   │       ├── TableView.tsx         # Canonical table component
│   │       ├── hooks/useTableState.ts
│   │       └── types.ts
│   ├── hooks/
│   │   ├── useAccessPermissions.ts  # Chrome-based permission checks (shared by V1/V2 routing)
│   │   ├── useUserData.ts            # Identity + orgAdmin flags (shared by V1 and V2)
│   │   ├── usePlatformAuth.ts        # Chrome auth wrapper
│   │   └── usePlatformEnvironment.ts
│   ├── utilities/
│   │   └── pathnames.ts              # PathnameConfig type only — paths in v1/utilities, v2/utilities
│   └── data/
│       ├── api/                      # Shared API clients (users, groups, permissions, inventory, cost, service accounts)
│       ├── queries/                  # Shared React Query hooks
│       └── mocks/
│           ├── db.ts                 # @msw/data utilities: MockCollection<T>, ResettableMockCollection<T>, ResettableMap<K,V>, createSeededCollection, createResettableCollection, createResettableMap
│           ├── seed.ts               # Shared default seed data (DEFAULT_GROUPS, DEFAULT_USERS, DEFAULT_GROUP_MEMBERS, etc.)
│           ├── groups.handlers.ts    # groupsHandlers(), createGroupsHandlers(MockCollection<Group>)
│           ├── groupMembers.handlers.ts # groupMembersHandlers(), etc.
│           ├── groupRoles.handlers.ts   # groupRolesHandlers(), etc.
│           ├── users.handlers.ts     # usersHandlers(), createUsersHandlers(MockCollection<Principal>)
│           ├── permissions.handlers.ts  # permissionsHandlers(), etc.
│           ├── serviceAccounts.handlers.ts # serviceAccountsHandlers(), etc.
│           └── accountManagement.handlers.ts # accountManagementHandlers(), etc.
├── docs/                             # Documentation (MDX)
├── user-journeys/                    # End-to-end journey stories
└── Messages.js                       # i18n message definitions

eslint-rules/
├── require-use-table-state.js        # Enforce useTableState with TableView
├── no-direct-get-user.js             # Ban direct getUser() from usePlatformAuth
├── no-cross-version-imports.js       # Enforce V1/V2/shared boundaries
└── enforce-story-patterns.js          # Error: canvasElement.querySelector, getBy* inside waitFor

.storybook/
├── preview.tsx                       # Global decorators, MSW setup
├── hooks/kesselAccessCheck.tsx       # Mock Kessel SDK for Storybook
├── contexts/StorybookMockContext.tsx  # Mock state (permissions, tenant, workspace)
└── context-providers.tsx             # Global spies (chromeAppNavClickSpy, etc.)

e2e/
└── journeys/                         # Playwright tests
```
