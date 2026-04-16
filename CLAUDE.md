@AGENTS.md

# Build & test commands

```bash
npm install          # install dependencies
npm run lint         # ESLint (flat config) + Prettier + circular dep check
npm run test:web     # vitest unit tests (happy-dom)
npm run test:storybook # full Storybook interaction test suite (builds, serves, runs, cleans up)
npm run build        # production build (fec build)
npm run storybook    # dev server for Storybook (port 6006)
npm run e2e          # Playwright E2E (seed → test → cleanup)
npm run verify       # full CI check: lint + build + test + test:storybook
```

# Git

Use conventional commits (`type(scope): description`). Enforced by commitlint + husky pre-commit hook.
