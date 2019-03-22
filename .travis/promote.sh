#!/usr/bin/env bash

if [ "${CI}" = "true" ]; then
  cd "${TRAVIS_BUILD_DIR}"
  REMOTE=https://${GITHUB_PROMOTION_AUTH}@github.com/${TRAVIS_REPO_SLUG}.git
  SOURCE=${TRAVIS_BRANCH}
else
  if ! git diff-index --quiet HEAD -- ; then
    echo "Cannot promote with a dirty working tree."
    exit 1
  fi

  REMOTE=${2:-upstream}
  SOURCE=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse HEAD)
fi

DEST=$1
if [ -z "${DEST}" ]; then
  echo "Usage: $0 dest-branch [dest-remote]"
  exit 1
fi

echo "Promoting ${SOURCE} to ${DEST}..."
set -e
set -x

git checkout "${DEST}" || git checkout -b "${DEST}"
git merge --no-ff --no-edit "${SOURCE}"

{ set +x; } 2>/dev/null
echo "+git push ${DEST}"
git push "${REMOTE}" "${DEST}" &>/dev/null

if [ ! "${CI}" = "true" ]; then
  git checkout -
fi
