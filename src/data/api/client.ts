import axios, { type AxiosError } from 'axios';

/**
 * Handle 401 Unauthorized by reloading the page to force re-authentication.
 * This is critical for session expiration handling.
 */
const handle401Error = (error: AxiosError) => {
  if (error.response?.status === 401) {
    window.location.reload();
  }
  return Promise.reject(error);
};

/**
 * Axios instance for API calls.
 * Includes 401 interceptor for automatic session expiration handling.
 * Other errors (403, 500) are handled by React Query's QueryCache/MutationCache
 * in ApiErrorBoundary.
 */
export const apiClient = axios.create();
apiClient.interceptors.response.use(undefined, handle401Error);

// Export base paths
export { RBAC_API_BASE, RBAC_API_BASE_2, COST_API_BASE, INVENTORY_API_BASE } from '../../utilities/constants';
