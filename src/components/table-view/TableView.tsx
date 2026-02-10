/**
 * TableView Component
 *
 * A type-safe, flexible table component with:
 * - Const tuple columns for extreme TypeScript safety
 * - Decoupled filtering from columns
 * - Compound expandable rows
 * - Selection, sorting, pagination
 */

import React, { useEffect, useMemo } from 'react';
import { Table, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table';
import { BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { ToolbarPosition } from './types';
import type {
  CellRendererMap,
  ColumnConfigMap,
  ExpandedCell,
  ExpansionRendererMap,
  FilterConfig,
  FilterState,
  SortDirection,
  TableViewProps,
} from './types';
import { TableViewFilters } from './components/TableViewFilters';
import { TableViewToolbar } from './components/TableViewToolbar';
import { TableViewRow } from './components/TableViewRow';
import { TableViewSkeleton } from './components/TableViewSkeleton';
import { DefaultEmptyStateError, DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableViewEmptyState } from './components/TableViewEmptyState';

/**
 * TableView - Unified table component for RBAC UI
 *
 * **IMPORTANT**: When using TableView with server-side data (pagination, sorting, filtering),
 * always pair it with the `useTableState` hook from `./hooks/useTableState`.
 * Do NOT hand-roll pagination, sort, filter, or selection state with `useState` or
 * `@patternfly/react-data-view` hooks — this leads to duplicated logic and subtle bugs
 * (e.g., broken multi-select, ignored sort direction).
 *
 * Exceptions: display-only tables rendering small, fully-local datasets (e.g., from props)
 * where no server-side state management is needed. Suppress the ESLint warning with:
 * `// eslint-disable-next-line rbac-local/require-use-table-state -- <reason>`
 *
 * @template TColumns - Const tuple of column IDs
 * @template TRow - Row data type
 * @template TSortable - Union of sortable column IDs
 * @template TCompound - Union of compound expandable column IDs
 */
export function TableView<
  TColumns extends readonly string[],
  TRow,
  TSortable extends TColumns[number] = never,
  TCompound extends TColumns[number] = never,
>(props: TableViewProps<TColumns, TRow, TSortable, TCompound>): React.ReactElement {
  const {
    // Columns
    columns,
    columnConfig,
    sortableColumns = [] as readonly TSortable[],

    // Data
    data,
    totalCount,
    getRowId,

    // Renderers
    cellRenderers,
    expansionRenderers,

    // Sorting
    sort,
    onSortChange,

    // Pagination
    page,
    perPage,
    perPageOptions = [10, 20, 50, 100],
    onPageChange,
    onPerPageChange,

    // Selection
    selectable = false,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
    isRowSelectable = () => true,

    // Expansion
    expandedCell,
    onToggleExpand,
    isCellExpandable = () => true,
    onExpand,

    // Row actions
    renderActions,

    // Row click
    onRowClick,
    isRowClickable = () => false,

    // Filtering
    filterConfig = [],
    filters = {},
    onFiltersChange,
    clearAllFilters,

    // Toolbar
    toolbarActions,
    bulkActions,

    // Error state
    error,

    // Empty states
    emptyStateNoData,
    emptyStateNoResults,
    emptyStateError,

    // Config
    variant = 'default',
    ouiaId,
    ariaLabel,
  } = props;

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------
  const isLoading = data === undefined && !error;
  const hasError = !!error;
  const isEmpty = !isLoading && !hasError && data !== undefined && data.length === 0;
  // Compute hasActiveFilters based on filterConfig to only consider known filter IDs
  const knownFilterIds = useMemo(() => new Set(filterConfig.map((f) => f.id)), [filterConfig]);
  const hasActiveFilters = useMemo(
    () => Object.entries(filters).some(([key, v]) => knownFilterIds.has(key) && (Array.isArray(v) ? v.length > 0 : v !== '')),
    [filters, knownFilterIds],
  );
  const columnCount = columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0);
  const columnLabels = columns.map((col) => columnConfig[col as keyof typeof columnConfig]?.label || col);

  // -------------------------------------------------------------------------
  // Page Clamping - auto-correct out-of-range page numbers
  // When totalCount is known and current page exceeds max, clamp to last page
  // When totalCount is 0 (no results), normalize to page 1
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading && totalCount !== undefined && page !== undefined && perPage !== undefined && onPageChange) {
      if (totalCount === 0) {
        // No results - normalize to page 1
        if (page !== 1) {
          onPageChange(1);
        }
      } else {
        // Has results - clamp to last valid page
        const maxPage = Math.ceil(totalCount / perPage);
        if (page > maxPage) {
          onPageChange(maxPage);
        }
      }
    }
  }, [isLoading, totalCount, page, perPage, onPageChange]);

  const sortableColumnSet = useMemo(() => new Set(sortableColumns as readonly string[]), [sortableColumns]);

  const compoundColumnSet = useMemo(() => {
    const set = new Set<string>();
    columns.forEach((col) => {
      if (columnConfig[col as keyof typeof columnConfig]?.isCompound) {
        set.add(col);
      }
    });
    return set;
  }, [columns, columnConfig]);

  // Selection derived state
  const selectableCount = data?.filter(isRowSelectable).length || 0;
  const selectedOnPage = data?.filter((row) => isRowSelected(row) && isRowSelectable(row)).length || 0;
  const pageSelected = selectedOnPage > 0 && selectedOnPage === selectableCount;
  const pagePartiallySelected = selectedOnPage > 0 && selectedOnPage < selectableCount;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  function isRowSelected(row: TRow): boolean {
    const rowId = getRowId(row);
    return selectedRows.some((r) => getRowId(r) === rowId);
  }

  function handleSortClick(columnId: TSortable) {
    if (!onSortChange) return;
    const newDirection: SortDirection = sort?.column === columnId && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange(columnId, newDirection);
  }

  function handleBulkSelect(value: BulkSelectValue) {
    const currentRows = data || [];
    if (value === BulkSelectValue.none || value === BulkSelectValue.nonePage) {
      onSelectAll?.(false, currentRows);
    } else if (value === BulkSelectValue.page || value === BulkSelectValue.all) {
      onSelectAll?.(true, currentRows);
    }
  }

  function handleToggleExpand(row: TRow, columnId: TCompound) {
    const rowId = getRowId(row);
    const isCurrentlyExpanded = expandedCell?.rowId === rowId && expandedCell?.column === columnId;
    onToggleExpand?.(rowId, columnId);
    if (!isCurrentlyExpanded) {
      onExpand?.(row, columnId);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Filters (only for top toolbar)
  const filtersElement =
    filterConfig.length > 0 ? <TableViewFilters filterConfig={filterConfig} filters={filters} onFiltersChange={onFiltersChange} /> : null;

  // Actions (only for top toolbar)
  // bulkActions is always rendered if provided (the component itself handles disabling when no selection)
  const actionsElement =
    toolbarActions || bulkActions ? (
      <>
        {bulkActions}
        {toolbarActions}
      </>
    ) : null;

  // Error state content
  const errorStateContent = emptyStateError || <DefaultEmptyStateError error={error} />;

  return (
    <div data-testid="table-view" data-ouia-component-id={ouiaId || undefined}>
      {/* Top Toolbar */}
      <TableViewToolbar
        position={ToolbarPosition.Top}
        ouiaId={ouiaId ? `${ouiaId}-top-toolbar` : undefined}
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        perPageOptions={perPageOptions}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        filters={filtersElement}
        clearAllFilters={clearAllFilters}
        selectableCount={selectableCount}
        selectedCount={selectedRows.length}
        pageSelected={pageSelected}
        pagePartiallySelected={pagePartiallySelected}
        onBulkSelect={selectable ? handleBulkSelect : undefined}
        actions={actionsElement}
      />

      {/* Loading State */}
      {isLoading && (
        <TableViewSkeleton
          columnLabels={columnLabels}
          rowCount={perPage}
          hasSelection={selectable}
          hasActions={!!renderActions}
          variant={variant}
          ariaLabel={ariaLabel}
          ouiaId={ouiaId}
        />
      )}

      {/* Error State */}
      {hasError && <TableViewEmptyState>{errorStateContent}</TableViewEmptyState>}

      {/* Empty State - No Results (with filters) shows table headers */}
      {!isLoading && !hasError && isEmpty && hasActiveFilters && (
        <TableViewEmptyState
          showHeaders
          columnLabels={columnLabels}
          hasSelection={selectable}
          hasActions={!!renderActions}
          variant={variant}
          ariaLabel={ariaLabel}
          ouiaId={ouiaId}
        >
          {emptyStateNoResults || <DefaultEmptyStateNoResults onClearFilters={clearAllFilters} />}
        </TableViewEmptyState>
      )}

      {/* Empty State - No Data (without filters) hides table headers */}
      {!isLoading && !hasError && isEmpty && !hasActiveFilters && (
        <TableViewEmptyState>{emptyStateNoData || <DefaultEmptyStateNoData />}</TableViewEmptyState>
      )}

      {/* Data Table */}
      {!isLoading && !hasError && !isEmpty && data && (
        <Table aria-label={ariaLabel} variant={variant === 'compact' ? TableVariant.compact : undefined} ouiaId={ouiaId}>
          <Thead>
            <Tr>
              {selectable && <Th screenReaderText="Select" modifier="fitContent" />}
              {columns.map((col, index) => {
                const config = columnConfig[col as keyof typeof columnConfig];
                const isSortable = sortableColumnSet.has(col);

                return (
                  <Th
                    key={col}
                    sort={
                      isSortable && onSortChange
                        ? {
                            sortBy: {
                              index: sort?.column === col ? index : -1,
                              direction: sort?.column === col ? sort.direction : 'asc',
                            },
                            onSort: () => handleSortClick(col as TSortable),
                            columnIndex: index,
                          }
                        : undefined
                    }
                  >
                    {config?.label || col}
                  </Th>
                );
              })}
              {renderActions && <Th screenReaderText="Actions" modifier="fitContent" />}
            </Tr>
          </Thead>

          {data.map((row, rowIndex) => (
            <TableViewRow
              key={getRowId(row)}
              row={row}
              rowIndex={rowIndex}
              rowId={getRowId(row)}
              columns={columns}
              selectable={selectable}
              canSelect={isRowSelectable(row)}
              isSelected={isRowSelected(row)}
              onSelectRow={onSelectRow}
              isClickable={isRowClickable(row)}
              onRowClick={onRowClick}
              expandedCell={expandedCell}
              expansionRenderers={expansionRenderers}
              isCellExpandable={isCellExpandable}
              onToggleExpand={handleToggleExpand}
              compoundColumnSet={compoundColumnSet}
              columnConfig={columnConfig}
              cellRenderers={cellRenderers}
              renderActions={renderActions}
              columnCount={columnCount}
            />
          ))}
        </Table>
      )}

      {/* Bottom Toolbar (pagination only) */}
      {!isLoading && !hasError && !isEmpty && (
        <TableViewToolbar
          position={ToolbarPosition.Bottom}
          ouiaId={ouiaId ? `${ouiaId}-bottom-toolbar` : undefined}
          totalCount={totalCount}
          page={page}
          perPage={perPage}
          perPageOptions={perPageOptions}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      )}
    </div>
  );
}

// Re-export types for convenience
export type { TableViewProps, ColumnConfigMap, CellRendererMap, ExpansionRendererMap, FilterConfig, FilterState, SortDirection, ExpandedCell };
