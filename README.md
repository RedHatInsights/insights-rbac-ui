# Insights Rbac Service UI

[![Build Status](https://travis-ci.org/RedHatInsights/insights-rbac-ui.svg?branch=master)](https://travis-ci.org/RedHatInsights/insights-rbac-ui)
[![Maintainability](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/maintainability)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/54d13cab52391734d841/test_coverage)](https://codeclimate.com/github/RedHatInsights/insights-rbac-ui/test_coverage)

## Getting Started

### Insights Proxy
[Insights Proxy](https://github.com/RedHatInsights/insights-proxy) is required to run the RBAC frontend application. 
To run the proxy with insights-rbac-specific configuration run:
```
SPANDX_CONFIG="$(pwd)/insights-rbac-ui/config/spandx.config.js" bash insights-proxy/scripts/run.sh

## License

This project is available as open source under the terms of the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
