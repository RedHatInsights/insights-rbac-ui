/**
 * API Client Exports
 *
 * This module provides:
 * - apiClient: Browser-specific axios instance with 401 handling (re-exported from browser entry)
 * - API base path constants
 *
 * Note: The apiClient uses browser globals (window.location.reload on 401).
 * For environment-agnostic code, use the create*Api() factories with injected axios
 * from useAppServices() instead of the default singleton API instances.
 */

// Re-export browser axios client for backward compatibility with existing code
// The 401 handler lives in src/entry/browser.tsx where all browser-specific code belongs
export { browserApiClient as apiClient } from '../../entry/browser';

// Export base paths
export { RBAC_API_BASE, RBAC_API_BASE_2, COST_API_BASE, INVENTORY_API_BASE } from '../../utilities/constants';
