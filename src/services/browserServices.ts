/**
 * Browser-specific service implementations - Re-exports from canonical location
 *
 * @deprecated Import from '../entry/browser' or '../services/index' instead.
 *
 * This file exists for backward compatibility. The canonical implementation
 * is now in src/entry/browser.tsx.
 */

export {
  createBrowserServices,
  createBrowserServicesWithAxios,
  createBrowserAxiosInstance,
  browserApiClient,
  BrowserAppWrapper,
} from '../entry/browser';
