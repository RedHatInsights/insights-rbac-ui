/**
 * CLI Auth Bridge - Playwright Browser Management
 *
 * Provides shared browser automation logic for both interactive and headless login modes.
 * Handles proxy configuration, analytics/overlay blocking, and token extraction.
 *
 * Proxy Support (in order of priority):
 * - HTTPS_PROXY: CI sidecar proxy (e.g., "http://proxy:8080")
 * - RBAC_PAC_URL: Local VPN PAC file URL
 */

import type { Browser, BrowserContext, LaunchOptions, Page } from 'playwright';

// ============================================================================
// Configuration
// ============================================================================

const LOGGED_IN_INDICATOR = 'Welcome to your Hybrid Cloud Console';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for manual login
const HEADLESS_TIMEOUT_MS = 60 * 1000; // 1 minute for automated login

// Login form selectors (Red Hat SSO)
export const LOGIN_SELECTORS = {
  usernameInput: '#username-verification',
  nextButton: '#login-show-step2',
  passwordInput: '#password',
  submitButton: '#rh-password-verification-submit-button',
} as const;

// ============================================================================
// Environment Configuration
// ============================================================================

type Environment = 'stage' | 'prod' | 'local';

interface EnvConfig {
  loginUrl: string;
  apiUrl: string;
  name: string;
}

