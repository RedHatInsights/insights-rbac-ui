/**
 * Headless Login Command Handler
 *
 * Automated Playwright login for CI/CD pipelines.
 * Exports Playwright-compatible storage state for use with other tools.
 *
 * Environment Variables (Required):
 *   RBAC_USERNAME - Red Hat SSO username
 *   RBAC_PASSWORD - Red Hat SSO password
 *
 * Environment Variables (Optional):
 *   HTTPS_PROXY   - CI sidecar proxy URL
 *   RBAC_PAC_URL  - Local VPN PAC file URL
 *
 * Usage:
 *   rbac-cli login --headless --save-state auth.json
 *   rbac-cli login --headless --stdout
 */

import { performHeadlessLogin } from '../auth-bridge.js';

export interface LoginHeadlessOptions {
  saveState?: string;
  stdout?: boolean;
}

/**
 * Validate required environment variables for headless login.
 */
function validateEnvironment(): { username: string; password: string } {
  const username = process.env.RBAC_USERNAME;
  const password = process.env.RBAC_PASSWORD;

  if (!username) {
    throw new Error('RBAC_USERNAME environment variable is required for headless login');
  }

  if (!password) {
    throw new Error('RBAC_PASSWORD environment variable is required for headless login');
  }

  return { username, password };
}

/**
 * Execute headless login command.
 *
 * @param options - Command options
 * @returns Exit code (0 for success, 1 for failure)
 */
export async function runLoginHeadless(options: LoginHeadlessOptions): Promise<number> {
  try {
    // Validate environment
    const { username, password } = validateEnvironment();

    // Perform headless login
    const result = await performHeadlessLogin({
      username,
      password,
      saveStatePath: options.saveState,
      stdout: options.stdout ?? false,
    });

    // Output based on flags
    if (options.stdout) {
      // Print only the token to stdout (for piping)
      process.stdout.write(result.token);
    } else {
      // Normal output to stderr
      console.error('✅ Headless login successful!');
      if (result.storageStatePath) {
        console.error(`📁 Storage state saved to: ${result.storageStatePath}`);
      }
      console.error(`🔑 Token: ${result.token.slice(0, 20)}...${result.token.slice(-10)}`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Headless login failed: ${message}`);

    if (process.env.DEBUG_CLI) {
      console.error(error);
    }

    return 1;
  }
}

export default runLoginHeadless;
