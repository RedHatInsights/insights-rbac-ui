/**
 * CLI Authentication Module
 *
 * Handles token acquisition by:
 * 1. Checking for cached token in ~/.rbac-cli-token
 * 2. If missing/expired, launching Playwright for manual login
 * 3. Extracting token from browser session
 * 4. Caching token for future use
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Configuration
// ============================================================================

const TOKEN_CACHE_DIR = path.join(os.homedir(), '.rbac-cli');

function getTokenCacheFile(): string {
  const env = getCurrentEnv();
  const username = process.env.RBAC_USERNAME ?? 'default';
  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(TOKEN_CACHE_DIR, `token-${env}-${safeUsername}.json`);
}
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Consider token expired 5 mins before actual expiry
const LOGGED_IN_INDICATOR = 'Welcome to your Hybrid Cloud Console'; // Text indicating successful login

/**
 * Environment configuration
 * Set RBAC_ENV to switch environments:
 * - 'stage' (default) - staging environment
 * - 'prod' - production environment
 * - 'local' - local development server
 */
type Environment = 'stage' | 'prod' | 'local';

interface EnvConfig {
  loginUrl: string;
  apiUrl: string;
  name: string;
}

const ENVIRONMENTS: Record<Environment, EnvConfig> = {
  stage: {
    loginUrl: 'https://console.stage.redhat.com',
    // Note: Just the host, not the full API path. The API path is added by APIFactory.
    apiUrl: 'https://console.stage.redhat.com',
    name: 'Staging',
  },
  prod: {
    loginUrl: 'https://console.redhat.com',
    apiUrl: 'https://console.redhat.com',
    name: 'Production',
  },
  local: {
    loginUrl: 'https://stage.foo.redhat.com:1337',
    apiUrl: 'https://stage.foo.redhat.com:1337',
    name: 'Local Dev',
  },
};

export function getCurrentEnv(): Environment {
  const env = process.env.RBAC_ENV as Environment | undefined;
  if (env && env in ENVIRONMENTS) {
    return env;
  }
  return 'stage';
}

function getEnvConfig(): EnvConfig {
  // Allow full override via RBAC_API_URL
  if (process.env.RBAC_API_URL) {
    const apiUrl = process.env.RBAC_API_URL;
    // Derive login URL and base URL from API URL
    const url = new URL(apiUrl);
    const hostUrl = `${url.protocol}//${url.host}`;
    return {
      loginUrl: hostUrl,
      // Just the host - API path is added by APIFactory
      apiUrl: hostUrl,
      name: 'Custom',
    };
  }
  return ENVIRONMENTS[getCurrentEnv()];
}

/**
 * Cached token structure
 */
interface CachedToken {
  token: string;
  expiresAt: number; // Unix timestamp in ms
  fetchedAt: number;
}

// ============================================================================
// Token Cache Management
// ============================================================================

/**
 * Read cached token from file
 */
async function readCachedToken(): Promise<CachedToken | null> {
  try {
    const content = await fs.readFile(getTokenCacheFile(), 'utf-8');
    const cached = JSON.parse(content) as CachedToken;
    return cached;
  } catch {
    return null;
  }
}

/**
 * Write token to cache file
 */
