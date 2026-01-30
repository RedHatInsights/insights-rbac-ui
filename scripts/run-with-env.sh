#!/usr/bin/env bash
# Helper script to conditionally use dotenv-cli if env file exists
# Usage: ./scripts/run-with-env.sh <env-file> <command...>

set -e

ENV_FILE="$1"
shift

if [ -f "$ENV_FILE" ]; then
  # Local: use dotenv to load from file
  exec npx dotenv -e "$ENV_FILE" -- "$@"
else
  # CI: map Konflux E2E_* vars to RBAC_* vars based on env file name
  case "$ENV_FILE" in
    *v1-admin*)
      export RBAC_USERNAME="${E2E_V1_ADMIN_USERNAME}"
      export RBAC_PASSWORD="${E2E_V1_ADMIN_PASSWORD}"
      ;;
    *v1-readonly*)
      export RBAC_USERNAME="${E2E_V1_READONLY_USERNAME}"
      export RBAC_PASSWORD="${E2E_V1_READONLY_PASSWORD}"
      ;;
    *v1-userviewer*)
      export RBAC_USERNAME="${E2E_V1_USERVIEWER_USERNAME}"
      export RBAC_PASSWORD="${E2E_V1_USERVIEWER_PASSWORD}"
      ;;
    *v2-admin*)
      export RBAC_USERNAME="${E2E_V2_ADMIN_USERNAME}"
      export RBAC_PASSWORD="${E2E_V2_ADMIN_PASSWORD}"
      ;;
    *v2-readonly*)
      export RBAC_USERNAME="${E2E_V2_READONLY_USERNAME}"
      export RBAC_PASSWORD="${E2E_V2_READONLY_PASSWORD}"
      ;;
    *v2-userviewer*)
      export RBAC_USERNAME="${E2E_V2_USERVIEWER_USERNAME}"
      export RBAC_PASSWORD="${E2E_V2_USERVIEWER_PASSWORD}"
      ;;
  esac

  exec "$@"
fi
