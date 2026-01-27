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

ConfigMaps must be created in the **internal** `konflux-release-data` repository (GitLab).

### Use Plumber to Generate ConfigMaps (Recommended)

**Plumber** is a Python tool that automatically generates the required Kubernetes ConfigMaps by reading your repository's configuration files.

#### Step 1: Install Plumber

```bash
# Clone the plumber repository
git clone https://github.com/catastrophe-brandon/plumber.git
cd plumber

# Install using uv (recommended) or pip
uv pip install -e .
# OR
pip install -e .
```

#### Step 2: Run Plumber

```bash
plumber insights-rbac-ui \
  https://github.com/RedHatInsights/insights-rbac-ui.git \
  --app-configmap-name insights-rbac-ui-app-caddy-config \
  --proxy-configmap-name insights-rbac-ui-dev-proxy-caddyfile \
  --namespace rh-platform-experien-tenant
```

**What Plumber Does:**
- Reads routes from `deploy/frontend.yaml` or `fec.config.js`
- Generates two YAML files:
  - `insights-rbac-ui-app-caddy-config.yaml` - App asset routing configuration
  - `insights-rbac-ui-dev-proxy-caddyfile.yaml` - Reverse proxy routing configuration
- Validates output using yamllint
- Creates Kubernetes-ready ConfigMaps with correct structure

#### Step 3: Verify Generated ConfigMaps

Review the generated files in your current directory:

```bash
cat insights-rbac-ui-app-caddy-config.yaml
cat insights-rbac-ui-dev-proxy-caddyfile.yaml
```

Ensure:
- Routes match your application paths (e.g., `/apps/rbac/*`, `/iam/*`)
- Namespace is `rh-platform-experien-tenant`
- ConfigMap names match pipeline configuration

#### Step 4: Submit to konflux-release-data

1. **Access the internal repository:**
   ```bash
   git clone git@gitlab.cee.redhat.com:releng/konflux-release-data.git
   cd konflux-release-data
   ```

2. **Create the ConfigMap files** in the appropriate directory:
   ```
   konflux-release-data/
   └── tenants-config/cluster/stone-prd-rh01/tenants/rh-platform-experien-tenant/
       ├── insights-rbac-ui-app-caddy-config.yaml
       └── insights-rbac-ui-dev-proxy-caddyfile.yaml
   ```

3. **Add ConfigMaps to kustomization.yaml** in the same directory

4. **Submit a merge request** to add these files

5. **Reference MRs for examples:**
   - **insights-rbac-ui (this project):** Branch `add-insights-rbac-ui-e2e-configmaps`
     - Contains the actual Plumber-generated ConfigMaps for this repository
     - Shows the exact directory structure and kustomization.yaml update
   - **learning-resources:** https://gitlab.cee.redhat.com/releng/konflux-release-data/-/merge_requests/13221/diffs
     - Another working example of E2E ConfigMaps

### Reference: What Plumber Generates

For educational purposes, here's what the generated ConfigMaps typically look like:

<details>
<summary>Example: insights-rbac-ui-app-caddy-config.yaml</summary>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: insights-rbac-ui-app-caddy-config
  namespace: rh-platform-experien-tenant
