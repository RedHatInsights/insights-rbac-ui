/**
 * CLI Entry Point - Re-exports
 *
 * This file exists for backward compatibility.
 * The canonical CLI implementation is in src/cli/.
 *
 * @deprecated Import directly from the cli module instead:
 * - Services: import { createCliServices } from './cli/api-client'
 * - Auth: import { getToken, getApiBaseUrl } from './cli/auth'
 * - Components: import { InteractiveDashboard } from './cli/components'
 */

// Re-export from canonical locations for backward compatibility
export { ServiceProvider } from '../contexts/ServiceContext';
export type { AppServices, NotifyFn } from '../services/types';
export { createCliServices, getApiClient, initializeApiClient, getMaskedToken } from '../cli/api-client';
export { getApiBaseUrl, getToken, clearToken, hasValidToken, getTokenInfo } from '../cli/auth';
