# Testing Guidelines

Testing strategy, frameworks, and mandatory patterns for the RBAC UI.

## Testing hierarchy

1. **Storybook interaction tests** — first-class test artifact. CI enforces these via `npm run test:storybook`.
2. **Vitest unit tests** — `npm run test:web` (happy-dom environment).
3. **Playwright E2E** — `npm run e2e` against staging. Seed data → test → cleanup.

## Storybook-first testing

- Every component in `src/{v1,v2}/features/` or `src/shared/components/` requires a `.stories.tsx` file alongside it.
- Stories must have at least one `play` function testing an interaction.
- Route-level features (modals tied to routes, new pages) require user-journey stories with `fn()` spies on real API endpoints.
- Full suite: `npm run test:storybook` (builds, serves on port 6007, runs all tests, kills server). For iteration: `npm run test-storybook:fast -- --includeTags <tag>`.

## MSW mocking layer

- **No inline MSW handlers in stories.** Import handler factories from `src/{v1,v2,shared}/data/mocks/`. ESLint bans `import { http } from 'msw'` in feature stories.
- **Handler factory pattern**: `v2RolesHandlers()`, `groupsHandlers([])`, `groupsErrorHandlers(500)`, `v2RolesLoadingHandlers()`.
- **Stateful stories**: Use `createResettableCollection()` from `src/shared/data/mocks/db.ts`. Reset in decorators via `collection.reset()`.
- **Mock databases**: `createV1MockDb(seed)` / `createV2MockDb(seed)`. Wire handlers: `createV1Handlers(db, spies?)` / `createV2Handlers(db, spies?)`.
- **MSW boundary**: V1 stories use only V1 handlers. V2 stories use only V2 handlers. `onUnhandledRequest: 'error'` catches cross-version leaks.
- **No hardcoded mock data strings.** Play functions must reference seed constants (`DEFAULT_USERS[0].username`, `DEFAULT_WORKSPACES[0].name`). Define aliases at module scope.
- **Mock types from db.ts only.** Use types from `src/*/data/mocks/db.ts`, never from `*.fixtures.ts`.

## Play function rules

- **Use shared interaction helpers.** Import from `src/test-utils/` (generic) or `*.helpers.tsx` (feature-specific). Never inline modal waits, drawer scoping, tab switching, row selection.
- **Use `step` in user-journey play functions.** Wrap each logical phase in `await step('Label', async () => { ... })`. DOM refs live inside steps; stable values outside.
- **No `user.type()` directly.** Use `clearAndType` helper instead. Enforced by `rbac-local/no-direct-user-type`.
- **Banned in play functions (ESLint-enforced):**
  - `document.querySelector` / `getElementById` / `querySelectorAll`
  - `canvasElement.querySelector` / `querySelectorAll`
  - `delay()` (except in `resetStoryState`)
  - `getBy*` / `getAllBy*` inside `waitFor` — use `queryBy*` + `expect` or `findBy*` outside
  - `findBy*` inside `waitFor` — double-retry, use `queryBy*` + `expect`
  - `console.log` / `console.warn` — `failOnConsole` catches them
  - `dispatchEvent(new MouseEvent(...))` / raw `.click()`

## Test helper ownership

| Location | Scope |
|----------|-------|
| `src/test-utils/interactionHelpers.ts` | Generic: `waitForModal`, `clickWizardNext`, `clearAndType` |
| `src/test-utils/tableHelpers.ts` | Table interaction helpers |
| `src/test-utils/rolesTableHelpers.ts` | Roles-specific table helpers |
| `src/test-utils/workspaceHelpers.ts` | Workspace-specific helpers |
| `src/test-utils/testUtils.ts` | Test utilities, `TEST_TIMEOUTS` constants |
| `src/*/features/<domain>/*.helpers.tsx` | Feature-specific form/wizard helpers |
| `src/user-journeys/_shared/helpers/` | Journey-only orchestration (`resetStoryState`, `navigateToPage`) |

## Storybook imports

```typescript
import { userEvent, within, expect, fn, waitFor } from 'storybook/test'; // no @ prefix
```

## Vitest configuration

- Environment: `happy-dom` (not jsdom)
- Globals: enabled (`describe`, `test`, `expect`, `vi` available without imports)
- Setup file: `config/setupTests.ts`
- Includes: `src/**/*.test.{ts,tsx}` (excludes CLI tests)
- Timeout: 30s for tests and hooks

## E2E (Playwright)

- Config: `e2e/playwright.config.ts`
- Projects: `v1-orgadmin`, `v1-userviewer`, `v1-readonly`, `v2-orgadmin`, `v2-userviewer`, `v2-readonly`
- Seed/cleanup: `npm run e2e:v1:seed` / `npm run e2e:v1:cleanup` (same for v2)
- No magic timeout numbers — use `E2E_TIMEOUTS` from `e2e/utils/timeouts.ts` (ESLint-enforced)
- Test files: `e2e/journeys/`

## CI pipeline

`npm run verify` runs the full CI check: `lint → build → test → test:storybook`.
