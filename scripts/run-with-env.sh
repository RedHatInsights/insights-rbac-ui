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
  # Debug: print what we're doing (to stderr so it doesn't pollute stdout)
  >&2 echo "[run-with-env] No .env file found at: $ENV_FILE"
  >&2 echo "[run-with-env] Using CI mode - mapping E2E_* environment variables"

  case "$ENV_FILE" in
    *v1-admin*)
      export RBAC_USERNAME="${E2E_V1_ADMIN_USERNAME}"
      export RBAC_PASSWORD="${E2E_V1_ADMIN_PASSWORD}"
      >&2 echo "[run-with-env] Mapped E2E_V1_ADMIN_* credentials"
      ;;
    *v1-readonly*)
      export RBAC_USERNAME="${E2E_V1_READONLY_USERNAME}"
      export RBAC_PASSWORD="${E2E_V1_READONLY_PASSWORD}"
      >&2 echo "[run-with-env] Mapped E2E_V1_READONLY_* credentials"
      ;;
    *v1-userviewer*)
      export RBAC_USERNAME="${E2E_V1_USERVIEWER_USERNAME}"
      export RBAC_PASSWORD="${E2E_V1_USERVIEWER_PASSWORD}"
      >&2 echo "[run-with-env] Mapped E2E_V1_USERVIEWER_* credentials"
      ;;
    *v2-admin*)
      export RBAC_USERNAME="${E2E_V2_ADMIN_USERNAME}"
      export RBAC_PASSWORD="${E2E_V2_ADMIN_PASSWORD}"
      >&2 echo "[run-with-env] Mapped E2E_V2_ADMIN_* credentials"
      ;;
    *v2-readonly*)
      export RBAC_USERNAME="${E2E_V2_READONLY_USERNAME}"
      export RBAC_PASSWORD="${E2E_V2_READONLY_PASSWORD}"
      >&2 echo "[run-with-env] Mapped E2E_V2_READONLY_* credentials"
      ;;
    *v2-userviewer*)
      export RBAC_USERNAME="${E2E_V2_USERVIEWER_USERNAME}"
      export RBAC_PASSWORD="${E2E_V2_USERVIEWER_PASSWORD}"
      >&2 echo "[run-with-env] Mapped E2E_V2_USERVIEWER_* credentials"
      ;;
  esac

  # Verify credentials are set
  if [ -z "$RBAC_USERNAME" ] || [ -z "$RBAC_PASSWORD" ]; then
    >&2 echo "[run-with-env] ERROR: RBAC_USERNAME or RBAC_PASSWORD not set!"
    >&2 echo "[run-with-env] Expected E2E_* environment variables are missing"
    exit 1
  fi

  >&2 echo "[run-with-env] RBAC_USERNAME is set (length: ${#RBAC_USERNAME})"
  >&2 echo "[run-with-env] RBAC_PASSWORD is set (length: ${#RBAC_PASSWORD})"

  exec "$@"
fi