data:
  Caddyfile: |
    :8000 {
      # Routes generated from frontend.yaml paths
      handle /apps/rbac/* {
        root * /srv/dist
        try_files {path} /apps/rbac/index.html
        file_server
      }

      handle /iam/* {
        root * /srv/dist
        try_files {path} /apps/rbac/index.html
        file_server
      }

      # Additional routes as needed
    }
```
</details>

<details>
<summary>Example: insights-rbac-ui-dev-proxy-caddyfile.yaml</summary>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: insights-rbac-ui-dev-proxy-caddyfile
  namespace: rh-platform-experien-tenant
data:
  Caddyfile: |
    :8080 {
      # Route app requests to port 8000
      @rbac_app {
        path /apps/rbac/*
        path /iam/*
      }
      reverse_proxy @rbac_app localhost:8000

      # Route chrome to port 9912
      @chrome {
        path /apps/chrome/*
      }
      reverse_proxy @chrome localhost:9912

      # Everything else to stage
      reverse_proxy https://console.stage.redhat.com {
        header_up Host console.stage.redhat.com
      }
    }
```
</details>

**Note:** These are examples - Plumber will generate the actual routes based on your repository's configuration files.

### What Was Generated for insights-rbac-ui

For this repository, Plumber successfully extracted the following routes from `deploy/frontend.yaml` and generated ConfigMaps:

**Routes extracted:**
- `/apps/rbac`
- `/iam`
- `/iam/my-user-access`
- `/settings/rbac`
- `/iam/user-access`
- `/iam/access-management`

**ConfigMaps generated:**
- `insights-rbac-ui-app-caddy-config.yaml` (4.8KB, 198 lines)
- `insights-rbac-ui-dev-proxy-caddyfile.yaml` (889 bytes, 50 lines)

**Submission:**
- Branch: `add-insights-rbac-ui-e2e-configmaps` in konflux-release-data
- MR: https://gitlab.cee.redhat.com/releng/konflux-release-data/-/merge_requests/14023
- Status: Pending merge
- Location: `tenants-config/cluster/stone-prd-rh01/tenants/rh-platform-experien-tenant/`
- Files submitted:
  - `insights-rbac-ui-app-caddy-config.yaml` (ConfigMap)
  - `insights-rbac-ui-dev-proxy-caddyfile.yaml` (ConfigMap)
  - `insights-rbac-ui-credentials-secret.yaml` (ExternalSecret)

All files passed yamllint validation with zero errors.

## Required Vault Secrets

The pipeline needs E2E test user credentials stored in Vault.

### Secret Name
`insights-rbac-ui-credentials-secret`

### Required Keys
All 4 keys are required by the E2E pipeline:
- `e2e-user` - Test automation user username
- `e2e-password` - Test automation user password
- `e2e-hcc-env-url` - HCC environment URL for testing
- `e2e-stage-actual-hostname` - Stage environment hostname

### ExternalSecret Configuration

The ExternalSecret YAML has been generated and submitted to konflux-release-data (see MR above). This configuration will automatically sync credentials from Vault to the Kubernetes secret.

**Vault Path:** `creds/konflux/insights-rbac-ui`

The ExternalSecret uses the `insights-appsre-vault` ClusterSecretStore and refreshes credentials every 15 minutes.

### Setup Instructions
1. Refer to the **Platform Engineer Survival Guide** for Vault setup
2. Create credentials in Vault at path `creds/konflux/insights-rbac-ui` with all 4 required properties:
   - `username` - Test automation user username (mapped to e2e-user)
   - `password` - Test automation user password (mapped to e2e-password)
   - `e2e-hcc-env-url` - HCC environment URL
   - `e2e-stage-actual-hostname` - Stage environment hostname
3. Verify the serviceAccount (`build-pipeline-insights-rbac-ui`) has necessary permissions

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
3. ✅ Install and run Plumber to generate ConfigMaps
4. ✅ Submit generated ConfigMaps to konflux-release-data
   - Branch: `add-insights-rbac-ui-e2e-configmaps`
   - MR: https://gitlab.cee.redhat.com/releng/konflux-release-data/-/merge_requests/14023
5. ✅ Generate ExternalSecret YAML for Vault credentials
   - ⬜ Add credentials to Vault at `creds/konflux/insights-rbac-ui`
6. ⬜ Create or verify Dockerfile
7. ⬜ Wait for MR (ConfigMaps + ExternalSecret) to be approved and merged
8. ⬜ Test pipeline with a PR
9. ⬜ Iterate and fix any issues
10. ⬜ Switch production pipeline to E2E version

## Additional Resources

- **Plumber (ConfigMap Generator):** https://github.com/catastrophe-brandon/plumber
  - Automatically generates ConfigMaps from repository configuration
  - Required for E2E pipeline setup
- **Shared E2E Pipeline:** https://github.com/RedHatInsights/konflux-pipelines/blob/main/pipelines/platform-ui/docker-build-run-all-tests.yaml
- **Public E2E Docs:** https://github.com/RedHatInsights/frontend-experience-docs/blob/master/pages/testing/e2e-pipeline.md
- **Caddy Documentation:** https://caddyserver.com/docs/caddyfile
- **Example Repository:** learning-resources (working E2E pipeline)
