#!/usr/bin/env node
/**
 * RBAC CLI - Command Line Interface for Role-Based Access Control
 *
 * This CLI uses React Query hooks in a terminal environment via React Ink.
 * Authentication is handled via Playwright browser login.
 *
 * Usage:
 *   rbac-cli                              # Interactive TUI mode
 *   rbac-cli login                        # Force re-authentication (interactive)
 *   rbac-cli login --headless             # Automated login for CI/CD
 *   rbac-cli seed --file payload.json     # Headless: Create resources from JSON
 *   rbac-cli cleanup --prefix "test-"     # Headless: Delete test resources
 *   rbac-cli roles                        # List roles
 *
 * Environment Variables:
 *   RBAC_ENV          - Environment (stage/prod/local)
 *   RBAC_API_URL      - API base URL override
 *   RBAC_USERNAME     - Username for headless login
 *   RBAC_PASSWORD     - Password for headless login
 *   RBAC_PAC_URL      - PAC file URL for proxy auto-config
 *   HTTPS_PROXY       - CI sidecar proxy URL
 *   DEBUG_CLI         - Enable verbose debugging
 */

// ============================================================================
// HEADLESS COMMAND ROUTING (Early Detection - Before React/Ink)
// ============================================================================

// Parse argv early to detect headless commands
const args = process.argv.slice(2);

/**
 * Check if this is a headless command that should bypass the Ink TUI.
 */
function isHeadlessCommand(): { type: 'login-headless' | 'seed' | 'cleanup'; args: string[] } | null {
  // login --headless
  if (args.includes('login') && args.includes('--headless')) {
    return { type: 'login-headless', args };
  }

  // seed command (always headless)
  if (args[0] === 'seed') {
    return { type: 'seed', args };
  }

  // cleanup command (always headless)
  if (args[0] === 'cleanup') {
    return { type: 'cleanup', args };
  }

  return null;
}

/**
 * Parse command-line arguments for headless commands.
 */
function parseHeadlessArgs(cmdArgs: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  for (let i = 0; i < cmdArgs.length; i++) {
    const arg = cmdArgs[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = cmdArgs[i + 1];

      // Check if next arg is a value or another flag
      if (nextArg && !nextArg.startsWith('--')) {
        result[key] = nextArg;
        i++; // Skip the value
      } else {
        result[key] = true; // Boolean flag
      }
    }
  }

  return result;
}

/**
 * Run headless command and exit.
 */
async function runHeadlessCommand(command: { type: 'login-headless' | 'seed' | 'cleanup'; args: string[] }): Promise<never> {
  const parsedArgs = parseHeadlessArgs(command.args);

  let exitCode: number;

  switch (command.type) {
    case 'login-headless': {
      const { runLoginHeadless } = await import('./commands/login-headless.js');
      exitCode = await runLoginHeadless({
        saveState: typeof parsedArgs['save-state'] === 'string' ? parsedArgs['save-state'] : undefined,
        stdout: parsedArgs['stdout'] === true,
      });
      break;
    }

    case 'seed': {
      const { runSeeder } = await import('./commands/seeder.js');
      exitCode = await runSeeder({
        file: typeof parsedArgs['file'] === 'string' ? parsedArgs['file'] : '',
        prefix: typeof parsedArgs['prefix'] === 'string' ? parsedArgs['prefix'] : undefined,
        dryRun: parsedArgs['dry-run'] === true,
        json: parsedArgs['json'] === true,
      });
      break;
    }

    case 'cleanup': {
      const { runCleanup } = await import('./commands/cleanup.js');
      exitCode = await runCleanup({
        prefix: typeof parsedArgs['prefix'] === 'string' ? parsedArgs['prefix'] : undefined,
        nameMatch: typeof parsedArgs['name-match'] === 'string' ? parsedArgs['name-match'] : undefined,
        dryRun: parsedArgs['dry-run'] === true,
      });
      break;
    }
  }

  // Ensure clean exit - allow pending I/O to flush
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(exitCode);
}

// ============================================================================
// INTERACTIVE CLI (React/Ink TUI)
// ============================================================================

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import * as fs from 'fs';
import { ErrorBoundary, HeadlessSeeder, InteractiveDashboard } from './components/index.js';
import { type SeedPayload, SeedPayloadSchema } from './types.js';
import { clearToken, getApiBaseUrl, getToken, getTokenInfo } from './auth.js';
import { createCliServices, getApiClient, getMaskedToken, initializeApiClient } from './api-client.js';
// Use file URL for ESM compatibility with tsx on Node 22
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { ServiceProvider } = await import(resolve(__dirname, '../contexts/ServiceContext.js'));
import type { AppServices } from '../contexts/ServiceContext.js';
import { useGroupsQuery, useRolesQuery, useWorkspacesQuery } from './queries.js';

