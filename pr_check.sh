#!/bin/bash

# --------------------------------------------
# Export vars for helper scripts to use
# --------------------------------------------
# name of app-sre "application" folder this component lives in; needs to match for quay
export COMPONENT="rbac"
# Needs to match the quay repo name set by app.yaml in app-interface
export IMAGE="quay.io/cloudservices/rbac-frontend"
export WORKSPACE=${WORKSPACE:-$APP_ROOT} # if running in jenkins, use the build's workspace
export APP_ROOT=$(pwd)
COMMON_BUILDER=https://raw.githubusercontent.com/RedHatInsights/insights-frontend-builder-common/master

# --------------------------------------------
# Options that must be configured by app owner
# --------------------------------------------
IQE_PLUGINS="rbac"
IQE_MARKER_EXPRESSION="smoke"
IQE_FILTER_EXPRESSION=""

set -exv

# --------------------------------------------
# Run frontend build
# --------------------------------------------
# source is preferred to | bash -s in this case to avoid a subshell
source <(curl -sSL $COMMON_BUILDER/src/frontend-build.sh)
BUILD_RESULTS=$?

# --------------------------------------------
# E2E tests are run separately via Playwright
# See e2e/README.md for local testing instructions
# CI E2E tests require auth setup and are handled
# in a dedicated pipeline step
# --------------------------------------------

mkdir -p $WORKSPACE/artifacts
cat << EOF > $WORKSPACE/artifacts/junit-dummy.xml
<testsuite tests="1">
    <testcase classname="dummy" name="dummytest"/>
</testsuite>
EOF

exit $BUILD_RESULTS
