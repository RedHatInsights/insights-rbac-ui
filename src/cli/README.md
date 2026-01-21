# RBAC CLI

A command-line interface for Red Hat RBAC that reuses React Query hooks from the web application.

## Authentication

The CLI uses **Playwright** to obtain authentication tokens from a real browser session.
No separate SSO client registration is required.

### How it works

1. On first run (or when token expires), a browser window opens
2. You manually log in to the Red Hat Console
3. The CLI extracts your authentication token
4. Token is cached locally at `~/.rbac-cli-token`

### Commands

```bash
# Authenticate (opens browser for manual login)
npm run cli -- login

# Clear cached token
npm run cli -- logout

# Show auth status
npm run cli -- info
```

## Quick Start

```bash
# First, authenticate
npm run cli -- login

# Then use any command
npm run cli              # Interactive TUI
npm run cli -- roles     # List roles
npm run cli -- groups    # List groups
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run cli` | Interactive TUI mode |
| `npm run cli -- login` | Authenticate via browser |
| `npm run cli -- logout` | Clear cached token |
| `npm run cli -- info` | Show configuration and auth status |
| `npm run cli -- roles` | List all roles |
| `npm run cli -- groups` | List all groups |
| `npm run cli -- workspaces` | List all workspaces |
| `npm run cli -- seed --json '{...}'` | Create resources from JSON |

### List Command Options

```bash
npm run cli -- roles --limit 50        # Limit results
npm run cli -- roles --json            # Output as JSON
npm run cli -- groups -l 100 --json    # Combined options
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RBAC_ENV` | Environment (`stage`, `prod`, `local`) | `stage` |
| `RBAC_API_URL` | Override API base URL | (derived from env) |
| `RBAC_PAC_URL` | PAC file URL for proxy auto-config | - |
| `RBAC_PROXY` | Direct HTTP proxy URL | - |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Set to `0` to skip SSL verification | `1` |
| `DEBUG_CLI` | Enable verbose API debugging | - |

### Corporate Proxy Configuration

If you're behind a corporate VPN with a PAC file, you'll need to configure the proxy:

```bash
# Find your PAC URL (macOS)
scutil --proxy | grep ProxyAutoConfigURLString

# Run CLI with PAC proxy (replace with your PAC URL)
NODE_TLS_REJECT_UNAUTHORIZED=0 \
RBAC_PAC_URL="https://your-proxy-pac-url/proxy.pac" \
npm run cli -- roles

# Or export for the session
export NODE_TLS_REJECT_UNAUTHORIZED=0
export RBAC_PAC_URL="https://your-proxy-pac-url/proxy.pac"
npm run cli -- roles
```

### Using a Direct Proxy

```bash
RBAC_PROXY=http://proxy.example.com:8080 npm run cli -- roles
```

## Seed Payload Schema

```json
{
  "roles": [
    {
      "name": "string (required)",
      "display_name": "string (optional)",
      "description": "string (optional)",
      "access": [
        {
          "permission": "app:resource:action",
          "resourceDefinitions": []
        }
      ]
    }
  ],
  "groups": [
    {
      "name": "string (required)",
      "description": "string (optional)",
      "user_list": [{ "username": "string" }],
      "roles_list": ["role-uuid-1", "role-uuid-2"]
    }
  ],
  "workspaces": [
    {
      "name": "string (required)",
      "description": "string (optional)",
      "parent_id": "string (optional)"
    }
  ]
}
```

## Example Usage

### List roles as JSON

```bash
npm run cli -- roles --json | jq '.data[].name'
```

### Create a role

```bash
npm run cli -- seed --json '{
  "roles": [{
    "name": "cost-analyst",
    "display_name": "Cost Analyst",
    "description": "Read access to cost management"
  }]
}'
```

### Create multiple resources

```bash
npm run cli -- seed --json '{
  "roles": [
    {"name": "admin", "description": "Full access"},
    {"name": "viewer", "description": "Read-only"}
  ],
  "groups": [
    {"name": "Finance Team", "description": "Finance users"}
  ]
}'
```

## Interactive Mode Controls

| Key | Action |
|-----|--------|
| `↑/↓` | Navigate list |
| `1` | Switch to Roles view |
| `2` | Switch to Groups view |
| `3` | Switch to Workspaces view |
| `D` | Delete selected item |
| `R` | Refresh data |
| `Q` | Quit |

## File Structure

```
src/cli/
├── cli.tsx                    # Entry point with Commander
├── auth.ts                    # Playwright-based authentication
├── api-client.ts              # Axios client with auth headers
├── types.ts                   # Zod schemas and TypeScript types
├── index.ts                   # Package exports
├── README.md
├── components/
│   ├── InteractiveDashboard.tsx  # TUI mode
│   ├── HeadlessSeeder.tsx        # Scripting mode
│   └── index.ts
└── hooks/
    ├── roles.ts               # Role queries/mutations
    ├── groups.ts              # Group queries/mutations
    ├── workspaces.ts          # Workspace queries/mutations
    └── index.ts
```

## Token Management

The CLI caches tokens at `~/.rbac-cli-token`. The file contains:
- The JWT token
- Expiration timestamp
- When it was fetched

Tokens are automatically refreshed when they expire.

### Security

- Token file is created with `0600` permissions (owner read/write only)
- Tokens are never logged or displayed in full
- Use `npm run cli -- logout` to clear the cached token

## Troubleshooting

### Authentication failed

```bash
# Clear token and re-authenticate
npm run cli -- logout
npm run cli -- login
```

### Browser doesn't open

Ensure Playwright browsers are installed:

```bash
npx playwright install chromium
```

### Network errors

Check the API URL:

```bash
npm run cli -- info
```

Override if needed:

```bash
export RBAC_API_URL="https://your-api-url/api/rbac/v1"
npm run cli -- roles
```

### Raw mode not supported

The interactive TUI requires a proper terminal. Use list commands instead:

```bash
npm run cli -- roles --json
```
