# RBAC UI — Agent Context

React application for Red Hat's Role-Based Access Control system. Built on PatternFly (design system), React Query (server state), and Storybook as the primary development and testing environment. Playwright handles E2E against staging.

**Architecture**: Feature islands in `src/features/` (route-tied containers) + shared components in `src/components/`. Legacy code in `src/smart-components/` and `src/presentational-components/` is being migrated. New features always go in `src/features/`.

**Testing**: Storybook stories with MSW handlers and `fn()` API spies are the first-class test artifact. Unit tests exist but Storybook interaction tests (`npm run test-storybook:ci`) are what CI enforces.

All detailed documentation is in `src/docs/`. Read the relevant doc before writing code.

**Doc discipline**: `src/docs/` files document behavior, patterns, and non-obvious constraints. They do not duplicate TypeScript types — those live in source and are authoritative. When a doc references a type shape, it points to the source file.

**Feature READMEs**: Each feature island (`src/features/<domain>/`) should have a `README.md` explaining what the island owns, what APIs it calls, and any non-obvious constraints. These are the authoritative source for feature-level structure — `src/docs/Architecture.mdx` does not maintain a file tree.

---

## Non-negotiables (apply without reading further)

1. When modifying files inside `src/features/<island>/`, check the island's `README.md`. If your change adds a sub-feature, changes the data layer, alters the permission model, or introduces a new constraint — update the README as part of the same PR.
2. `TableView` always requires `useTableState` — enforced by ESLint rule `rbac-local/require-use-table-state`. Suppress only for display-only tables with `// eslint-disable-next-line rbac-local/require-use-table-state -- <reason>`.
3. Every added/modified file in `src/features/` or `src/components/` requires a `.stories.tsx` update.
4. Route-level features (modals tied to routes, new pages) require user-journey Storybook stories with `fn()` spies on real API endpoints.
5. No hand-rolled pagination, sort, filter, or selection state. Use `useTableState`.
6. Shared component changes (`src/components/`) require blast-radius analysis of all consumers before merging.
7. Use `clearAllFilters()` from `useTableState` — never manually reset individual filter keys.
8. Storybook test imports: `import { userEvent, within, expect, fn, waitFor } from 'storybook/test'` (no `@` prefix).
9. PatternFly imports: dynamic paths (`/dist/dynamic/`). Icons: absolute paths (`/dist/js/icons/`). Never global imports.
10. `@redhat-cloud-services/rbac-client` has broken TypeScript types. Use `(api.method as any)` and `undefined` for optional params — never explicit defaults like `limit || 20`.
11. Components use named exports only. Features (route/page containers) may additionally have a default export. Never default-only.
12. Conventional commits. No git operations unless explicitly requested.

---

## Docs index

All docs are in `src/docs/`. Read the relevant file before writing or reviewing code.

```text
root: src/docs/

writing-a-story:           StorybookMandatoryRules.mdx
story-patterns:            StorybookPatterns.mdx
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
permissions-context:       PermissionsContext.mdx
module-federation:         ModuleFederation.mdx
patterns-overview:         PatternsIndex.mdx
contributing:              .github/pull_request_template.md
```

---

## Key file locations

```text
src/
├── features/                         # Feature islands (new code goes here)
│   ├── workspaces/
│   ├── roles/
│   └── access-management/
├── components/
│   └── table-view/
│       ├── TableView.tsx             # Canonical table component
│       ├── hooks/useTableState.ts    # Table state management hook
│       └── types.ts                  # FilterConfig, ColumnConfig, etc.
├── helpers/                          # Business logic by feature
├── docs/                             # Documentation (MDX)
├── user-journeys/                    # End-to-end journey stories
└── Messages.js                       # i18n message definitions

eslint-rules/
└── require-use-table-state.js        # ESLint rule enforcing useTableState

.storybook/
├── preview.tsx                       # Global decorators, MSW setup
└── context-providers.tsx             # Global spies (chromeAppNavClickSpy, etc.)

e2e/
└── journeys/                         # Playwright tests
```
