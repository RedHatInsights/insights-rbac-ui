/**
 * TableView Component
 *
 * A type-safe, flexible table component with:
 * - Const tuple columns for extreme TypeScript safety
 * - Decoupled filtering from columns
 * - Compound expandable rows
 * - Selection, sorting, pagination
 */

import React, { useMemo } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table';
import { ExpandableRowContent } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { EmptyState, EmptyStateActions, EmptyStateBody, EmptyStateFooter, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewCheckboxFilter, DataViewTextFilter } from '@patternfly/react-data-view';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
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

/**
 * TableView - Unified table component for RBAC UI
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

    // Empty states
    emptyStateNoData,
    emptyStateNoResults,

    // Config
    variant = 'default',
    ouiaId,
    ariaLabel,
  } = props;

  // Determine loading state
  const isLoading = data === undefined;

  // Determine empty state type
  const isEmpty = !isLoading && data.length === 0;
  const hasActiveFilters = Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== ''));

  // Calculate column count for skeleton and empty state
  const columnCount = columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0);

  // Get sortable column index map
  const sortableColumnSet = new Set(sortableColumns as readonly string[]);

  // Get compound column set
  const compoundColumnSet = useMemo(() => {
    const set = new Set<string>();
    columns.forEach((col) => {
      if (columnConfig[col as keyof typeof columnConfig]?.isCompound) {
        set.add(col);
      }
    });
    return set;
  }, [columns, columnConfig]);

  // Handle sort click
  const handleSortClick = (columnId: TSortable) => {
    if (!onSortChange) return;

    const newDirection: SortDirection = sort?.column === columnId && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange(columnId, newDirection);
  };

  // Handle row selection
  const handleSelectRow = (row: TRow, isSelecting: boolean) => {
    onSelectRow?.(row, isSelecting);
  };

  // Handle bulk select - pass current page data to selection handler
  const handleBulkSelect = (value: BulkSelectValue) => {
    const currentRows = data || [];
    if (value === BulkSelectValue.none) {
      onSelectAll?.(false, currentRows);
    } else if (value === BulkSelectValue.page || value === BulkSelectValue.all) {
      onSelectAll?.(true, currentRows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelectAll?.(false, currentRows);
    }
  };

  // Check if row is selected
  const isRowSelected = (row: TRow): boolean => {
    const rowId = getRowId(row);
    return selectedRows.some((r) => getRowId(r) === rowId);
  };

  // Handle expansion toggle
  const handleToggleExpand = (row: TRow, columnId: TCompound) => {
    const rowId = getRowId(row);
    const isCurrentlyExpanded = expandedCell?.rowId === rowId && expandedCell?.column === columnId;

    onToggleExpand?.(rowId, columnId);

    // Call onExpand when expanding (not collapsing)
    if (!isCurrentlyExpanded) {
      onExpand?.(row, columnId);
    }
  };

  // Check if cell is expanded
  const isCellExpanded = (rowId: string, columnId: string): boolean => {
    return expandedCell?.rowId === rowId && expandedCell?.column === columnId;
  };

  // Handle row click
  const handleRowClick = (row: TRow, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox, button, or actions
    const target = event.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('button') || target.closest('[data-actions]')) {
      return;
    }

    if (isRowClickable(row)) {
      onRowClick?.(row);
    }
  };

  // Handle filter change - DataViewFilters passes (_event, values)
  const handleFilterChange = (_event: unknown, newFilters: Partial<FilterState>) => {
    // Merge with existing filters and convert undefined to empty strings
    const mergedFilters: FilterState = { ...filters };
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined) {
        delete mergedFilters[key];
      } else {
        mergedFilters[key] = value;
      }
    });
    onFiltersChange?.(mergedFilters);
  };

  // Normalize filter config - reduce 4 types to 2 (text vs checkbox)
  // Note: 'search' type intentionally doesn't have a label field - we provide 'Search' as default
  const normalizedFilterConfig = useMemo(
    () =>
      filterConfig.map((config) => {
        if (config.type === 'search') {
          return { ...config, type: 'text' as const, label: 'Search' };
        }
        if (config.type === 'select') {
          return { ...config, type: 'checkbox' as const };
        }
        return config;
      }),
    [filterConfig],
  );

  // Render filter components
  const renderFilters = () => {
    if (normalizedFilterConfig.length === 0) return null;

    return (
      <DataViewFilters onChange={handleFilterChange} values={filters}>
        {normalizedFilterConfig.map((config) => {
          if (config.type === 'text') {
            return <DataViewTextFilter key={config.id} filterId={config.id} title={config.label} placeholder={config.placeholder} />;
          }
          if (config.type === 'checkbox') {
            const mappedOptions = config.options.map((opt) => ({ value: opt.id, label: opt.label }));
            return <DataViewCheckboxFilter key={config.id} filterId={config.id} title={config.label} options={mappedOptions} />;
          }
          return null;
        })}
      </DataViewFilters>
    );
  };

  // Calculate selection state for bulk select
  const selectableCount = data?.filter(isRowSelectable).length || 0;
  const selectedOnPage = data?.filter((row) => isRowSelected(row) && isRowSelectable(row)).length || 0;
  const pageSelected = selectedOnPage > 0 && selectedOnPage === selectableCount;
  const pagePartiallySelected = selectedOnPage > 0 && selectedOnPage < selectableCount;

  // Render toolbar using DataViewToolbar for proper filter integration
  const renderToolbar = (position: 'top' | 'bottom') => {
    const showFilters = position === 'top' && normalizedFilterConfig.length > 0;
    const showBulkSelect = position === 'top' && selectable && data && data.length > 0;
    const showActions = position === 'top' && (toolbarActions || (bulkActions && selectedRows.length > 0));
    const showPagination = totalCount > 0;

    if (!showFilters && !showBulkSelect && !showActions && !showPagination) {
      return null;
    }

    const toolbarOuiaId = ouiaId ? `${ouiaId}-${position}-toolbar` : undefined;

    return (
      <DataViewToolbar
        ouiaId={toolbarOuiaId}
        bulkSelect={
          showBulkSelect ? (
            <BulkSelect
              isDataPaginated
              selectedCount={selectedRows.length}
              totalCount={totalCount}
              pageCount={selectableCount}
              pageSelected={pageSelected}
              pagePartiallySelected={pagePartiallySelected}
              onSelect={handleBulkSelect}
            />
          ) : undefined
        }
        filters={showFilters ? renderFilters() : undefined}
        clearAllFilters={clearAllFilters}
        actions={
          showActions ? (
            <>
              {selectedRows.length > 0 && bulkActions}
              {toolbarActions}
            </>
          ) : undefined
        }
        pagination={
          showPagination ? (
            <Pagination
              itemCount={totalCount}
              page={page}
              perPage={perPage}
              onSetPage={(_e, newPage) => onPageChange(newPage)}
              onPerPageSelect={(_e, newPerPage) => onPerPageChange(newPerPage)}
              variant={position === 'bottom' ? 'bottom' : undefined}
              isCompact={position === 'top'}
            />
          ) : undefined
        }
      />
    );
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <Table aria-label={ariaLabel} variant={variant === 'compact' ? TableVariant.compact : undefined} ouiaId={ouiaId}>
      <SkeletonTableHead
        columns={[
          ...(selectable ? [''] : []),
          ...columns.map((col) => columnConfig[col as keyof typeof columnConfig]?.label || col),
          ...(renderActions ? [''] : []),
        ]}
      />
      <SkeletonTableBody rowsCount={perPage} columnsCount={columnCount} />
    </Table>
  );

  // Default empty state for no data
  const defaultEmptyStateNoData = (
    <EmptyState>
      <EmptyStateHeader titleText="No data available" headingLevel="h4" icon={<EmptyStateIcon icon={CubesIcon} />} />
      <EmptyStateBody>There are no items to display. Create a new item to get started.</EmptyStateBody>
    </EmptyState>
  );

  // Default empty state for no results (with filters active)
  const defaultEmptyStateNoResults = (
    <EmptyState>
      <EmptyStateHeader titleText="No results found" headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>No items match the filter criteria. Remove all filters or clear all filters to show results.</EmptyStateBody>
      {clearAllFilters && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="link" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </EmptyState>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Table aria-label={ariaLabel} variant={variant === 'compact' ? TableVariant.compact : undefined} ouiaId={ouiaId}>
      <Thead>
        <Tr>
          {selectable && <Th screenReaderText="Select" />}
          {columns.map((col) => (
            <Th key={col}>{columnConfig[col as keyof typeof columnConfig]?.label || col}</Th>
          ))}
          {renderActions && <Th screenReaderText="Actions" />}
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td colSpan={columnCount}>
            {hasActiveFilters ? emptyStateNoResults || defaultEmptyStateNoResults : emptyStateNoData || defaultEmptyStateNoData}
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );

  // Render table with data
  const renderTable = () => {
    if (!data) return null;

    return (
      <Table aria-label={ariaLabel} variant={variant === 'compact' ? TableVariant.compact : undefined} ouiaId={ouiaId}>
        <Thead>
          <Tr>
            {selectable && <Th screenReaderText="Select" />}
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
                  // width prop omitted - PF5 Th only accepts specific percentage values
                >
                  {config?.label || col}
                </Th>
              );
            })}
            {renderActions && <Th screenReaderText="Actions" />}
          </Tr>
        </Thead>

        {data.map((row, rowIndex) => {
          const rowId = getRowId(row);
          const isSelected = isRowSelected(row);
          const canSelect = isRowSelectable(row);
          const isClickable = isRowClickable(row);
          const isExpanded = expandedCell?.rowId === rowId;

          // Get the expansion renderer for the currently expanded cell (if any)
          const expandedColumnId = isExpanded ? expandedCell?.column : undefined;
          const expansionRenderer = expandedColumnId ? expansionRenderers?.[expandedColumnId as keyof typeof expansionRenderers] : undefined;

          return (
            <Tbody key={rowId} isExpanded={isExpanded}>
              <Tr
                isClickable={isClickable}
                isRowSelected={isSelected}
                onRowClick={isClickable ? (e) => e && handleRowClick(row, e as React.MouseEvent) : undefined}
              >
                {selectable && (
                  <Td
                    className={!canSelect ? 'pf-v5-c-table__check' : undefined}
                    select={
                      canSelect
                        ? {
                            rowIndex,
                            onSelect: (_e, isSelecting) => handleSelectRow(row, isSelecting),
                            isSelected,
                          }
                        : undefined
                    }
                  />
                )}

                {columns.map((col) => {
                  const isCompound = compoundColumnSet.has(col);
                  const canExpand = isCompound && isCellExpandable(row, col as TCompound);
                  const cellExpanded = isCellExpanded(rowId, col);

                  return (
                    <Td
                      key={col}
                      dataLabel={columnConfig[col as keyof typeof columnConfig]?.label || col}
                      compoundExpand={
                        canExpand && onToggleExpand
                          ? {
                              isExpanded: cellExpanded,
                              onToggle: () => handleToggleExpand(row, col as TCompound),
                            }
                          : undefined
                      }
                    >
                      {cellRenderers[col as keyof typeof cellRenderers](row)}
                    </Td>
                  );
                })}

                {renderActions && (
                  <Td data-actions isActionCell>
                    {renderActions(row)}
                  </Td>
                )}
              </Tr>

              {/* Single expansion row - only render if this row has an expanded cell */}
              {expansionRenderer && (
                <Tr key={`${rowId}-${expandedColumnId}-expansion`} isExpanded>
                  <Td colSpan={columnCount}>
                    <ExpandableRowContent>{expansionRenderer(row)}</ExpandableRowContent>
                  </Td>
                </Tr>
              )}
            </Tbody>
          );
        })}
      </Table>
    );
  };

  return (
    <div data-testid="table-view" data-ouia-component-id={ouiaId || undefined}>
      {renderToolbar('top')}
      {isLoading ? renderSkeleton() : isEmpty ? renderEmptyState() : renderTable()}
      {!isLoading && !isEmpty && renderToolbar('bottom')}
    </div>
  );
}

// Re-export types for convenience
export type { TableViewProps, ColumnConfigMap, CellRendererMap, ExpansionRendererMap, FilterConfig, FilterState, SortDirection, ExpandedCell };
