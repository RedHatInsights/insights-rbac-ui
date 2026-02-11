import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRowSelection } from '../useRowSelection';

interface TestRow {
  id: string;
  name: string;
}

const rows: TestRow[] = [
  { id: '1', name: 'Row 1' },
  { id: '2', name: 'Row 2' },
  { id: '3', name: 'Row 3' },
];

describe('useRowSelection - edge cases not covered by useTableState', () => {
  describe('idempotent selection', () => {
    it('should not duplicate row when selecting already selected row', () => {
      const { result } = renderHook(() =>
        useRowSelection({
          getRowId: (row: TestRow) => row.id,
        }),
      );

      // Select row
      act(() => {
        result.current.onSelectRow(rows[0], true);
      });
      expect(result.current.selectedRows).toHaveLength(1);

      // Try to select same row again
      act(() => {
        result.current.onSelectRow(rows[0], true);
      });
      expect(result.current.selectedRows).toHaveLength(1); // Still 1, not 2
    });

    it('should be no-op when deselecting unselected row', () => {
      const { result } = renderHook(() =>
        useRowSelection({
          getRowId: (row: TestRow) => row.id,
        }),
      );

      // Deselect row that was never selected
      act(() => {
        result.current.onSelectRow(rows[0], false);
      });
      expect(result.current.selectedRows).toHaveLength(0);
    });
  });

  describe('selectAll with partial existing selection', () => {
    it('should merge new selections without duplicating existing', () => {
      const { result } = renderHook(() =>
        useRowSelection({
          getRowId: (row: TestRow) => row.id,
        }),
      );

      // Select first row manually
      act(() => {
        result.current.onSelectRow(rows[0], true);
      });
      expect(result.current.selectedRows).toHaveLength(1);

      // Select all - should add rows 2 and 3, not duplicate row 1
      act(() => {
        result.current.onSelectAll(true, rows);
      });
      expect(result.current.selectedRows).toHaveLength(3);

      // Verify no duplicates by checking IDs
      const ids = result.current.selectedRows.map((r) => r.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should only deselect rows in the provided list on deselectAll', () => {
      const { result } = renderHook(() =>
        useRowSelection({
          getRowId: (row: TestRow) => row.id,
        }),
      );

      const extraRow: TestRow = { id: '99', name: 'Extra' };

      // Select all rows plus an extra one not in the list
      act(() => {
        result.current.onSelectAll(true, rows);
        result.current.onSelectRow(extraRow, true);
      });
      expect(result.current.selectedRows).toHaveLength(4);

      // Deselect all from the original list only
      act(() => {
        result.current.onSelectAll(false, rows);
      });

      // Extra row should still be selected
      expect(result.current.selectedRows).toHaveLength(1);
      expect(result.current.selectedRows[0].id).toBe('99');
    });
  });

  describe('initialSelectedRows re-sync', () => {
    it('should update selection when initialSelectedRows reference changes', () => {
      const emptySelection: TestRow[] = [];
      const loadedSelection: TestRow[] = [rows[0], rows[1]];

      const { result, rerender } = renderHook(
        ({ initialSelectedRows }) =>
          useRowSelection({
            getRowId: (row: TestRow) => row.id,
            initialSelectedRows,
          }),
        { initialProps: { initialSelectedRows: emptySelection } },
      );

      // Initially empty (data loading)
      expect(result.current.selectedRows).toHaveLength(0);

      // Data loads, consumer passes the real selection
      rerender({ initialSelectedRows: loadedSelection });
      expect(result.current.selectedRows).toHaveLength(2);
      expect(result.current.selectedRows.map((r) => r.id)).toEqual(['1', '2']);
    });

    it('should not re-sync when same IDs are passed in a new array reference', () => {
      const { result, rerender } = renderHook(
        ({ initialSelectedRows }) =>
          useRowSelection({
            getRowId: (row: TestRow) => row.id,
            initialSelectedRows,
          }),
        { initialProps: { initialSelectedRows: [rows[0]] } },
      );

      expect(result.current.selectedRows).toHaveLength(1);

      // User manually selects another row
      act(() => {
        result.current.onSelectRow(rows[1], true);
      });
      expect(result.current.selectedRows).toHaveLength(2);

      // Rerender with a NEW array reference containing the same row IDs
      rerender({ initialSelectedRows: [rows[0]] });
      // Should NOT reset — the value hasn't changed, only the reference
      expect(result.current.selectedRows).toHaveLength(2);
    });

    it('should clear selection when initialSelectedRows changes from non-empty to empty', () => {
      const initialSelection: TestRow[] = [rows[0], rows[1]];

      const { result, rerender } = renderHook(
        ({ initialSelectedRows }) =>
          useRowSelection({
            getRowId: (row: TestRow) => row.id,
            initialSelectedRows,
          }),
        { initialProps: { initialSelectedRows: initialSelection } },
      );

      expect(result.current.selectedRows).toHaveLength(2);

      // User manually selects another row
      act(() => {
        result.current.onSelectRow(rows[2], true);
      });
      expect(result.current.selectedRows).toHaveLength(3);

      // Parent clears initialSelectedRows to an empty array
      rerender({ initialSelectedRows: [] });

      // Hook should re-sync and clear selectedRows
      expect(result.current.selectedRows).toHaveLength(0);
    });
  });
});
