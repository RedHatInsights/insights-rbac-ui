# Auth Storage State Files

This directory contains Playwright storage state files for E2E test authentication.

## Files

| File | Description | Usage |
|------|-------------|-------|
| `v1-admin.json` | Org admin for V1 (User Access) URLs | Full CRUD tests |
| `v1-user.json` | Regular user for V1 URLs | Read-only tests |
| `v2-admin.json` | Org admin for V2 (Access Management) URLs | Full CRUD tests |
| `v2-user.json` | Regular user for V2 URLs | Read-only tests |

## Generating Auth Files

Use the CLI login command to generate these files:

```bash
# V1 Admin (org admin account)
RBAC_USERNAME=admin@example.com RBAC_PASSWORD=secret \
  npm run cli -- login --headless --save-state e2e/auth/v1-admin.json

# V1 User (regular user account)
RBAC_USERNAME=user@example.com RBAC_PASSWORD=secret \
  npm run cli -- login --headless --save-state e2e/auth/v1-user.json

# V2 Admin (org admin with V2 features enabled)
RBAC_USERNAME=v2admin@example.com RBAC_PASSWORD=secret \
  npm run cli -- login --headless --save-state e2e/auth/v2-admin.json

# V2 User (regular user with V2 features enabled)
RBAC_USERNAME=v2user@example.com RBAC_PASSWORD=secret \
  npm run cli -- login --headless --save-state e2e/auth/v2-user.json
```

## Notes

- These files are gitignored as they contain session tokens
- Auth files expire - regenerate if tests fail with auth errors
- V1 vs V2 may require different user accounts depending on feature flag configuration
