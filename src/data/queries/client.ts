import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

/**
 * Determine if we should retry a failed request.
 * Don't retry on auth errors or not-found.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    // Don't retry auth errors or 404s
    if (status === 401 || status === 403 || status === 404) {
      return false;
    }
  }

  return true;
}

/**
 * Application-wide QueryClient instance.
 * Configured for stability - no aggressive refetching.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
});