// ============================================================================
// ENTRY POINT - Must be after ServiceProvider import
// ============================================================================

const headlessCommand = isHeadlessCommand();
if (headlessCommand) {
  // Run headless command and exit - no Ink TUI
  await runHeadlessCommand(headlessCommand);
} else {
  // Continue with normal CLI (React/Ink TUI)
  await runInteractiveCli();
}

async function runInteractiveCli(): Promise<void> {
  // ============================================================================
  // Query Client Configuration
  // ============================================================================

  function createQueryClient(options: { scripting?: boolean } = {}): QueryClient {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: options.scripting ? false : 1,
          staleTime: options.scripting ? 0 : 30_000,
        },
        mutations: {
          retry: false,
        },
      },
    });
  }

  // ============================================================================
  // App Wrapper with ServiceProvider and IntlProvider
  // ============================================================================

  interface AppWrapperProps {
    children: React.ReactNode;
    queryClient: QueryClient;
    services: AppServices;
  }

  function AppWrapper({ children, queryClient, services }: AppWrapperProps): React.ReactElement {
    return (
      <ErrorBoundary>
        <IntlProvider locale="en" messages={{}}>
          <ServiceProvider value={services}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </ServiceProvider>
        </IntlProvider>
      </ErrorBoundary>
    );
  }

  // ============================================================================
  // Authentication Helper
  // ============================================================================

  async function ensureAuthenticated(): Promise<AppServices> {
    try {
      const token = await getToken();
      initializeApiClient(token);
      // Create CLI services with the initialized axios client
      return createCliServices(getApiClient());
    } catch (error) {
      console.error('\n❌ Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      console.error('   Please try: npm run cli -- login\n');
      process.exit(1);
    }
  }

  // ============================================================================
  // Command Handlers
  // ============================================================================

  async function runInteractiveMode(): Promise<void> {
    const services = await ensureAuthenticated();

    const queryClient = createQueryClient({ scripting: false });

    // Ensure terminal is in a clean state before Ink takes over
    // This helps recover from any previous commands that may have left terminal in bad state
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    // Clear screen and reset cursor
    process.stdout.write('\x1b[2J\x1b[H');
    // Reset terminal attributes
    process.stdout.write('\x1b[0m');

    const { waitUntilExit } = render(
      <AppWrapper queryClient={queryClient} services={services}>
        <InteractiveDashboard queryClient={queryClient} />
      </AppWrapper>,
      {
        exitOnCtrlC: true,
        // Don't let Ink intercept console output - we handle it ourselves via stderr
        patchConsole: false,
      },
    );

    await waitUntilExit();
  }

  function parsePayload(jsonString: string): SeedPayload {
    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonString);
    } catch {
      console.error('Error: Invalid JSON syntax');
      console.error('Received:', jsonString.slice(0, 100) + (jsonString.length > 100 ? '...' : ''));
      process.exit(1);
    }

    const result = SeedPayloadSchema.safeParse(parsed);

    if (!result.success) {
      console.error('Error: Invalid payload schema');
      console.error('Validation errors:');
      result.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      process.exit(1);
    }

    return result.data;
  }

  async function runSeedMode(jsonString: string): Promise<void> {
    const services = await ensureAuthenticated();

    const payload = parsePayload(jsonString);
    const queryClient = createQueryClient({ scripting: true });

    const totalOps = (payload.roles?.length ?? 0) + (payload.groups?.length ?? 0) + (payload.workspaces?.length ?? 0);

    console.log(`\n🚀 Starting seed with ${totalOps} operation(s)...`);
    console.log(`   API: ${getApiBaseUrl()}\n`);

    render(
      <AppWrapper queryClient={queryClient} services={services}>
        <HeadlessSeeder payload={payload} queryClient={queryClient} onComplete={() => {}} />
      </AppWrapper>,
      { exitOnCtrlC: true },
    );
  }

  async function runListMode(resource: 'roles' | 'groups' | 'workspaces', options: { limit?: string; json?: boolean }): Promise<void> {
    const services = await ensureAuthenticated();

    const queryClient = createQueryClient({ scripting: true });
    const limit = options.limit ? parseInt(options.limit, 10) : 20;

    // Import Text, Box, and useApp from ink for the list component
    const { Text, Box, useApp } = await import('ink');

    const ListComponent = (): React.ReactElement => {
      const { exit } = useApp();
      const rolesQuery = useRolesQuery({ limit });
      const groupsQuery = useGroupsQuery({ limit });
      const workspacesQuery = useWorkspacesQuery({ limit });

      const query = resource === 'roles' ? rolesQuery : resource === 'groups' ? groupsQuery : workspacesQuery;

      React.useEffect(() => {
        if (query.isSuccess) {
          const data = query.data;
          if (options.json) {
            process.stdout.write(JSON.stringify(data, null, 2) + '\n');
          } else {
            const items = data?.data ?? [];
            console.log(`\n${resource.toUpperCase()} (${items.length} of ${data?.meta?.count ?? items.length}):\n`);
            items.forEach((item: { uuid?: string; id?: string; name: string; display_name?: string; description?: string }) => {
              const id = item.uuid || item.id;
              console.log(`  ${item.display_name || item.name}`);
              console.log(`    ID: ${id}`);
              if (item.description) console.log(`    Description: ${item.description}`);
              console.log('');
            });
          }
          // Use Ink's exit and set exit code via process.exitCode
          process.exitCode = 0;
          exit();
        }
        if (query.isError) {
          console.error(`\n❌ Error fetching ${resource}:`, query.error?.message);
          process.exitCode = 1;
          exit();
        }
      }, [query.isSuccess, query.isError, query.data, query.error, exit]);

      if (query.isLoading) {
        return (
          <Box>
            <Text color="cyan">⏳ Loading {resource}...</Text>
          </Box>
        );
      }

      if (query.isError) {
        return (
          <Box>
            <Text color="red">❌ Error: {query.error?.message}</Text>
          </Box>
        );
      }

      return (
        <Box>
          <Text color="green">✓ Done</Text>
        </Box>
      );
    };

    render(
      <AppWrapper queryClient={queryClient} services={services}>
        <ListComponent />
      </AppWrapper>,
      { exitOnCtrlC: true },
    );
  }

  async function runLogin(): Promise<void> {
    console.log('\n🔄 Clearing existing authentication...');
    await clearToken();

    console.log('Starting fresh login...\n');
    await ensureAuthenticated();

    console.log('✅ Login successful!');
    console.log(`   Token: ${getMaskedToken()}`);
    console.log(`   API: ${getApiBaseUrl()}\n`);
    process.exit(0);
  }

  async function runLogout(): Promise<void> {
    await clearToken();
    console.log('\n✅ Logged out successfully.\n');
    process.exit(0);
  }

  async function showInfo(): Promise<void> {
    const tokenInfo = await getTokenInfo();

    // Get proxy info
    const proxy = process.env.RBAC_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    const envName = process.env.RBAC_ENV || 'stage';

    console.log('\n📋 RBAC CLI Configuration');
    console.log('━'.repeat(50));
    console.log(`Environment:    ${envName} (set RBAC_ENV to change)`);
    console.log(`API URL:        ${getApiBaseUrl()}`);
    console.log(`Proxy:          ${proxy || '(none - set RBAC_PROXY or HTTPS_PROXY)'}`);
    console.log(`Token cached:   ${tokenInfo.hasCachedToken ? 'Yes' : 'No'}`);

    if (tokenInfo.hasCachedToken) {
      console.log(`Token valid:    ${tokenInfo.isValid ? '✅ Yes' : '❌ No (expired)'}`);
      if (tokenInfo.expiresAt) {
        console.log(`Expires at:     ${tokenInfo.expiresAt.toLocaleString()}`);
      }
      if (tokenInfo.fetchedAt) {
        console.log(`Fetched at:     ${tokenInfo.fetchedAt.toLocaleString()}`);
      }
    }

    console.log('━'.repeat(50));
    console.log('\nEnvironment Variables:');
    console.log('  RBAC_ENV          Environment (stage/prod/local)');
    console.log('  RBAC_API_URL      Override API URL');
    console.log('  RBAC_PAC_URL      PAC file URL for proxy auto-config');
    console.log('  RBAC_PROXY        Direct HTTP proxy URL');
    console.log('  HTTPS_PROXY       System HTTPS proxy (fallback)');
    console.log('  RBAC_USERNAME     Username for headless login');
    console.log('  RBAC_PASSWORD     Password for headless login');
    console.log('  NODE_TLS_REJECT_UNAUTHORIZED=0  Skip SSL verification');
    console.log('  DEBUG_CLI         Enable verbose debugging');
    console.log('');
    console.log('Commands:');
    console.log('  npm run cli                              Interactive TUI');
    console.log('  npm run cli -- login                     Authenticate (opens browser)');
    console.log('  npm run cli -- login --headless          Automated CI/CD login');
    console.log('  npm run cli -- logout                    Clear cached token');
    console.log('  npm run cli -- roles                     List roles');
    console.log('  npm run cli -- groups                    List groups');
    console.log('  npm run cli -- workspaces                List workspaces');
    console.log('  npm run cli -- seed --file payload.json  Create resources (headless)');
    console.log('  npm run cli -- cleanup --prefix "test-"  Delete test resources');
    console.log('');
    console.log('Headless Login Examples:');
    console.log('  RBAC_USERNAME=user RBAC_PASSWORD=pass npm run cli -- login --headless --save-state auth.json');
    console.log('  RBAC_USERNAME=user RBAC_PASSWORD=pass npm run cli -- login --headless --stdout');
    console.log('');
    console.log('Seeder Examples:');
    console.log('  npm run cli -- seed --file payload.json --prefix "ci-123-"');
    console.log('  npm run cli -- seed --file payload.json --prefix "test-" --json');
    console.log('');
    console.log('Cleanup Examples:');
    console.log('  npm run cli -- cleanup --prefix "ci-123-"');
    console.log('  npm run cli -- cleanup --name-match "test-*-run"');
    console.log('');
  }

  // ============================================================================
  // CLI Definition
  // ============================================================================

  const program = new Command();

  program.name('rbac-cli').description('CLI for Red Hat RBAC - manage roles, groups, and access policies').version('1.0.0');

  // Login command (interactive mode - headless is handled above)
  program
    .command('login')
    .description('Authenticate via browser (opens Playwright). Use --headless for CI/CD.')
    .option('--headless', 'Automated login for CI/CD (requires RBAC_USERNAME and RBAC_PASSWORD)')
    .option('--save-state <path>', 'Save Playwright storage state to file')
    .option('--stdout', 'Print only the JWT token to stdout')
    .action(async (options) => {
      // If --headless, this should have been caught above
      // But handle it here as fallback
      if (options.headless) {
        const { runLoginHeadless } = await import('./commands/login-headless.js');
        const exitCode = await runLoginHeadless({
          saveState: options.saveState,
          stdout: options.stdout,
        });
        process.exit(exitCode);
      }
      await runLogin();
    });

  // Logout command
  program.command('logout').description('Clear cached authentication token').action(runLogout);

  // Seed command (interactive mode with --json flag - headless with --file is handled above)
  program
    .command('seed')
    .description('Seed RBAC data from JSON. Use --file for headless mode.')
    .option('--json <payload>', 'JSON string containing roles/groups/workspaces to create')
    .option('--file <path>', 'Read JSON payload from file (headless mode)')
    .option('--prefix <string>', 'Prefix to prepend to all resource names')
    .option('--dry-run', 'Preview what would be created without making changes')
    .action(async (options: { json?: string; file?: string; prefix?: string; dryRun?: boolean }) => {
      // If --file, this should have been caught above for headless mode
      // But handle it here as fallback
      if (options.file) {
        const { runSeeder } = await import('./commands/seeder.js');
        const exitCode = await runSeeder({
          file: options.file,
          prefix: options.prefix,
          dryRun: options.dryRun,
          json: true,
        });
        process.exit(exitCode);
      }

      // Interactive mode with --json
      if (options.json) {
        await runSeedMode(options.json);
      } else {
        console.error('Error: Either --json or --file must be provided');
        process.exit(1);
      }
    });

  // Cleanup command (headless only - handled above, but define for --help)
  program
    .command('cleanup')
    .description('Delete test resources by prefix or pattern (headless only)')
    .option('--prefix <string>', 'Filter by name prefix (min 4 chars)')
    .option('--name-match <glob>', 'Filter by glob pattern (min 4 chars)')
    .option('--dry-run', 'Preview what would be deleted without making changes')
    .action(async (options) => {
      // This should have been caught above
      const { runCleanup } = await import('./commands/cleanup.js');
      const exitCode = await runCleanup({
        prefix: options.prefix,
        nameMatch: options.nameMatch,
        dryRun: options.dryRun,
      });
      process.exit(exitCode);
    });

  // List commands
  program
    .command('roles')
    .description('List roles')
    .option('-l, --limit <number>', 'Maximum number of roles to fetch', '20')
    .option('--json', 'Output as JSON')
    .action(async (options) => await runListMode('roles', options));

  program
    .command('groups')
    .description('List groups')
    .option('-l, --limit <number>', 'Maximum number of groups to fetch', '20')
    .option('--json', 'Output as JSON')
    .action(async (options) => await runListMode('groups', options));

  program
    .command('workspaces')
    .description('List workspaces')
    .option('-l, --limit <number>', 'Maximum number of workspaces to fetch', '100')
    .option('--json', 'Output as JSON')
    .action(async (options) => await runListMode('workspaces', options));

  // Info command
  program.command('info').description('Show current configuration and auth status').action(showInfo);

  // Main execution
  // If no command was specified, run interactive mode
  if (process.argv.length === 2) {
    await runInteractiveMode();
  } else {
    // Parse and execute commands
    await program.parseAsync(process.argv);
  }
}
