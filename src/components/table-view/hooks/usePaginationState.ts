/**
 * usePaginationState Hook
 *
 * Manages pagination state with optional URL synchronization.
 */

import { useCallback, useState } from 'react';
import { getPageFromUrl, getPerPageFromUrl, updatePageInUrl, updatePerPageInUrl } from './tableUrlState';

type SetSearchParams = (fn: (prev: URLSearchParams) => URLSearchParams) => void;

export interface UsePaginationStateOptions {
  /** Initial items per page */
  initialPerPage: number;
  /** Available per-page options */
  perPageOptions: number[];
  /** Whether to sync with URL */
  shouldSyncUrl: boolean;
  /** Current search params (for initial state) */
  searchParams: URLSearchParams;
  /** Function to update search params */
  setSearchParams: SetSearchParams;
}

export interface UsePaginationStateReturn {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  perPage: number;
  /** Available per-page options */
  perPageOptions: number[];
  /** Change current page */
  onPageChange: (page: number) => void;
  /** Change items per page (resets to page 1) */
  onPerPageChange: (perPage: number) => void;
  /** Reset page to 1 (used when filters change) */
  resetPage: () => void;
}

/**
 * Hook for managing pagination state with optional URL sync.
 */
export function usePaginationState({
  initialPerPage,
  perPageOptions,
  shouldSyncUrl,
  searchParams,
  setSearchParams,
}: UsePaginationStateOptions): UsePaginationStateReturn {
  const [page, setPageState] = useState(() => (shouldSyncUrl ? getPageFromUrl(searchParams, 1) : 1));

  const [perPage, setPerPageState] = useState(() => (shouldSyncUrl ? getPerPageFromUrl(searchParams, initialPerPage) : initialPerPage));

  const onPageChange = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      if (shouldSyncUrl) {
        setSearchParams((prev) => updatePageInUrl(prev, newPage));
      }
    },
    [shouldSyncUrl, setSearchParams],
  );

  const onPerPageChange = useCallback(
    (newPerPage: number) => {
      setPerPageState(newPerPage);
      setPageState(1);
      if (shouldSyncUrl) {
        setSearchParams((prev) => updatePerPageInUrl(prev, newPerPage));
      }
    },
    [shouldSyncUrl, setSearchParams],
  );

  const resetPage = useCallback(() => {
    setPageState(1);
  }, []);

  return {
    page,
    perPage,
    perPageOptions,
    onPageChange,
    onPerPageChange,
    resetPage,
  };
}
