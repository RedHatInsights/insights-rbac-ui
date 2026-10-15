/**
 * Services Module
 *
 * Exports for IoC service injection pattern.
 * Re-exports from canonical locations for convenience.
 *
 * NOTE: CLI-specific exports are NOT included here to avoid pulling Node.js
 * modules (https-proxy-agent, net, tls) into the browser webpack build.
 * For CLI usage, import directly from '../entry/cli'.
 */

// Types - canonical source
export type { AppServices, NotifyFn, NotificationVariant } from './types';

// Context - canonical source is src/contexts/ServiceContext.tsx
export { ServiceProvider, useAppServices, useAxios, useNotify } from '../contexts/ServiceContext';

// Browser services factory (browser-safe, no Node.js modules)
export { createBrowserServices, createBrowserServicesWithAxios, browserApiClient } from '../entry/browser';