const ENVIRONMENTS: Record<Environment, EnvConfig> = {
  stage: {
    loginUrl: 'https://console.stage.redhat.com',
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

export function getEnvConfig(): EnvConfig {
  if (process.env.RBAC_API_URL) {
    const apiUrl = process.env.RBAC_API_URL;
    const url = new URL(apiUrl);
    const hostUrl = `${url.protocol}//${url.host}`;
    return {
      loginUrl: hostUrl,
      apiUrl: hostUrl,
      name: 'Custom',
    };
  }
  return ENVIRONMENTS[getCurrentEnv()];
}

// ============================================================================
// Playwright Launch Options
// ============================================================================

/**
 * Build Playwright launch options with proxy support.
 *
 * Dual-mode networking:
 * - CI Sidecar: Uses HTTPS_PROXY environment variable
 * - Local VPN: Uses RBAC_PAC_URL for PAC file
 */
export function getLaunchOptions(headless: boolean): LaunchOptions {
  const options: LaunchOptions = {
    headless,
    args: [
      '--disable-blink-features=AutomationControlled', // Hide automation detection
    ],
  };

  if (!headless) {
    options.args!.push('--start-maximized');
  }

  // CI Sidecar mode - direct proxy
  if (process.env.HTTPS_PROXY) {
    options.proxy = { server: process.env.HTTPS_PROXY };
    if (!headless) {
      console.error(`[AuthBridge] Using CI proxy: ${process.env.HTTPS_PROXY}`);
    }
  }

  // Local VPN mode - PAC file
  if (process.env.RBAC_PAC_URL) {
    options.args!.push(`--proxy-pac-url=${process.env.RBAC_PAC_URL}`);
    if (!headless) {
      console.error(`[AuthBridge] Using PAC proxy: ${process.env.RBAC_PAC_URL}`);
    }
  }

  return options;
}

// ============================================================================
// Request Blocking (Analytics & Overlays)
// ============================================================================

/**
 * Patterns to block during browser automation.
 * These can cause flaky tests or slow down login flows.
 * Using partial string matches to catch all subdomains and paths.
 *
 * Exported for reuse in E2E test fixtures.
 */
export const BLOCKED_PATTERNS = [
  // TrustArc consent overlay (all domains, scripts, and CDN paths)
  'trustarc.com',
  'trustarc.stage',
  'teconsent',
  '/trustarc/', // Catches CDN-hosted scripts like static.redhat.com/libs/.../trustarc/
  // Amplitude analytics
  'amplitude.com',
  // Pendo analytics
  'pendo.io',
  // Segment analytics
  'segment.com',
  'segment.io',
];

/**
 * Block analytics and consent overlay requests to prevent flaky tests.
 * These third-party services can interfere with login form interactions.
 */
export async function blockAnalyticsAndOverlays(page: Page): Promise<void> {
  await page.route('**/*', async (route, request) => {
    const url = request.url();
    const resourceType = request.resourceType();

    // Block known analytics/overlay patterns (except document loads which might be required)
    const shouldBlock = BLOCKED_PATTERNS.some((pattern) => url.includes(pattern)) && resourceType !== 'document';

    if (shouldBlock) {
      await route.abort();
      return;
    }

    // Allow all other requests
    await route.continue();
  });
}

/**
 * @deprecated Use blockAnalyticsAndOverlays instead
 */
export const blockTrustArc = blockAnalyticsAndOverlays;

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Extract JWT token from the page using the Chrome insights API.
 */
export async function extractToken(page: Page): Promise<string> {
  // Wait for the app to fully initialize
  await page.waitForTimeout(2000);

  const token = await page.evaluate(async () => {
    const chrome = (
      window as unknown as {
        insights?: { chrome?: { auth?: { getToken?: () => Promise<string> } } };
      }
    ).insights?.chrome;

    if (!chrome?.auth?.getToken) {
      throw new Error('Chrome auth API not available');
    }

    return await chrome.auth.getToken();
  });

  if (!token || typeof token !== 'string') {
    throw new Error('Failed to extract token from browser');
  }

  return token;
}

// ============================================================================
// Browser Session Management
// ============================================================================

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Launch a Playwright browser session with proper configuration.
 */
export async function launchBrowser(headless: boolean): Promise<BrowserSession> {
  const { chromium } = await import('playwright');

  const launchOptions = getLaunchOptions(headless);
  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    viewport: headless ? { width: 1280, height: 720 } : null,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Block analytics and consent overlays that can interfere with automation
  await blockAnalyticsAndOverlays(page);

  return { browser, context, page };
}

/**
 * Close browser session safely.
 */
export async function closeBrowser(session: BrowserSession): Promise<void> {
  try {
    await session.browser.close();
  } catch {
    // Browser may already be closed
  }
}

// ============================================================================
// Interactive Login (User-Driven)
// ============================================================================

/**
 * Perform interactive login where user manually enters credentials.
 * Browser opens in headed mode and waits for login completion.
 */
export async function performInteractiveLogin(): Promise<string> {
  const envConfig = getEnvConfig();

  console.error('\n🔐 Authentication Required');
  console.error('━'.repeat(50));
  console.error(`Environment: ${envConfig.name}`);
  console.error(`Login URL: ${envConfig.loginUrl}`);
  console.error('A browser window will open for you to log in.');
  console.error('Please complete the login process manually.');
  console.error('━'.repeat(50) + '\n');

  const session = await launchBrowser(false);

  try {
    console.error('📡 Navigating to Red Hat Console...');
    await session.page.goto(envConfig.loginUrl, { waitUntil: 'domcontentloaded' });

    console.error('⏳ Waiting for you to complete login...');
    console.error('   (The browser will close automatically once logged in)\n');

    // Wait for successful login indicator
    await session.page.waitForFunction((indicator) => document.body?.innerText?.includes(indicator), LOGGED_IN_INDICATOR, {
      timeout: LOGIN_TIMEOUT_MS,
    });

    console.error('✓ Login detected! Extracting authentication token...');

    const token = await extractToken(session.page);
    console.error('✓ Token extracted successfully!\n');

    return token;
  } finally {
    await closeBrowser(session);
  }
}

// ============================================================================
// Headless Login (Automated)
// ============================================================================

export interface HeadlessLoginOptions {
  username: string;
  password: string;
  saveStatePath?: string;
  stdout?: boolean;
}

export interface HeadlessLoginResult {
  token: string;
  storageStatePath?: string;
}

/**
 * Perform automated headless login for CI/CD environments.
 * Uses environment credentials and exports Playwright storage state.
 */
export async function performHeadlessLogin(options: HeadlessLoginOptions): Promise<HeadlessLoginResult> {
  const envConfig = getEnvConfig();

  if (!options.stdout) {
    console.error(`[AuthBridge] Headless login to ${envConfig.name}`);
    console.error(`[AuthBridge] Target: ${envConfig.loginUrl}`);
  }

  const session = await launchBrowser(true);

  try {
    // Navigate to login page
    await session.page.goto(envConfig.loginUrl, { waitUntil: 'domcontentloaded' });

    // Step 1: Enter username
    if (!options.stdout) {
      console.error('[AuthBridge] Entering username...');
    }
    await session.page.waitForSelector(LOGIN_SELECTORS.usernameInput, { timeout: HEADLESS_TIMEOUT_MS });
    await session.page.fill(LOGIN_SELECTORS.usernameInput, options.username);

    // Step 2: Click Next
    await session.page.click(LOGIN_SELECTORS.nextButton);

    // Step 3: Enter password
    if (!options.stdout) {
      console.error('[AuthBridge] Entering password...');
    }
    await session.page.waitForSelector(LOGIN_SELECTORS.passwordInput, { timeout: HEADLESS_TIMEOUT_MS });
    await session.page.fill(LOGIN_SELECTORS.passwordInput, options.password);

    // Step 4: Submit
    await session.page.click(LOGIN_SELECTORS.submitButton);

    // Step 5: Wait for dashboard
    if (!options.stdout) {
      console.error('[AuthBridge] Waiting for dashboard...');
    }
    await session.page.waitForFunction((indicator) => document.body?.innerText?.includes(indicator), LOGGED_IN_INDICATOR, {
      timeout: HEADLESS_TIMEOUT_MS,
    });

    if (!options.stdout) {
      console.error('[AuthBridge] Login successful!');
    }

    // Extract token
    const token = await extractToken(session.page);

    // Export storage state if requested
    let storageStatePath: string | undefined;
    if (options.saveStatePath) {
      await session.context.storageState({ path: options.saveStatePath });
      storageStatePath = options.saveStatePath;
      if (!options.stdout) {
        console.error(`[AuthBridge] Storage state saved to: ${storageStatePath}`);
      }
    }

    return { token, storageStatePath };
  } finally {
    await closeBrowser(session);
  }
}
