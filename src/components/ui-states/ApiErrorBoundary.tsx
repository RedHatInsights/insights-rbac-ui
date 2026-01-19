import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppLink } from '../navigation/AppLink';
import type { AxiosError } from 'axios';

import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

// ============================================================================
// Error Context
// ============================================================================

type ApiErrorCode = 403 | 500 | null;

interface ApiErrorContextValue {
  errorCode: ApiErrorCode;
  clearError: () => void;
}

const ApiErrorContext = createContext<ApiErrorContextValue>({ errorCode: null, clearError: () => {} });

export const useApiError = () => useContext(ApiErrorContext);

// ============================================================================
// Error States UI
// ============================================================================

const errorStates: Record<number, React.FC<{ serviceName: string }>> = {
  403: ({ serviceName }) => (
    <UnauthorizedAccess
      data-codemods
      serviceName={serviceName}
      bodyText={
        <FormattedMessage
          {...messages.contactOrgAdmin}
          values={{
            link: (
              <AppLink to={pathnames['my-user-access'].link} linkBasename="/iam">
                My User Access
              </AppLink>
            ),
          }}
        />
      }
    />
  ),
};

// ============================================================================
// Query Client Factory
// ============================================================================

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

/**
 * Creates a QueryClient that reports 403/500 errors to the provided callback.
 */
export function createQueryClient(onApiError: (code: ApiErrorCode) => void): QueryClient {
  const handleError = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      if (status === 403) {
        onApiError(403);
      } else if (status && status >= 500) {
        onApiError(500);
      }
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleError,
    }),
    mutationCache: new MutationCache({
      onError: handleError,
    }),
    defaultOptions: {
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
    },
  });
}

// ============================================================================
// Provider Component
// ============================================================================

interface ApiErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Provides React Query client with built-in API error handling.
 * Catches 403/500 errors from queries and mutations, displaying appropriate error UI.
 *
 * Usage:
 * ```tsx
 * <ApiErrorBoundary>
 *   <App />
 * </ApiErrorBoundary>
 * ```
 */
export const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({ children }) => {
  const [errorCode, setErrorCode] = useState<ApiErrorCode>(null);
  const location = useLocation();
  const intl = useIntl();

  // Create query client with error callback
  const [queryClient] = useState(() => createQueryClient(setErrorCode));

  // Clear error on navigation
  useEffect(() => {
    if (errorCode) {
      setErrorCode(null);
    }
  }, [location?.pathname]);

  const clearError = useCallback(() => setErrorCode(null), []);

  const sectionTitles: Record<string, string> = {
    '/users': intl.formatMessage(messages.rbacUsers),
    '/groups': intl.formatMessage(messages.rbacGroups),
  };

  // Render error state if we have one
  if (errorCode) {
    const State = errorStates[errorCode];
    const name = sectionTitles[Object.keys(sectionTitles).find((key) => location?.pathname.includes(key)) || ''] || 'RBAC';

    if (State) {
      return (
        <ApiErrorContext.Provider value={{ errorCode, clearError }}>
          <QueryClientProvider client={queryClient}>
            <State serviceName={name} />
          </QueryClientProvider>
        </ApiErrorContext.Provider>
      );
    }
  }

  return (
    <ApiErrorContext.Provider value={{ errorCode, clearError }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiErrorContext.Provider>
  );
};

export default ApiErrorBoundary;
