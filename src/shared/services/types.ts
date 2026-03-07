/**
 * Service Types - Core interfaces for Dependency Injection
 *
 * These types define the contract for environment-specific services
 * that are injected via React Context. Hooks consume these services
 * to remain environment-agnostic (browser vs CLI).
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
 * Application services available via Dependency Injection.
 *
 * These services abstract environment-specific implementations:
 * - axios: HTTP client with proper auth headers and proxy configuration
 * - notify: Notification system for user feedback
 *
 * Usage in hooks:
 * ```ts
 * const { axios, notify } = useAppServices();
 * ```
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
}
