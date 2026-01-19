# Insights RBAC Service UI

[![Build Status](https://travis-ci.org/RedHatInsights/insights-rbac-ui.svg?branch=master)](https://travis-ci.org/RedHatInsights/insights-rbac-ui)
[![Maintainability](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/maintainability)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/test_coverage)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/test_coverage)

## Storybook

Interactive component documentation and stories are available on Chromatic:

- **Master branch**: https://master--687a10bbc18d4b17063770ba.chromatic.com
- **Feature branches**: https://`<branch-name>`--687a10bbc18d4b17063770ba.chromatic.com

Stories are automatically deployed on:
- ✅ Pushes to `master`
- ✅ Pull requests from [@RedHatInsights/experience-ui-committers](https://github.com/orgs/RedHatInsights/teams/experience-ui-committers) team members
- ✅ Pull requests from RedHatInsights organization admins

## Shared Components

### ManagedSelector

The `ManagedSelector` component is a fully managed workspace selector that can be consumed via module federation by other Red Hat Cloud Services applications.

**Usage**:
```tsx
import { AsyncComponent } from '@redhat-cloud-services/frontend-components';

<AsyncComponent
  scope="rbac"
  module="./Workspaces/ManagedSelector"
  onSelect={handleWorkspaceSelect}
  fallback={<div id="fallback-modal" />}
/>
```

See the [full documentation](src/features/workspaces/components/managed-selector/README.md) for complete API reference, examples, and integration guides.

## Contributing

This repository is now using experimental workflow checks. Your commits must use the [conventional commits format](https://www.conventionalcommits.org/en/v1.0.0/#examples).

## Getting Started

### Prerequisites

This project requires **Node.js LTS** (currently Node.js 20.x) for both local development and CI/CD. Using other Node.js versions may cause compatibility issues, particularly with Storybook builds.

**Important**: The project uses CommonJS modules for Storybook configuration and requires Node.js LTS for proper module resolution and TypeScript compilation.

```bash
# Check your Node.js version
node --version

# If you need to switch to LTS, use nvm or your preferred version manager
nvm use --lts
```

### Installation and Setup

```bash
npm install
npm run start
```

## Available Scripts

This project includes several npm scripts that automate various tasks. Below are descriptions of some of the most commonly used scripts:

### `npm start`

Starts the development server. This script will compile your code and open a browser window displaying the application. It also sets up hot reloading so changes in your code are reflected instantly.

### `npm run build`

Builds the production version of the application. The output will be placed in the `dist` directory, ready for deployment.

### `npm test`

Runs the unit tests suite using Jest.

### `npm run test:e2e`

Runs the Playwright E2E test suite against stage. See [`e2e/README.md`](./e2e/README.md) for complete setup instructions including authentication and data seeding.

### `npm run lint`

Runs ESLint to check for code style issues and potential errors in your JavaScript/TypeScript files. It will report any problems found according to the rules defined in the `.eslintrc` configuration file.

### `npm run format`

Formats all JavaScript, TypeScript, and other supported files using Prettier. This ensures consistent formatting across the entire project.


## License

This project is available as open source under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).

## Quickstarts Test Environment

In order to test current Quickstarts tutorials iteration, you must enable the testing local variable through your browser's console.

```localStorage.setItem('quickstarts:enabled', true)```

You'll be able to see the buttons for testing both the quickstart tutorial and the catalog page.
Once the flag is enabled, you can access the catalog directly via its route:
```.../settings/rbac/quickstarts-test```
