# git
Use conventional commits compatible messages.

# Agent context
See [AGENTS.md](./AGENTS.md) for project context, non-negotiables, and the docs index.
# currentDate
Today's date is 2026-02-26.

# Seeder (src/cli/commands/seeder.ts)

## Overview
The seeder creates test data (roles, groups, workspaces) for E2E tests. It's designed to be idempotent and handle eventual consistency issues with the RBAC API.

## Key Design Decisions

### Idempotence Strategy
The seeder follows a delete-then-create pattern for idempotent seeding:
1. List existing resources by name
2. Delete if found
3. Create fresh resource

This allows re-running with the same prefix without errors.

### Eventual Consistency Handling
The workspaces API has eventual consistency issues. The seeder handles this with:

**Aggressive Deletion (Primary Fix)**
When CREATE fails with "Can't create workspace with same name" error:
- Re-queries workspaces by name
- Filters client-side by parent_id
- Deletes the workspace
- Waits 2s for propagation
- Retries CREATE

This handles the case where:
- Initial LIST doesn't find the workspace (eventual consistency lag)
- Workspace actually exists
- CREATE fails with 400 error

**Client-Side Filtering**
The API may not support filtering by parent_id in query params, so we:
- List by name only
- Filter client-side by parent_id
- Ensures we delete/create in the correct parent

**Retry Logic**
- Workspace deletion: 3 attempts with 2s backoff
- Workspace creation: 3 attempts with aggressive deletion between attempts
- Only accepts 404 (not found) and 2xx (success) status codes
- Any other status fails immediately

### Logging
- Clean log levels: `[INFO]`, `[WARN]`, `[ERROR]`, `[DEBUG]`
- NO EMOJIS (they're awful in CI logs)
- Debug mode enabled with `DEBUG_CLI=1` environment variable
- Shows detailed workspace matching info in debug mode

### Error Handling
- Strict status code validation on deletes (only 404/2xx accepted)
- Detailed error messages including resource name, description, parent_id
- Curl commands only shown in debug mode

## Common Issues

### "Can't create workspace with same name within same parent workspace"
This means:
- Workspace exists but LIST didn't find it
- Aggressive deletion will trigger automatically
- Should resolve after 1-2 retry attempts

### "Failed to delete workspace after 3 attempts"
This means:
- Deletion returned unexpected status code (not 404 or 2xx)
- Check API health or permissions
- May indicate a real API problem

### Workspace not found for deletion but exists
- Expected behavior due to eventual consistency
- Aggressive deletion handles this automatically
- Not an error, just API lag

## Testing Locally

Run V2 seeding (workspaces are V2 only):
```bash
# Basic run
node scripts/run-with-env.js e2e/auth/.env.v2-admin npm run cli -- seed --file e2e/fixtures/seed-v2.json --prefix "test-123"

# With debug logging
DEBUG_CLI=1 node scripts/run-with-env.js e2e/auth/.env.v2-admin npm run cli -- seed --file e2e/fixtures/seed-v2.json --prefix "test-123"

# Or use the E2E helper
TEST_PREFIX_V2=test-123 npm run e2e:v2:seed
```

Test idempotence by running multiple times with same prefix.

## Pipeline Usage

Pipeline uses PR number as prefix for predictability:
```bash
TEST_PREFIX=rbac-ui-2146
TEST_PREFIX_V1=rbac-ui-2146-v1
TEST_PREFIX_V2=rbac-ui-2146-v2
```

This means:
- Re-running failed pipeline uses same data
- Easy to identify test data by PR number
- Idempotent seeder handles repeated runs
