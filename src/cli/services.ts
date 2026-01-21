/**
 * CLI Services - Re-exports what CLI needs without browser dependencies
 *
 * @deprecated Import directly from the specific modules instead:
 * - Context: import { ServiceProvider, useAppServices } from '../contexts/ServiceContext'
 * - CLI Services: import { createCliServices } from './api-client'
 */

// Re-export from canonical locations
export { ServiceProvider, useAppServices, useAxios, useNotify } from '../contexts/ServiceContext.js';
export { createCliServices } from './api-client.js';
export type { AppServices, NotifyFn } from '../services/types.js';
