/**
 * useRowSelection Hook
 *
 * Manages row selection state for TableView.
 * Handles single selection, bulk selection, and selection predicates.
 */

import { useCallback, useState } from 'react';

export interface UseRowSelectionOptions<TRow> {
  /** Function to get unique ID for each row */
  getRowId: (row: TRow) => string;
  /** Optional predicate to determine if row can be selected */
  isRowSelectable?: (row: TRow) => boolean;
}

export interface UseRowSelectionReturn<TRow> {
  /** Currently selected rows */
  selectedRows: TRow[];
  /** Select or deselect a single row */
  onSelectRow: (row: TRow, selected: boolean) => void;
  /** Select or deselect multiple rows (for bulk/page selection) */
  onSelectAll: (selected: boolean, rows: TRow[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if a specific row is selected */
  isRowSelected: (row: TRow) => boolean;
}

/**
 * Hook for managing row selection state.
 *
 * @example
 * ```tsx
 * const { selectedRows, onSelectRow, onSelectAll, clearSelection, isRowSelected } =
 *   useRowSelection({
 *     getRowId: (row) => row.uuid,
 *     isRowSelectable: (row) => !row.system,
 *   });
 * ```
 */
export function useRowSelection<TRow>({ getRowId, isRowSelectable = () => true }: UseRowSelectionOptions<TRow>): UseRowSelectionReturn<TRow> {
  const [selectedRows, setSelectedRows] = useState<TRow[]>([]);

  const onSelectRow = useCallback(
    (row: TRow, selected: boolean) => {
      if (!isRowSelectable(row)) return;

      setSelectedRows((prev) => {
        const rowId = getRowId(row);
        if (selected) {
          // Add row if not already selected
          if (!prev.some((r) => getRowId(r) === rowId)) {
            return [...prev, row];
          }
          return prev;
        } else {
          // Remove row from selection
          return prev.filter((r) => getRowId(r) !== rowId);
        }
      });
    },
    [getRowId, isRowSelectable],
  );

  const onSelectAll = useCallback(
    (selected: boolean, rows: TRow[]) => {
      if (selected) {
        // Add all selectable rows from the provided list
        const selectableRows = rows.filter(isRowSelectable);
        setSelectedRows((prev) => {
          const prevIds = new Set(prev.map(getRowId));
          const newRows = selectableRows.filter((r) => !prevIds.has(getRowId(r)));
          return [...prev, ...newRows];
        });
      } else {
        // Remove all rows from the provided list
        const rowIds = new Set(rows.map(getRowId));
        setSelectedRows((prev) => prev.filter((r) => !rowIds.has(getRowId(r))));
      }
    },
    [getRowId, isRowSelectable],
  );

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const isRowSelected = useCallback(
    (row: TRow): boolean => {
      const rowId = getRowId(row);
      return selectedRows.some((r) => getRowId(r) === rowId);
    },
    [selectedRows, getRowId],
  );

  return {
    selectedRows,
    onSelectRow,
    onSelectAll,
    clearSelection,
    isRowSelected,
  };
}
