# Insights RBAC Service UI

[![Build Status](https://travis-ci.org/RedHatInsights/insights-rbac-ui.svg?branch=master)](https://travis-ci.org/RedHatInsights/insights-rbac-ui)
[![Maintainability](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/maintainability)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/test_coverage)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/test_coverage)

## Contributing

This repository is now using experimental workflow checks. Your commits must use the [conventional commits format](https://www.conventionalcommits.org/en/v1.0.0/#examples).

## Getting Started

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

### `npm test:e2e`

Runs the e2e (end-to-end) test suite. This script requires environment variables to be set for authentication purposes, and a working VPN connection. You can use a command like:

```bash
E2E_USER=<your-e2e-user> E2E_PASSWORD=<your-e2e-password> E2E_WORKSPACES_USER=<your-workspaces-user> E2E_WORKSPACES_PASSWORD=<your-workspaces-password> npm test
```

Replace the placeholders with appropriate values.

### `npm run cypress`

Opens the Cypress GUI for running end-to-end tests. Similar to `npm test`, this script requires environment variables for authentication:

```bash
E2E_USER=<your-e2e-user> E2E_PASSWORD=<your-e2e-password> E2E_WORKSPACES_USER=<your-workspaces-user> E2E_WORKSPACES_PASSWORD=<your-workspaces-password> npm run cypress -- open
```

Replace the placeholders with appropriate values.

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