/**
 * CLI API Client
 *
 * Self-contained axios client for CLI usage with proper authentication headers.
 * Uses tokens obtained via Playwright browser login.
 *
 * Proxy Support (in order of priority):
 * - RBAC_PAC_URL: URL to PAC (Proxy Auto-Config) file
 * - RBAC_PROXY: Direct proxy URL (e.g., "http://proxy.example.com:8080")
 * - HTTPS_PROXY/HTTP_PROXY: System proxy env vars
 *
 * SSL:
 * - NODE_TLS_REJECT_UNAUTHORIZED=0: Disable SSL verification (for self-signed certs)
 */

import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { PacProxyAgent } from 'pac-proxy-agent';
import type { Agent } from 'https';
import chalk from 'chalk';
import { getApiBaseUrl } from './auth';
import type { AppServices, NotifyFn } from '../services/types';

// Global axios instance for CLI
let cliApiClient: AxiosInstance | null = null;
let currentToken: string | null = null;

/**
 * Get proxy agent for API calls
 * Supports PAC files and direct proxy URLs
 */
function getProxyAgent(): Agent | undefined {
  // Check for explicit PAC URL
  const pacUrl = process.env.RBAC_PAC_URL;
  if (pacUrl) {
    console.error(`[CLI] Using PAC proxy: ${pacUrl}`);
    return new PacProxyAgent(pacUrl);
  }

  // Check for explicit proxy URL
  const rbacProxy = process.env.RBAC_PROXY;
  if (rbacProxy) {
    console.error(`[CLI] Using proxy: ${rbacProxy}`);
    return new HttpsProxyAgent(rbacProxy);
  }

  // Check for system HTTPS proxy
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (httpsProxy) {
    console.error(`[CLI] Using system HTTPS proxy: ${httpsProxy}`);
    return new HttpsProxyAgent(httpsProxy);
  }

  // Check for HTTP proxy
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  if (httpProxy) {
    console.error(`[CLI] Using system HTTP proxy: ${httpProxy}`);
    return new HttpsProxyAgent(httpProxy);
  }

  return undefined;
}

/**
 * Initialize the CLI API client with authentication token
 */
export function initializeApiClient(token: string): AxiosInstance {
  const baseURL = getApiBaseUrl();
  currentToken = token;
  const httpsAgent = getProxyAgent();

  cliApiClient = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    httpsAgent,
    // Disable axios built-in proxy to use our agent
    proxy: false,
  });

  // Request interceptor for debugging
  cliApiClient.interceptors.request.use((config) => {
    if (process.env.DEBUG_CLI) {
      console.error(`[DEBUG] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.error(`[DEBUG] Headers:`, JSON.stringify(config.headers, null, 2));
    }
    return config;
  });

  // Error interceptor for better CLI error messages
  cliApiClient.interceptors.response.use(
    (response) => {
      if (process.env.DEBUG_CLI) {
        console.error(`[DEBUG] Response ${response.status}: ${JSON.stringify(response.data).slice(0, 200)}...`);
      }
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as Record<string, unknown> | undefined;
        const message = data?.detail || data?.message || data?.error || error.message;
        const responseHeaders = error.response.headers;

        if (process.env.DEBUG_CLI) {
          console.error('\n[DEBUG] ══════════════════════════════════════════════');
          console.error(`[DEBUG] Error Response Status: ${status}`);
          console.error(`[DEBUG] Error Response Headers:`, JSON.stringify(responseHeaders, null, 2));
          console.error(`[DEBUG] Error Response Body:`, JSON.stringify(data, null, 2));
          console.error('[DEBUG] ══════════════════════════════════════════════\n');
        }

        switch (status) {
          case 401:
            console.error('\n[CLI] ❌ Authentication failed.');
            console.error('      Your token may have expired. Run: npm run cli -- login');
            break;
          case 403:
            console.error('\n[CLI] ❌ Permission denied.');
            console.error(`      Message: ${message}`);
            console.error('      Your account may lack required permissions.');
            break;
          case 404:
            console.error('\n[CLI] ❌ Resource not found.');
            break;
          case 500:
            console.error('\n[CLI] ❌ Server error. The API may be temporarily unavailable.');
            break;
          default:
            console.error(`\n[CLI] ❌ API Error (${status}): ${message}`);
        }
      } else if (error.request) {
        console.error('\n[CLI] ❌ Network error. Check your connection and API URL.');
        console.error(`      API URL: ${getApiBaseUrl()}`);
        if (process.env.DEBUG_CLI) {
          console.error(`[DEBUG] Request error:`, error.message);
        }
      }
      return Promise.reject(error);
    },
  );

  return cliApiClient;
}

/**
 * Get the CLI API client
 * Throws if not initialized
 */
export function getApiClient(): AxiosInstance {
  if (!cliApiClient) {
    throw new Error('API client not initialized. Call initializeApiClient(token) first.');
  }
  return cliApiClient;
}

/**
 * Check if API client is initialized
 */
export function isApiClientInitialized(): boolean {
  return cliApiClient !== null;
}

/**
 * Get current token (masked for display)
 */
export function getMaskedToken(): string {
  if (!currentToken) return '(not set)';
  return currentToken.slice(0, 20) + '...' + currentToken.slice(-10);
}

// ============================================================================
// CLI Services Factory
// ============================================================================

/**
 * CLI notification function using chalk for colored console output.
 */
const cliNotify: NotifyFn = (variant, title, description) => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;

  // All output goes to stderr to avoid interfering with Ink's stdout rendering
  switch (variant) {
    case 'success':
      console.error(chalk.green(`${prefix} ✓ ${title}`));
      break;
    case 'danger':
      console.error(chalk.red(`${prefix} ✗ ${title}`));
      break;
    case 'warning':
      console.error(chalk.yellow(`${prefix} ⚠ ${title}`));
      break;
    case 'info':
    default:
      console.error(chalk.blue(`${prefix} ℹ ${title}`));
      break;
  }

  if (description) {
    console.error(chalk.gray(`    ${description}`));
  }
};

/**
 * Create CLI-specific services with the provided axios instance.
 *
 * @param axiosInstance - Axios instance from initializeApiClient()
 * @returns AppServices configured for CLI environment
 */
export function createCliServices(axiosInstance: AxiosInstance): AppServices {
  return {
    axios: axiosInstance,
    notify: cliNotify,
  };
}
