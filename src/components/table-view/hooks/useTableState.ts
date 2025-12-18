/**
 * useTableState Hook
 *
 * Combined state management hook for TableView with optional URL synchronization.
 * Orchestrates smaller focused hooks for pagination, sorting, selection, expansion, and filters.
 */

import { useMemo } from 'react';
import type { UseTableStateOptions, UseTableStateReturn } from '../types';
import { useOptionalSearchParams } from './useOptionalSearchParams';
import { usePaginationState } from './usePaginationState';
import { useSortState } from './useSortState';
import { useFiltersState } from './useFiltersState';
import { useExpansionState } from './useExpansionState';
import { useRowSelection } from './useRowSelection';
import { useStaleDataEffect } from './useStaleDataEffect';

/**
 * useTableState - Combined state management for TableView
 *
 * This is the main hook consumers should use. It orchestrates smaller hooks
 * for each concern (pagination, sorting, filters, selection, expansion) and
 * provides a unified API.
 *
 * @template TColumns - Const tuple of column IDs
 * @template TRow - Row data type
 * @template TSortable - Union of sortable column IDs
 * @template TCompound - Union of compound expandable column IDs
 */
export function useTableState<
  TColumns extends readonly string[],
  TRow,
  TSortable extends TColumns[number] = never,
  TCompound extends TColumns[number] = never,
>(options: UseTableStateOptions<TColumns, TRow, TSortable, TCompound>): UseTableStateReturn<TColumns, TRow, TSortable, TCompound> {
  const {
    sortableColumns = [] as readonly TSortable[],
    initialSort,
    initialPerPage = 20,
    perPageOptions = [10, 20, 50, 100],
    initialFilters = {},
    getRowId,
    isRowSelectable = () => true,
    syncWithUrl = false,
    onStaleData,
    staleDataDebounceMs = 300,
  } = options;

  // URL search params - safe to use outside Router context
  const { searchParams, setSearchParams, isRouterAvailable } = useOptionalSearchParams();

  // Only sync with URL if explicitly requested AND router is available
  const shouldSyncUrl = syncWithUrl && isRouterAvailable;

  // -------------------------------------------------------------------------
  // Pagination State
  // -------------------------------------------------------------------------
  const {
    page,
    perPage,
    perPageOptions: returnedPerPageOptions,
    onPageChange,
    onPerPageChange,
    resetPage,
  } = usePaginationState({
    initialPerPage,
    perPageOptions,
    shouldSyncUrl,
    searchParams,
    setSearchParams,
  });

  // -------------------------------------------------------------------------
  // Sort State
  // -------------------------------------------------------------------------
  const { sort, onSortChange } = useSortState({
    sortableColumns,
    initialSort,
    shouldSyncUrl,
    searchParams,
    setSearchParams,
  });

  // -------------------------------------------------------------------------
  // Filters State
  // -------------------------------------------------------------------------
  const { filters, onFiltersChange, clearAllFilters, hasActiveFilters } = useFiltersState({
    initialFilters,
    shouldSyncUrl,
    searchParams,
    setSearchParams,
    onFiltersChanged: resetPage,
  });

  // -------------------------------------------------------------------------
  // Selection State
  // -------------------------------------------------------------------------
  const { selectedRows, onSelectRow, onSelectAll, clearSelection, isRowSelected } = useRowSelection({
    getRowId,
    isRowSelectable,
  });

  // -------------------------------------------------------------------------
  // Expansion State
  // -------------------------------------------------------------------------
  const { expandedCell, onToggleExpand, isCellExpanded, isAnyExpanded } = useExpansionState<TCompound>();

  // -------------------------------------------------------------------------
  // API Params Helper
  // -------------------------------------------------------------------------
  const apiParams = useMemo(() => {
    const offset = (page - 1) * perPage;
    const limit = perPage;
    let orderBy: `${TSortable}` | `-${TSortable}` | undefined;
    if (sort) {
      orderBy = (sort.direction === 'desc' ? `-${sort.column}` : sort.column) as `${TSortable}` | `-${TSortable}`;
    }
    return { offset, limit, orderBy, filters };
  }, [page, perPage, sort, filters]);

  // -------------------------------------------------------------------------
  // Stale Data Notification
  // -------------------------------------------------------------------------
  useStaleDataEffect(apiParams, onStaleData, staleDataDebounceMs);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    // Sorting
    sort,
    onSortChange,
    // Pagination
    page,
    perPage,
    perPageOptions: returnedPerPageOptions,
    onPageChange,
    onPerPageChange,
    // Selection
    selectedRows,
    onSelectRow,
    onSelectAll,
    clearSelection,
    // Expansion
    expandedCell,
    onToggleExpand,
    // Filters
    filters,
    onFiltersChange,
    clearAllFilters,
    hasActiveFilters,
    // Utilities
    isRowSelected,
    isCellExpanded,
    isAnyExpanded,
    // API params
    apiParams,
  };
}
