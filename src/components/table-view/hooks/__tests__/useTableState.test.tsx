import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { useTableState } from '../useTableState';

// Test row type
interface TestRow {
  id: string;
  name: string;
  system?: boolean;
}

// Test columns - include 'details' for expansion tests
const columns = ['name', 'status', 'details'] as const;
const sortableColumns = ['name'] as const;
const compoundColumns = ['details'] as const;

type SortableColumnId = (typeof sortableColumns)[number];
type CompoundColumnId = (typeof compoundColumns)[number];

// Helper to create wrapper with Router
function createWrapper(initialEntries: string[] = ['/']) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  return Wrapper;
}

describe('useTableState', () => {
  describe('pagination', () => {
    it('should initialize with default pagination values', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.page).toBe(1);
      expect(result.current.perPage).toBe(20); // default
      expect(result.current.perPageOptions).toEqual([10, 20, 50, 100]);
    });

    it('should use custom initial perPage', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            initialPerPage: 50,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.perPage).toBe(50);
    });

    it('should change page', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onPageChange(3);
      });

      expect(result.current.page).toBe(3);
    });

    it('should reset page to 1 when perPage changes', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      // Go to page 3
      act(() => {
        result.current.onPageChange(3);
      });
      expect(result.current.page).toBe(3);

      // Change perPage - should reset to page 1
      act(() => {
        result.current.onPerPageChange(50);
      });
      expect(result.current.page).toBe(1);
      expect(result.current.perPage).toBe(50);
    });
  });

  describe('sorting', () => {
    it('should initialize with no sort by default', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, SortableColumnId>({
            columns,
            sortableColumns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.sort).toBeNull();
    });

    it('should use initial sort', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, SortableColumnId>({
            columns,
            sortableColumns,
            getRowId: (row) => row.id,
            initialSort: { column: 'name', direction: 'asc' },
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.sort).toEqual({ column: 'name', direction: 'asc' });
    });

    it('should change sort', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, SortableColumnId>({
            columns,
            sortableColumns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSortChange('name', 'desc');
      });

      expect(result.current.sort).toEqual({ column: 'name', direction: 'desc' });
    });
  });

  describe('filters', () => {
    it('should initialize with empty filters', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.filters).toEqual({});
    });

    it('should use initial filters', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            initialFilters: { name: 'test' },
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.filters).toEqual({ name: 'test' });
    });

    it('should update filters and reset page', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      // Go to page 2
      act(() => {
        result.current.onPageChange(2);
      });
      expect(result.current.page).toBe(2);

      // Update filters - should reset to page 1
      act(() => {
        result.current.onFiltersChange({ name: 'search' });
      });

      expect(result.current.filters).toEqual({ name: 'search' });
      expect(result.current.page).toBe(1);
    });

    it('should clear all filters and reset page', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            initialFilters: { name: 'test', status: ['active'] },
          }),
        { wrapper: createWrapper() },
      );

      // Go to page 2
      act(() => {
        result.current.onPageChange(2);
      });

      // Clear filters
      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.page).toBe(1);
    });
  });

  describe('selection', () => {
    const rows: TestRow[] = [
      { id: '1', name: 'Row 1' },
      { id: '2', name: 'Row 2', system: true },
      { id: '3', name: 'Row 3' },
    ];

    it('should initialize with empty selection', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.selectedRows).toEqual([]);
    });

    it('should select and deselect rows', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      // Select row
      act(() => {
        result.current.onSelectRow(rows[0], true);
      });
      expect(result.current.selectedRows).toHaveLength(1);
      expect(result.current.isRowSelected(rows[0])).toBe(true);

      // Deselect row
      act(() => {
        result.current.onSelectRow(rows[0], false);
      });
      expect(result.current.selectedRows).toHaveLength(0);
      expect(result.current.isRowSelected(rows[0])).toBe(false);
    });

    it('should respect isRowSelectable', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            isRowSelectable: (row) => !row.system,
          }),
        { wrapper: createWrapper() },
      );

      // Try to select system row - should not work
      act(() => {
        result.current.onSelectRow(rows[1], true); // system: true
      });
      expect(result.current.selectedRows).toHaveLength(0);

      // Select non-system row - should work
      act(() => {
        result.current.onSelectRow(rows[0], true);
      });
      expect(result.current.selectedRows).toHaveLength(1);
    });

    it('should select all selectable rows', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            isRowSelectable: (row) => !row.system,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAll(true, rows);
      });

      // Should select 2 rows (not the system one)
      expect(result.current.selectedRows).toHaveLength(2);
      expect(result.current.isRowSelected(rows[0])).toBe(true);
      expect(result.current.isRowSelected(rows[1])).toBe(false); // system
      expect(result.current.isRowSelected(rows[2])).toBe(true);
    });

    it('should clear selection', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      // Select some rows
      act(() => {
        result.current.onSelectAll(true, rows);
      });
      expect(result.current.selectedRows.length).toBeGreaterThan(0);

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedRows).toHaveLength(0);
    });
  });

  describe('expansion', () => {
    it('should initialize with no expansion', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, never, CompoundColumnId>({
            columns,
            compoundColumns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.expandedCell).toBeNull();
    });

    it('should toggle expansion', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, never, CompoundColumnId>({
            columns,
            compoundColumns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      // Expand cell
      act(() => {
        result.current.onToggleExpand('row-1', 'details');
      });
      expect(result.current.expandedCell).toEqual({ rowId: 'row-1', column: 'details' });
      expect(result.current.isCellExpanded('row-1', 'details')).toBe(true);
      expect(result.current.isAnyExpanded('row-1')).toBe(true);

      // Collapse same cell
      act(() => {
        result.current.onToggleExpand('row-1', 'details');
      });
      expect(result.current.expandedCell).toBeNull();
      expect(result.current.isCellExpanded('row-1', 'details')).toBe(false);
    });

    it('should switch expansion to different cell', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, never, CompoundColumnId>({
            columns,
            compoundColumns,
            getRowId: (row) => row.id,
          }),
        { wrapper: createWrapper() },
      );

      // Expand first cell
      act(() => {
        result.current.onToggleExpand('row-1', 'details');
      });

      // Expand different cell - should close first and open second
      act(() => {
        result.current.onToggleExpand('row-2', 'details');
      });

      expect(result.current.expandedCell).toEqual({ rowId: 'row-2', column: 'details' });
      expect(result.current.isCellExpanded('row-1', 'details')).toBe(false);
      expect(result.current.isCellExpanded('row-2', 'details')).toBe(true);
    });
  });

  describe('apiParams', () => {
    it('should compute correct API params', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, SortableColumnId>({
            columns,
            sortableColumns,
            getRowId: (row) => row.id,
            initialPerPage: 10,
            initialSort: { column: 'name', direction: 'desc' },
            initialFilters: { name: 'test' },
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.apiParams).toEqual({
        offset: 0, // (page 1 - 1) * 10
        limit: 10,
        orderBy: '-name', // desc
        filters: { name: 'test' },
      });
    });

    it('should update apiParams when state changes', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, SortableColumnId>({
            columns,
            sortableColumns,
            getRowId: (row) => row.id,
            initialPerPage: 10,
          }),
        { wrapper: createWrapper() },
      );

      // Go to page 3
      act(() => {
        result.current.onPageChange(3);
      });

      expect(result.current.apiParams.offset).toBe(20); // (3-1) * 10

      // Change sort
      act(() => {
        result.current.onSortChange('name', 'asc');
      });

      expect(result.current.apiParams.orderBy).toBe('name'); // asc (no prefix)
    });
  });

  describe('URL sync', () => {
    it('should read initial state from URL when syncWithUrl is true', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow, SortableColumnId>({
            columns,
            sortableColumns,
            getRowId: (row) => row.id,
            syncWithUrl: true,
          }),
        { wrapper: createWrapper(['/?page=3&perPage=50&sortBy=name&sortDir=desc&name=test']) },
      );

      expect(result.current.page).toBe(3);
      expect(result.current.perPage).toBe(50);
      expect(result.current.sort).toEqual({ column: 'name', direction: 'desc' });
      expect(result.current.filters).toEqual({ name: 'test' });
    });

    it('should not read URL when syncWithUrl is false', () => {
      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            syncWithUrl: false,
            initialPerPage: 20,
          }),
        { wrapper: createWrapper(['/?page=3&perPage=50&name=test']) },
      );

      // Should use defaults, not URL values
      expect(result.current.page).toBe(1);
      expect(result.current.perPage).toBe(20);
      expect(result.current.filters).toEqual({});
    });
  });

  describe('onStaleData callback', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onStaleData on initial mount', () => {
      const onStaleData = jest.fn();

      renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            onStaleData,
          }),
        { wrapper: createWrapper() },
      );

      // Should call immediately on mount
      expect(onStaleData).toHaveBeenCalledTimes(1);
      expect(onStaleData).toHaveBeenCalledWith({
        offset: 0,
        limit: 20,
        orderBy: undefined,
        filters: {},
      });
    });

    it('should debounce subsequent onStaleData calls', () => {
      const onStaleData = jest.fn();

      const { result } = renderHook(
        () =>
          useTableState<typeof columns, TestRow>({
            columns,
            getRowId: (row) => row.id,
            onStaleData,
            staleDataDebounceMs: 300,
          }),
        { wrapper: createWrapper() },
      );

      onStaleData.mockClear();

      // Make multiple rapid changes
      act(() => {
        result.current.onFiltersChange({ name: 'a' });
      });
      act(() => {
        result.current.onFiltersChange({ name: 'ab' });
      });
      act(() => {
        result.current.onFiltersChange({ name: 'abc' });
      });

      // Should not have called yet (debounced)
      expect(onStaleData).toHaveBeenCalledTimes(0);

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should have called once with final value
      expect(onStaleData).toHaveBeenCalledTimes(1);
      expect(onStaleData).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { name: 'abc' },
        }),
      );
    });
  });
});
