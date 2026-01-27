# E2E Pipeline Setup for insights-rbac-ui

This document outlines the complete setup required for the Konflux E2E test pipeline.

## Overview

The E2E pipeline has been configured to run Playwright tests automatically on every pull request. However, several additional setup steps are required before the pipeline will work.

## Pipeline Configuration

**Pipeline File:** `.tekton/insights-rbac-ui-pull-request-e2e.yaml`

**Key Parameters:**
- `test-app-name`: `insights-rbac-ui`
- `test-app-port`: `8000` (app assets sidecar)
- `chrome-port`: `9912` (chrome assets sidecar)
- `serviceAccountName`: `build-pipeline-insights-rbac-ui`
- `namespace`: `rh-platform-experien-tenant`

## Required ConfigMaps

The following ConfigMaps must be created in the **internal** `konflux-release-data` repository (GitLab):

### 1. App Caddy Configuration

Create a ConfigMap for routing requests to the RBAC app assets:

**File:** `konfluxtenant-rh-platform-experien/insights-rbac-ui-app-caddy-config.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: insights-rbac-ui-app-caddy-config
  namespace: rh-platform-experien-tenant
data:
  Caddyfile: |
    :8000 {
      # Route for the main app assets
      handle /apps/rbac/* {
        root * /srv/dist
        try_files {path} /apps/rbac/index.html
        file_server
      }

      # Route for IAM paths (if needed)
      handle /iam/* {
        root * /srv/dist
        try_files {path} /apps/rbac/index.html
        file_server
      }

      # Fed-mods.json manifest
      handle /apps/rbac/fed-mods.json {
        root * /srv/dist
        file_server
      }
    }
```

**Notes:**
- Verify `/srv/dist` is the correct location in your container image
- You may need to adjust paths based on actual asset structure
- To verify: Run `podman run -it <your-image> /bin/sh` and explore filesystem

### 2. Frontend Developer Proxy Caddyfile

Create a ConfigMap for the proxy routing logic:

**File:** `konflux-tenant-rh-platform-experien/insights-rbac-ui-dev-proxy-caddyfile.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: insights-rbac-ui-dev-proxy-caddyfile
  namespace: rh-platform-experien-tenant
data:
  Caddyfile: |
    {
      admin off
      auto_https off
      log {
        level INFO
      }
    }

    :8080 {
      log {
        level DEBUG
      }

      # Route RBAC app requests to the app assets sidecar
      @rbac_app {
        path /apps/rbac/*
        path /iam/*
      }
      reverse_proxy @rbac_app localhost:8000

      # Route chrome assets to the chrome sidecar
      @chrome {
        path /apps/chrome/*
        path /beta/apps/chrome/*
      }
      reverse_proxy @chrome localhost:9912

      # Everything else goes to stage environment
      reverse_proxy https://console.stage.redhat.com {
        header_up Host console.stage.redhat.com
      }
    }
```

**Notes:**
- Port 8000 = insights-rbac-ui app assets sidecar
- Port 9912 = insights-chrome assets sidecar
- Unmatched routes proxy to stage environment

### How to Create ConfigMaps

1. **Access the internal repository:**
   ```bash
   git clone git@gitlab.cee.redhat.com:releng/konflux-release-data.git
   cd konflux-release-data
   ```

2. **Create the ConfigMap files** in the appropriate directory:
   ```
   konflux-release-data/
   └── konflux-tenant-rh-platform-experien/
       ├── insights-rbac-ui-app-caddy-config.yaml
       └── insights-rbac-ui-dev-proxy-caddyfile.yaml
   ```

3. **Submit a merge request** to add these files

4. **Reference PR for example:**
   - https://gitlab.cee.redhat.com/releng/konflux-release-data/-/merge_requests/13221/diffs
   - (learning-resources ConfigMaps)

## Required Vault Secrets

The pipeline needs E2E test user credentials stored in Vault.

### Secret Name
`insights-rbac-ui-credentials-secret`

### Required Keys
- `E2E_USER` - Test automation user username
- `E2E_PASSWORD` - Test automation user password

### Setup Instructions
1. Refer to the **Platform Engineer Survival Guide** for Vault setup
2. Create credentials for your specific application
3. Configure the serviceAccount (`build-pipeline-insights-rbac-ui`) to access the secret

