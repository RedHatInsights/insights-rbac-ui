import { useMemo } from 'react';

interface Column {
  title: string;
  key?: string;
  [key: string]: any;
}

interface SortBy {
  index: number;
  direction: 'asc' | 'desc';
}

/**
 * Hook that calculates orderBy string from columns and sort state
 *
 * @param columns - Table columns with optional key property
 * @param sortBy - Current sort state
 * @param isSelectable - Whether table has a selection column (shifts indices)
 * @returns orderBy string for API calls (e.g., "-modified" for descending)
 *
 * @example
 * const orderBy = useOrderBy(columns, sortByState, true);
 * // Returns: "-display_name" for descending sort on second column (after checkbox)
 */
export function useOrderBy(columns: Column[], sortBy: SortBy, isSelectable: boolean) {
  // Memoize column keys to provide stable reference
  const columnKeys = useMemo(() => columns.map((c) => c.key ?? null), [columns]);

  return useMemo(() => {
    // Adjust index if table has selectable column
    const adjustedIndex = sortBy.index - Number(isSelectable);
    const key = columnKeys[adjustedIndex] || '';

    // Add '-' prefix for descending sort
    return `${sortBy.direction === 'desc' ? '-' : ''}${key}`;
  }, [columnKeys, sortBy, isSelectable]);
}
