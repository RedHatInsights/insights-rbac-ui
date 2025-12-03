/**
 * useTableState Hook
 *
 * Combined state management hook for TableView with optional URL synchronization.
 * Manages: pagination, sorting, selection, expansion, and filters.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ExpandedCell, FilterState, SortDirection, SortState, UseTableStateOptions, UseTableStateReturn } from '../types';
import { debounce } from '../../../utilities/debounce';

// =============================================================================
// URL Sync Helper Functions
// =============================================================================

/** Table-managed URL param keys */
const TABLE_URL_PARAMS = ['page', 'perPage', 'sortBy', 'sortDir'] as const;

/** Get page from URL, falling back to default */
function getPageFromUrl(searchParams: URLSearchParams, fallback: number): number {
  const urlPage = searchParams.get('page');
  return urlPage ? parseInt(urlPage, 10) : fallback;
}

/** Get perPage from URL, falling back to default */
function getPerPageFromUrl(searchParams: URLSearchParams, fallback: number): number {
  const urlPerPage = searchParams.get('perPage');
  return urlPerPage ? parseInt(urlPerPage, 10) : fallback;
}

/** Get sort from URL, validating against allowed sortable columns */
function getSortFromUrl<TSortable extends string>(
  searchParams: URLSearchParams,
  sortableColumns: readonly TSortable[],
  initialSort: SortState<TSortable> | undefined,
): SortState<TSortable> | null {
  const urlSort = searchParams.get('sortBy');
  const urlDirection = searchParams.get('sortDir') as SortDirection | null;
  if (urlSort && (sortableColumns as readonly string[]).includes(urlSort)) {
    return { column: urlSort as TSortable, direction: urlDirection || 'asc' };
  }
  return initialSort || null;
}

/** Get filters from URL, excluding table-managed params */
function getFiltersFromUrl(searchParams: URLSearchParams, initialFilters: FilterState): FilterState {
  const urlFilters: FilterState = {};
  searchParams.forEach((value, key) => {
    // Skip table-managed params
    if ((TABLE_URL_PARAMS as readonly string[]).includes(key)) return;
    // Handle array values (comma-separated)
    urlFilters[key] = value.includes(',') ? value.split(',') : value;
  });
  return { ...initialFilters, ...urlFilters };
}

/** Update page in URL, preserving all other params */
function updatePageInUrl(searchParams: URLSearchParams, newPage: number): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (newPage === 1) {
    next.delete('page');
  } else {
    next.set('page', String(newPage));
  }
  return next;
}

/** Update perPage in URL, preserving all other params and resetting page */
function updatePerPageInUrl(searchParams: URLSearchParams, newPerPage: number): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set('perPage', String(newPerPage));
  next.delete('page'); // Reset page when perPage changes
  return next;
}

/** Update sort in URL, preserving all other params */
function updateSortInUrl(searchParams: URLSearchParams, column: string, direction: SortDirection): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set('sortBy', column);
  next.set('sortDir', direction);
  return next;
}

/** Update filters in URL, preserving table-managed params and other non-filter params */
function updateFiltersInUrl(searchParams: URLSearchParams, newFilters: FilterState): URLSearchParams {
  const next = new URLSearchParams();

  // Preserve all non-filter params (table params + any external params)
  searchParams.forEach((value, key) => {
    // Keep table-managed params
    if ((TABLE_URL_PARAMS as readonly string[]).includes(key)) {
      next.set(key, value);
    }
  });

  // Reset page when filters change
  next.delete('page');

  // Add filter params
  Object.entries(newFilters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        next.set(key, value.join(','));
      }
    } else if (value) {
      next.set(key, value);
    }
  });

  return next;
}

/** Clear filters in URL, preserving table-managed params */
function clearFiltersInUrl(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams();

  // Preserve table-managed params except page
  searchParams.forEach((value, key) => {
    if ((TABLE_URL_PARAMS as readonly string[]).includes(key) && key !== 'page') {
      next.set(key, value);
    }
  });

  return next;
}

// =============================================================================
// Stale Data Effect Hook
// =============================================================================

/**
 * Hook to handle debounced stale data notifications.
 * Calls immediately on mount, debounces subsequent calls.
 *
 * IMPORTANT: Uses a ref to stabilize the callback reference, preventing
 * infinite re-render loops when consumers pass inline functions to onStaleData.
 */
