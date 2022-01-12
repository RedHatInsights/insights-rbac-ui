# Insights Rbac Service UI

[![Build Status](https://travis-ci.org/RedHatInsights/insights-rbac-ui.svg?branch=master)](https://travis-ci.org/RedHatInsights/insights-rbac-ui)
[![Maintainability](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/maintainability)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/test_coverage)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/test_coverage)

## Getting Started

### Running dev server

```bash
npm run start:proxy:beta
```

## License

This project is available as open source under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).

## Quickstarts Test Environment

In order to test current Quickstarts tutorials iteration, you must enable the testing local variable through your browser's console.
```localStorage.setItem('quickstarts:enabled', true)```

You'll be able to see the buttons for testing both the quickstart tutorial and the catalog page.
Once the flag is enabled, you can access the catalog directly via its route:
```.../settings/rbac/quickstarts-test```
