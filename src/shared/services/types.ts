/**
 * Service Types - Core interfaces for Dependency Injection
 *
 * These types define the contract for environment-specific services
 * that are injected via React Context. Data layer hooks consume these
 * services via useAppServices() and remain environment-agnostic.
 *
 * @see src/docs/DataLayerDI.mdx
 */

import type { AxiosInstance } from 'axios';

/**
 * Notification variant types supported across all environments.
 */
export type NotificationVariant = 'success' | 'danger' | 'warning' | 'info';

/**
 * Notification function signature.
 * Implementations vary by environment:
 * - Browser: Redux dispatch to notification system / Toast
 * - CLI: Chalk-colored console output
 */
export type NotifyFn = (variant: NotificationVariant, title: string, description?: string) => void;

/**
 * Environment identifier for data layer URL resolution.
 */
export type Environment = 'production' | 'stage' | 'qa';

/**
 * Minimal identity subset needed by data layer hooks.
 * Only includes fields required for external API calls (e.g., IT account API)
 * and user-scoped queries (e.g., current user's role bindings).
 */
export interface AppIdentity {
  org_id?: string;
  account_id?: string;
}

/**
 * Application services available via Dependency Injection.
 *
 * Data layer hooks (src/{v1,v2,shared}/data/queries/) must get ALL dependencies
 * from this interface via `useAppServices()`. Never import platform-specific
 * hooks or packages in data layer files.
 *
 * Each field is wired once per environment at the ServiceProvider level:
 * - Browser: Chrome SDK + Unleash
 * - CLI: cached token + env config
 * - Storybook: mock values + fn() spies
 *
 * Usage in hooks:
 * ```ts
 * const { axios, notify, getToken, environment } = useAppServices();
 * ```
 *
 * @see src/docs/DataLayerDI.mdx
 */
export interface AppServices {
  /**
   * Configured axios instance for API calls.
   * - Browser: Uses cookies/session auth, handles 401 redirects
   * - CLI: Uses Bearer token auth, proxy agent configuration
   */
  axios: AxiosInstance;

  /**
   * Notification function for user feedback.
   * - Browser: Triggers toast notifications via Redux
   * - CLI: Outputs colored messages to console
   */
  notify: NotifyFn;

  /**
   * Async function that returns a fresh auth token.
   * - Browser: `chrome.auth.getToken()`
   * - CLI: Cached token from login flow
   * - Storybook: Returns `'mock-token'`
   */
  getToken: () => Promise<string>;

  /**
   * Current deployment environment.
   * - Browser: Resolved from `chrome.getEnvironment()`
   * - CLI: From env config
   * - Storybook: Defaults to `'stage'`
   */
  environment: Environment;

  /**
   * SSO base URL for external service account API calls.
   * - Browser: From `chrome.getEnvironmentDetails().sso`
   * - CLI: From env config
   * - Storybook: Mock URL
   */
  ssoUrl: string;

  /**
   * Minimal identity for external API calls (org_id for IT account API).
   * `undefined` while identity is loading (browser async resolution).
   * - Browser: From `chrome.auth.getUser()`
   * - CLI: Decoded from JWT
   * - Storybook: `{ org_id: '12345' }`
   */
  identity: AppIdentity | undefined;

  /**
   * Whether the current deployment is an ITLess (disconnected) environment.
   * Controls fallback API paths in mutations.
   * - Browser: `useFlag('platform.rbac.itless')`
   * - CLI: `false` (or env config)
   * - Storybook: `false` (overridable per story)
   */
  isITLess: boolean;
}
