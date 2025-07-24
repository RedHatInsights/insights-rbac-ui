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

CHROME_SHA=$(curl -X GET "https://quay.io/api/v1/repository/cloudservices/insights-chrome-frontend/tag/?onlyActiveTags=true&limit=100" | jq '.tags | [.[] | select(.name | test("^[a-zA-Z0-9]{7,40}$"))] | .[0].name' -r)
CHROME_CONTAINER_NAME=chrome-$CHROME_SHA

docker run -d --name $CHROME_CONTAINER_NAME --replace --network bridge quay.io/cloudservices/insights-chrome-frontend:$CHROME_SHA
mkdir -p dist
docker cp $CHROME_CONTAINER_NAME:/opt/app-root/src/build/stable/index.html dist/

CHROME_HOST=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CHROME_CONTAINER_NAME)

# docker run -t \
#   -v $PWD:/e2e:ro,Z \
#   -w /e2e \
#   -e CHROME_ACCOUNT=$CHROME_ACCOUNT \
#   -e CHROME_PASSWORD=$CHROME_PASSWORD \
#   -e RBAC_FRONTEND_USER=$RBAC_FRONTEND_USER \
#   -e RBAC_FRONTEND_PASSWORD=$RBAC_FRONTEND_PASSWORD \
#   -e CHROME_HOST=$CHROME_HOST \
#   --add-host stage.foo.redhat.com:127.0.0.1 \
#   --add-host prod.foo.redhat.com:127.0.0.1 \
#   --entrypoint bash \
#   --network bridge \
#   quay.io/cloudservices/cypress-e2e-image:b8480a8 /e2e/run-e2e.sh

# echo "After docker run"

# source is preferred to | bash -s in this case to avoid a subshell
source <(curl -sSL $COMMON_BUILDER/src/frontend-build.sh)
BUILD_RESULTS=0

# Stubbed out for now
mkdir -p $WORKSPACE/artifacts
cat << EOF > $WORKSPACE/artifacts/junit-dummy.xml
<testsuite tests="1">
    <testcase classname="dummy" name="dummytest"/>
</testsuite>
EOF

# teardown_docker
exit 0
