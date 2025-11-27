/**
 * useFiltersState Hook
 *
 * Manages filter state with optional URL synchronization.
 */

import { useCallback, useMemo, useState } from 'react';
import type { FilterState } from '../types';
import { clearFiltersInUrl, getFiltersFromUrl, updateFiltersInUrl } from './tableUrlState';

type SetSearchParams = (fn: (prev: URLSearchParams) => URLSearchParams) => void;

export interface UseFiltersStateOptions {
  /** Initial filter values */
  initialFilters: FilterState;
  /** Whether to sync with URL */
  shouldSyncUrl: boolean;
  /** Current search params (for initial state) */
  searchParams: URLSearchParams;
  /** Function to update search params */
  setSearchParams: SetSearchParams;
  /** Callback to reset page when filters change */
  onFiltersChanged?: () => void;
}

export interface UseFiltersStateReturn {
  /** Current filter values */
  filters: FilterState;
  /** Update filters */
  onFiltersChange: (filters: FilterState) => void;
  /** Clear all filters */
  clearAllFilters: () => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
}

/**
 * Hook for managing filter state with optional URL sync.
 */
export function useFiltersState({
  initialFilters,
  shouldSyncUrl,
  searchParams,
  setSearchParams,
  onFiltersChanged,
}: UseFiltersStateOptions): UseFiltersStateReturn {
  const [filters, setFiltersState] = useState<FilterState>(() => (shouldSyncUrl ? getFiltersFromUrl(searchParams, initialFilters) : initialFilters));

  const onFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFiltersState((prevFilters) => {
        if (shouldSyncUrl) {
          setSearchParams((prev) => updateFiltersInUrl(prev, newFilters, prevFilters));
        }
        return newFilters;
      });
      onFiltersChanged?.();
    },
    [shouldSyncUrl, setSearchParams, onFiltersChanged],
  );

  const clearAllFilters = useCallback(() => {
    setFiltersState((prevFilters) => {
      if (shouldSyncUrl) {
        setSearchParams((prev) => clearFiltersInUrl(prev, prevFilters));
      }
      return {};
    });
    onFiltersChanged?.();
  }, [shouldSyncUrl, setSearchParams, onFiltersChanged]);

  const hasActiveFilters = useMemo(() => Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== '')), [filters]);

  return {
    filters,
    onFiltersChange,
    clearAllFilters,
    hasActiveFilters,
  };
}
