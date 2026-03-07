/**
 * QueryClient Setup Component
 *
 * Creates and provides QueryClient with error handling connected to ApiErrorContext.
 * All error handling flows through handleError → ApiErrorContext → ApiErrorBoundary.
 */

import React, { type ReactNode, useState } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useApiError } from '../contexts/ApiErrorContext';

// ============================================================================
// Shared Configuration
// ============================================================================

/** Test-friendly query options: no caching, no retries */
const TEST_QUERY_OPTIONS = {
  queries: {
    retry: false,
    staleTime: 0,
    gcTime: 0,
  },
  mutations: {
    retry: false,
  },
} as const;

/**
 * Determine if we should retry a failed request.
 * Don't retry on auth errors or not-found.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    if (status === 401 || status === 403 || status === 404) {
      return false;
    }
  }

  return true;
}

/** Production query options: caching enabled, smart retry */
const PRODUCTION_QUERY_OPTIONS = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: shouldRetry,
  },
  mutations: {
    retry: false,
  },
} as const;

// ============================================================================
// QueryClient Factories
// ============================================================================

/**
 * Creates a QueryClient with production settings and error handling.
 */
function createQueryClient(onError: (error: unknown) => void): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: PRODUCTION_QUERY_OPTIONS,
  });
}

/**
 * Creates a QueryClient with test settings and error handling.
 */
function createTestQueryClient(onError: (error: unknown) => void): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: TEST_QUERY_OPTIONS,
  });
}

// ============================================================================
// QueryClientSetup Component
// ============================================================================

interface QueryClientSetupProps {
  children: ReactNode;
  /** Use test-friendly settings (no cache, no retry) while keeping error handling */
  testMode?: boolean;
}

/**
 * Provides QueryClientProvider with error handling connected to ApiErrorContext.
 *
 * Error handling is always wired up - API errors (403/500) will flow through
 * handleError → ApiErrorContext → ApiErrorBoundary.
 *
 * @param testMode - Use test settings (no cache, no retry). Default: false (production settings).
 *
 * Note: QueryClient is created once on mount. The testMode prop is read only during
 * initial render - changing it afterward has no effect.
 */
export const QueryClientSetup: React.FC<QueryClientSetupProps> = ({ children, testMode = false }) => {
  const { handleError } = useApiError();
  const [queryClient] = useState(() => (testMode ? createTestQueryClient(handleError) : createQueryClient(handleError)));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

// ============================================================================
// Standalone QueryClient (for module federation)
// ============================================================================

/**
 * Creates a standalone QueryClient with production settings.
 * Use this for module federation components that need their own QueryClient
 * outside the main provider tree.
 *
 * Note: This client is NOT connected to ApiErrorContext. Global error UI
 * (403/500 pages) won't trigger. Use the onError callback for local handling.
 *
 * @param onError Optional error handler (defaults to no-op)
 */
export function createStandaloneQueryClient(onError: (error: unknown) => void = () => {}): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: PRODUCTION_QUERY_OPTIONS,
  });
}
