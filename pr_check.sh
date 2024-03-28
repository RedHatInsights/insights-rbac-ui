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

docker run -t \
  -v $PWD:/e2e:ro,Z \
  -w /e2e \
  -e CHROME_ACCOUNT=$CHROME_ACCOUNT \
  -e CHROME_PASSWORD=$CHROME_PASSWORD \
  --add-host stage.foo.redhat.com:127.0.0.1 \
  --add-host prod.foo.redhat.com:127.0.0.1 \
  --entrypoint bash \
  quay.io/cloudservices/cypress-e2e-image:971bc23 /e2e/run-e2e.sh

echo "After docker run"

# source is preferred to | bash -s in this case to avoid a subshell
source <(curl -sSL $COMMON_BUILDER/src/frontend-build.sh)
BUILD_RESULTS=$?

# === Deploy ephemeral ===

export APP_NAME=rbac
export COMPONENT="rbac"
export COMPONENT_NAME="rbac"

# Install bonfire
CICD_URL=https://raw.githubusercontent.com/RedHatInsights/bonfire/master/cicd
curl -s $CICD_URL/bootstrap.sh > .cicd_bootstrap.sh
source .cicd_bootstrap.sh

echo "Taking a short nap"
sleep 60

SHORT_SHA=$(git rev-parse --short HEAD)
IMAGE_TAG="pr-${ghprbPullId}-${SHORT_SHA}"
echo "Expecting image tag ${IMAGE_TAG}"

set -e
# Deploy to an ephemeral namespace for testing
# We deploy rbac and override the image tag for insights-frontend-chrome
export IMAGE="quay.io/cloudservices/rbac-frontend"
export GIT_COMMIT=master
export DEPLOY_FRONTENDS=true
source $CICD_ROOT/deploy_ephemeral_env.sh


# === Run RBAC smoke tests in CJI ===
# TODO
# Bump


# Stubbed out for now
mkdir -p $WORKSPACE/artifacts
cat << EOF > $WORKSPACE/artifacts/junit-dummy.xml
<testsuite tests="1">
    <testcase classname="dummy" name="dummytest"/>
</testsuite>
EOF

# teardown_docker
exit $BUILD_RESULTS