function useStaleDataEffect<TParams>(params: TParams, onStaleData?: (params: TParams) => void, debounceMs: number = 300): void {
  // Stabilize callback reference to prevent infinite loops from inline functions
  const callbackRef = useRef(onStaleData);
  callbackRef.current = onStaleData;

  // Create debounced version that always calls the latest callback
  // Only recreate if debounceMs changes - the callback is accessed via ref
  const debounced = useMemo(() => {
    // Always create debounced fn, it will no-op if callbackRef.current is undefined
    return debounce((p: TParams) => callbackRef.current?.(p), debounceMs);
  }, [debounceMs]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!callbackRef.current) return;

    if (isInitialMount.current) {
      // Call immediately on mount (no debounce for initial load)
      isInitialMount.current = false;
      callbackRef.current(params);
    } else if (debounced) {
      // Debounce subsequent calls
      debounced(params);
    }

    return () => {
      debounced?.cancel?.();
    };
  }, [params, debounced]); // Note: no onStaleData in deps - we use callbackRef instead
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * useTableState - Combined state management for TableView
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
    initialFilters = {},
    getRowId,
    isRowSelectable = () => true,
    syncWithUrl = false,
    onStaleData,
    staleDataDebounceMs = 300,
  } = options;

  // URL search params for sync - always called (React hooks can't be conditional)
  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------------------------------------------------------------
  // Pagination State
  // -------------------------------------------------------------------------
  const [page, setPageState] = useState(() => (syncWithUrl ? getPageFromUrl(searchParams, 1) : 1));

  const [perPage, setPerPageState] = useState(() => (syncWithUrl ? getPerPageFromUrl(searchParams, initialPerPage) : initialPerPage));

  const onPageChange = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      if (syncWithUrl) {
        setSearchParams((prev) => updatePageInUrl(prev, newPage));
      }
    },
    [syncWithUrl, setSearchParams],
  );

  const onPerPageChange = useCallback(
    (newPerPage: number) => {
      setPerPageState(newPerPage);
      setPageState(1);
      if (syncWithUrl) {
        setSearchParams((prev) => updatePerPageInUrl(prev, newPerPage));
      }
    },
    [syncWithUrl, setSearchParams],
  );

  // -------------------------------------------------------------------------
  // Sort State
  // -------------------------------------------------------------------------
  const [sort, setSortState] = useState<SortState<TSortable> | null>(() =>
    syncWithUrl ? getSortFromUrl(searchParams, sortableColumns, initialSort) : initialSort || null,
  );

  const onSortChange = useCallback(
    (column: TSortable, direction: SortDirection) => {
      setSortState({ column, direction });
      if (syncWithUrl) {
        setSearchParams((prev) => updateSortInUrl(prev, column, direction));
      }
    },
    [syncWithUrl, setSearchParams],
  );

  // -------------------------------------------------------------------------
  // Selection State
  // -------------------------------------------------------------------------
  const [selectedRows, setSelectedRows] = useState<TRow[]>([]);

  const onSelectRow = useCallback(
    (row: TRow, selected: boolean) => {
      if (!isRowSelectable(row)) return;

      setSelectedRows((prev) => {
        const rowId = getRowId(row);
        if (selected) {
          if (!prev.some((r) => getRowId(r) === rowId)) {
            return [...prev, row];
          }
          return prev;
        } else {
          return prev.filter((r) => getRowId(r) !== rowId);
        }
      });
    },
    [getRowId, isRowSelectable],
  );

  const onSelectAll = useCallback(
    (selected: boolean, rows: TRow[]) => {
      if (selected) {
        const selectableRows = rows.filter(isRowSelectable);
        setSelectedRows((prev) => {
          const prevIds = new Set(prev.map(getRowId));
          const newRows = selectableRows.filter((r) => !prevIds.has(getRowId(r)));
          return [...prev, ...newRows];
        });
      } else {
        const rowIds = new Set(rows.map(getRowId));
        setSelectedRows((prev) => prev.filter((r) => !rowIds.has(getRowId(r))));
      }
    },
    [getRowId, isRowSelectable],
  );

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  // -------------------------------------------------------------------------
  // Expansion State
  // -------------------------------------------------------------------------
  const [expandedCell, setExpandedCell] = useState<ExpandedCell<TCompound> | null>(null);

  const onToggleExpand = useCallback((rowId: string, column: TCompound) => {
    setExpandedCell((prev) => {
      if (prev?.rowId === rowId && prev?.column === column) {
        return null;
      }
      return { rowId, column };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Filter State
  // -------------------------------------------------------------------------
  const [filters, setFiltersState] = useState<FilterState>(() => (syncWithUrl ? getFiltersFromUrl(searchParams, initialFilters) : initialFilters));

  const onFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFiltersState(newFilters);
      setPageState(1);
      if (syncWithUrl) {
        setSearchParams((prev) => updateFiltersInUrl(prev, newFilters));
      }
    },
    [syncWithUrl, setSearchParams],
  );

  const clearAllFilters = useCallback(() => {
    setFiltersState({});
    setPageState(1);
    if (syncWithUrl) {
      setSearchParams((prev) => clearFiltersInUrl(prev));
    }
  }, [syncWithUrl, setSearchParams]);

  const hasActiveFilters = useMemo(() => Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== '')), [filters]);

  // -------------------------------------------------------------------------
  // Utility Functions
  // -------------------------------------------------------------------------
  const isRowSelected = useCallback(
    (row: TRow): boolean => {
      const rowId = getRowId(row);
      return selectedRows.some((r) => getRowId(r) === rowId);
    },
    [selectedRows, getRowId],
  );

  const isCellExpanded = useCallback(
    (rowId: string, column: TCompound): boolean => {
      return expandedCell?.rowId === rowId && expandedCell?.column === column;
    },
    [expandedCell],
  );

  const isAnyExpanded = useCallback(
    (rowId: string): boolean => {
      return expandedCell?.rowId === rowId;
    },
    [expandedCell],
  );

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
    sort,
    onSortChange,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
    selectedRows,
    onSelectRow,
    onSelectAll,
    clearSelection,
    expandedCell,
    onToggleExpand,
    filters,
    onFiltersChange,
    clearAllFilters,
    hasActiveFilters,
    isRowSelected,
    isCellExpanded,
    isAnyExpanded,
    apiParams,
  };
}
