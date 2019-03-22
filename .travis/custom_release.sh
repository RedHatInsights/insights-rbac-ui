#!/usr/bin/env bash

NODE_ENV=production npm run build

if [ "${TRAVIS_BRANCH}" = "master" ]; then
    .travis/release.sh "ci-beta"

    .travis/promote.sh "qa-beta"
    .travis/promote.sh "ci-stable"
    .travis/promote.sh "qa-stable"
elif [[ "${TRAVIS_BRANCH}" = "ci-stable"  || "${TRAVIS_BRANCH}" = "qa-beta" || "${TRAVIS_BRANCH}" = "qa-stable" || "${TRAVIS_BRANCH}" = "prod-beta" || "${TRAVIS_BRANCH}" = "prod-stable" ]]; then
    .travis/release.sh "${TRAVIS_BRANCH}"
fi