**Note:** The existing Cypress tests use:
- `CHROME_ACCOUNT` / `CHROME_PASSWORD`
- `RBAC_FRONTEND_USER` / `RBAC_FRONTEND_PASSWORD`

You may want to reuse these credentials or create new ones specifically for Playwright.

## Dockerfile Requirements

The pipeline references `./build-tools/Dockerfile` which currently does not exist.

### Options:

1. **Create a Dockerfile** at `./build-tools/Dockerfile`:
   ```dockerfile
   FROM registry.access.redhat.com/ubi9/nodejs-20

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --production

   COPY dist /srv/dist

   EXPOSE 8000

   CMD ["npm", "start"]
   ```

2. **Use Konflux default Dockerfile** - Modify the pipeline to not specify a dockerfile parameter (uses default)

3. **Copy from another repository** - Check learning-resources or frontend-starter-app for examples

## Testing the Pipeline

### Before First Test Run

- [ ] ConfigMaps created in konflux-release-data
- [ ] Vault secrets configured
- [ ] Dockerfile exists (or pipeline updated)
- [ ] Playwright tests exist and run locally
- [ ] serviceAccount has necessary permissions

### First Test Run

1. Create a small change in a new branch
2. Open a pull request to `master`
3. Monitor the pipeline execution in Konflux UI
4. Check for pipeline comments on the PR

### Common Issues

#### Pipeline Freeze on e2e-tests Task
**Symptoms:**
```
STEP-E2E-TESTS
  LOG FETCH ERROR:
  no parsed logs for the json path
```

**Causes:**
- Missing ConfigMaps
- Missing secrets
- Incorrect parameter values
- Pod creation failure

**Solution:**
- Check Konflux UI for OpenShift Events
- Verify all ConfigMaps exist in correct namespace
- Validate all parameters are set correctly
- Open ticket in #konflux-users if issue persists

#### Asset Routing Problems
**Symptoms:**
- 404 errors in test logs
- Assets not loading
- Incorrect pages being served

**Solution:**
- Verify Caddy config routes match your app structure
- Use `podman run` to inspect container filesystem
- Check proxy routes map correctly (8000 for app, 9912 for chrome)

## Migration Path

To switch from the current pipeline to the E2E pipeline:

### Option 1: Replace Existing Pipeline (Breaking Change)
```bash
mv .tekton/insights-rbac-ui-pull-request.yaml .tekton/insights-rbac-ui-pull-request-unit-tests-only.yaml
mv .tekton/insights-rbac-ui-pull-request-e2e.yaml .tekton/insights-rbac-ui-pull-request.yaml
```

### Option 2: Run Both Pipelines (Safe)
Keep both files:
- `insights-rbac-ui-pull-request.yaml` - Current unit tests only
- `insights-rbac-ui-pull-request-e2e.yaml` - New E2E pipeline

Configure different trigger conditions (e.g., E2E only on specific branches or labels)

### Option 3: Test with Minikube First (Recommended)
1. Clone https://github.com/catastrophe-brandon/tekton-playwright-e2e
2. Follow README to set up minikube
3. Adapt the pipeline for insights-rbac-ui
4. Test locally before migrating to Konflux

## Support Channels

- **#konflux-users** - Slack channel for Konflux support
- **Platform Experience Team** - For konflux-release-data access
- **Platform Engineer Survival Guide** - Vault and secrets setup

## Next Steps

1. ✅ Playwright tests created
2. ✅ E2E pipeline configuration created
3. ⬜ Create ConfigMaps in konflux-release-data
4. ⬜ Set up Vault secrets
5. ⬜ Create or verify Dockerfile
6. ⬜ Test pipeline with a PR
7. ⬜ Iterate and fix any issues
8. ⬜ Switch production pipeline to E2E version

## Additional Resources

- **Shared E2E Pipeline:** https://github.com/RedHatInsights/konflux-pipelines/blob/main/pipelines/platform-ui/docker-build-run-all-tests.yaml
- **Public E2E Docs:** https://github.com/RedHatInsights/frontend-experience-docs/blob/master/pages/testing/e2e-pipeline.md
- **Caddy Documentation:** https://caddyserver.com/docs/caddyfile
- **Example Repository:** learning-resources (working E2E pipeline)