async function writeCachedToken(cached: CachedToken): Promise<void> {
  const cacheFile = getTokenCacheFile();
  await fs.mkdir(TOKEN_CACHE_DIR, { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
  // Set restrictive permissions (owner read/write only)
  await fs.chmod(cacheFile, 0o600);
}

/**
 * Check if a cached token is still valid
 */
function isTokenValid(cached: CachedToken): boolean {
  const now = Date.now();
  // Token is valid if it hasn't expired (with buffer)
  return cached.expiresAt - TOKEN_EXPIRY_BUFFER_MS > now;
}

/**
 * Parse JWT to extract expiration time
 */
function parseJwtExpiry(token: string): number {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as { exp?: number };

    if (parsed.exp) {
      // exp is in seconds, convert to ms
      return parsed.exp * 1000;
    }

    // Default to 1 hour from now if no exp claim
    return Date.now() + 60 * 60 * 1000;
  } catch {
    // Default to 1 hour from now if parsing fails
    return Date.now() + 60 * 60 * 1000;
  }
}

// ============================================================================
// Playwright Login Flow
// ============================================================================

/**
 * Launch browser and wait for manual login to extract token.
 * Uses shared browser launch from auth-bridge for consistent blocking of analytics/overlays.
 */
async function performBrowserLogin(): Promise<string> {
  // Use shared browser launch with analytics/overlay blocking
  const { launchBrowser, closeBrowser, extractToken } = await import('./auth-bridge.js');

  const envConfig = getEnvConfig();

  console.error('\n🔐 Authentication Required');
  console.error('━'.repeat(50));
  console.error(`Environment: ${envConfig.name}`);
  console.error(`Login URL: ${envConfig.loginUrl}`);
  console.error('A browser window will open for you to log in.');
  console.error('Please complete the login process manually.');
  console.error('━'.repeat(50) + '\n');

  const session = await launchBrowser(false); // false = headed mode for manual login

  try {
    console.error('📡 Navigating to Red Hat Console...');
    await session.page.goto(envConfig.loginUrl, { waitUntil: 'domcontentloaded' });

    console.error('⏳ Waiting for you to complete login...');
    console.error('   (The browser will close automatically once logged in)\n');

    // Wait for the user to complete login - detect by welcome message
    // This is more reliable than URL pattern as the user might land on different pages
    await session.page.waitForFunction(
      (indicator) => document.body?.innerText?.includes(indicator),
      LOGGED_IN_INDICATOR,
      { timeout: 5 * 60 * 1000 }, // 5 minute timeout for manual login
    );

    console.error('✓ Login detected! Extracting authentication token...');

    const token = await extractToken(session.page);

    console.error('✓ Token extracted successfully!\n');
    return token;
  } finally {
    await closeBrowser(session);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if credentials are available for automatic (headless) login.
 */
function hasCredentials(): { username: string; password: string } | null {
  const username = process.env.RBAC_USERNAME;
  const password = process.env.RBAC_PASSWORD;

  if (username && password) {
    return { username, password };
  }
  return null;
}

/**
 * Get authentication token
 *
 * Checks cache first, then falls back to login if needed.
 * If RBAC_USERNAME and RBAC_PASSWORD are set, uses automatic headless login.
 * Otherwise, opens a browser for manual login.
 *
 * @param options.skipCache - If true, always authenticate fresh (never use cached token)
 * Returns a valid Bearer token string.
 */
export async function getToken(options?: { skipCache?: boolean }): Promise<string> {
  // Check for cached token (unless skipping cache)
  if (!options?.skipCache) {
    const cached = await readCachedToken();

    if (cached && isTokenValid(cached)) {
      console.error('🔑 Using cached authentication token');
      return cached.token;
    }

    if (cached) {
      console.error('⚠️  Cached token has expired, re-authenticating...');
    }
  }

  // Check for credentials - use headless login if available
  const credentials = hasCredentials();
  let token: string;

  if (credentials) {
    console.error('🤖 RBAC_USERNAME and RBAC_PASSWORD detected - using automatic headless login');
    const { performHeadlessLogin } = await import('./auth-bridge.js');
    const result = await performHeadlessLogin({
      username: credentials.username,
      password: credentials.password,
      stdout: false,
    });
    token = result.token;
  } else {
    // Perform manual browser login
    token = await performBrowserLogin();
  }

  // Cache the new token
  const expiresAt = parseJwtExpiry(token);
  await writeCachedToken({
    token,
    expiresAt,
    fetchedAt: Date.now(),
  });

  return token;
}

/**
 * Clear cached token (useful for logout or forced re-auth)
 */
export async function clearToken(): Promise<void> {
  try {
    await fs.unlink(getTokenCacheFile());
    console.error('✓ Cached token cleared');
  } catch {
    // File might not exist, that's fine
  }
}

/**
 * Check if we have a valid cached token without triggering login
 */
export async function hasValidToken(): Promise<boolean> {
  const cached = await readCachedToken();
  return cached !== null && isTokenValid(cached);
}

/**
 * Get token info for display (without exposing the full token)
 */
export async function getTokenInfo(): Promise<{
  hasCachedToken: boolean;
  isValid: boolean;
  expiresAt?: Date;
  fetchedAt?: Date;
}> {
  const cached = await readCachedToken();

  if (!cached) {
    return { hasCachedToken: false, isValid: false };
  }

  return {
    hasCachedToken: true,
    isValid: isTokenValid(cached),
    expiresAt: new Date(cached.expiresAt),
    fetchedAt: new Date(cached.fetchedAt),
  };
}

/**
 * Get the API base URL
 */
export function getApiBaseUrl(): string {
  return getEnvConfig().apiUrl;
}

/**
 * Get the current environment name
 */
export function getEnvironmentName(): string {
  return getEnvConfig().name;
}
