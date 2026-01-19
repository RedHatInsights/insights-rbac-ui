import axios, { AxiosError } from 'axios';

/**
 * Handle 401 by reloading - user needs to re-authenticate.
 */
const interceptor401 = (error: AxiosError) => {
  if (error.response && error.response.status === 401) {
    window.location.reload();
  }
  throw error;
};

const authInterceptor = (config: any) => config;

/**
 * Axios instance for API calls.
 * Note: 403/500 errors are handled by React Query's QueryCache/MutationCache
 * in ApiErrorBoundary, not by axios interceptors.
 */
export const axiosInstance = axios.create();
axiosInstance.interceptors.request.use(authInterceptor);
axiosInstance.interceptors.response.use(null, interceptor401);
