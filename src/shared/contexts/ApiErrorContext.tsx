/**
 * API Error Context - Error State Management
 *
 * Provides centralized error handling for API errors (403, 500).
 * The handleError callback is passed to QueryClient's caches.
 *
 * Separated from QueryClient setup to allow:
 * - Clean separation of concerns
 * - Injectable QueryClient for testing
 * - Error state that persists across QueryClient recreation
 */

import React, { type ReactNode, createContext, useCallback, useContext, useState } from 'react';
import type { AxiosError } from 'axios';

export type ApiErrorCode = 403 | 500 | null;

interface ApiErrorContextValue {
  errorCode: ApiErrorCode;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

const ApiErrorContext = createContext<ApiErrorContextValue | null>(null);

/**
 * Hook to access API error state and handlers.
 * Must be used within ApiErrorProvider.
 */
export const useApiError = (): ApiErrorContextValue => {
  const context = useContext(ApiErrorContext);
  if (!context) {
    throw new Error('useApiError must be used within ApiErrorProvider');
  }
  return context;
};

/**
 * Provider for API error state management.
 * Provides handleError callback to be used by QueryClient.
 */
export const ApiErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errorCode, setErrorCode] = useState<ApiErrorCode>(null);

  const handleError = useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      if (status === 403) {
        setErrorCode(403);
      } else if (status && status >= 500) {
        setErrorCode(500);
      }
    }
  }, []);

  const clearError = useCallback(() => setErrorCode(null), []);

  return <ApiErrorContext.Provider value={{ errorCode, clearError, handleError }}>{children}</ApiErrorContext.Provider>;
};
