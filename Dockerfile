FROM registry.access.redhat.com/ubi9/nodejs-22:9.5-1746535891 as builder

USER root

RUN dnf install jq -y

RUN npm i -g yarn

# ────────── SENTRY BUILD ARGS ──────────
# NOTE:
# Tekton/Konflux passes values like --build-arg ENABLE_SENTRY=true and
# --build-arg SENTRY_RELEASE=<commit SHA> during the build.
# ARG makes them available only at build-time.
# The ENV line copies them into the final container so they persist at runtime,
# letting Node (process.env.ENABLE_SENTRY, process.env.SENTRY_RELEASE, etc.)
# and other tools read them.
ARG ENABLE_SENTRY=false
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
ENV ENABLE_SENTRY=${ENABLE_SENTRY} \
  SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} \
  SENTRY_RELEASE=${SENTRY_RELEASE}
ARG NPM_BUILD_SCRIPT=""

# Persist yarn build script at runtime.
ARG YARN_BUILD_SCRIPT=""
ARG USES_YARN=false
ENV YARN_BUILD_SCRIPT=${YARN_BUILD_SCRIPT} \
  USES_YARN=${USES_YARN}

COPY build-tools/universal_build.sh build-tools/build_app_info.sh build-tools/server_config_gen.sh /opt/app-root/bin/
COPY --chown=default . .

RUN chmod +x build-tools/parse-secrets.sh

# 👉 Mount one secret with many keys; export token only if key exists
RUN --mount=type=secret,id=build-container-additional-secret/secrets,required=false \
  # set -euo pipefail; \
  echo "=== Starting parse-secrets.sh ===" && \
  ./build-tools/parse-secrets.sh 2>&1 && \
  echo "=== Finished parse-secrets.sh ===" && \
  # Get the app name and define the secrets variable name within the same RUN layer
  APP_NAME="$(jq -r '.insights.appname' < package.json | tr '[:lower:]-' '[:upper:]_')"; \
  SECRET_VAR_NAME="${APP_NAME}_SECRET"; \
  if [ -n "${!SECRET_VAR_NAME:-}" ]; then \
  export ENABLE_SENTRY=true; \
  export SENTRY_AUTH_TOKEN="${!SECRET_VAR_NAME}"; \
  echo "Sentry: token found for ${APP_NAME} – enabling sourcemap upload."; \
  else \
  echo "Sentry: no token for ${APP_NAME} – using any pre-set token (if provided) or skipping upload."; \
  fi; \
  universal_build.sh


FROM quay.io/redhat-services-prod/hcm-eng-prod-tenant/caddy-ubi:latest

COPY LICENSE /licenses/

ENV CADDY_TLS_MODE http_port 8000
# fallback value to the env public path env variable
# Caddy must have a default value for the public path or it will not start
ENV ENV_PUBLIC_PATH "/default"

# Copy the valpop binary from the valpop image
COPY --from=quay.io/redhat-services-prod/hcc-platex-services-tenant/valpop:latest /usr/local/bin/valpop /usr/local/bin/valpop

COPY --from=builder /opt/app-root/src/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /opt/app-root/src/dist dist
COPY package.json .
