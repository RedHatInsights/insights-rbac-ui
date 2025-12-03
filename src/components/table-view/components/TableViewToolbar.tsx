/**
 * TableViewToolbar Component
 *
 * Internal component for rendering the table toolbar.
 * Handles filters, bulk selection, pagination, and actions.
 */

import React, { ReactNode } from 'react';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';

export interface TableViewToolbarProps {
  /** Position - top or bottom toolbar */
  position: 'top' | 'bottom';
  /** OUIA ID for testing */
  ouiaId?: string;

  // Pagination
  /** Total item count */
  totalCount: number;
  /** Current page */
  page: number;
  /** Items per page */
  perPage: number;
  /** Available per-page options */
  perPageOptions?: number[];
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when per page changes */
  onPerPageChange: (perPage: number) => void;

  // Filters
  /** Whether to show filters */
  showFilters: boolean;
  /** Filter components */
  filters?: ReactNode;
  /** Clear all filters callback */
  clearAllFilters?: () => void;

  // Selection
  /** Whether selection is enabled */
  selectable: boolean;
  /** Number of selectable items on current page */
  selectableCount: number;
  /** Number of currently selected items */
  selectedCount: number;
  /** Whether all selectable items on page are selected */
  pageSelected: boolean;
  /** Whether some but not all selectable items on page are selected */
  pagePartiallySelected: boolean;
  /** Callback for bulk select actions */
  onBulkSelect?: (value: BulkSelectValue) => void;

  // Actions
  /** Action elements */
  actions?: ReactNode;
}

/**
 * Internal toolbar component for TableView.
 * Renders bulk select, filters, actions, and pagination.
 */
export const TableViewToolbar: React.FC<TableViewToolbarProps> = ({
  position,
  ouiaId,
  totalCount,
  page,
  perPage,
  perPageOptions,
  onPageChange,
  onPerPageChange,
  showFilters,
  filters,
  clearAllFilters,
  selectable,
  selectableCount,
  selectedCount,
  pageSelected,
  pagePartiallySelected,
  onBulkSelect,
  actions,
}) => {
  const isTopToolbar = position === 'top';
  const showBulkSelect = isTopToolbar && selectable && selectableCount > 0;
  const showActions = isTopToolbar && actions;
  const showPagination = totalCount > 0;

  // Don't render if nothing to show
  if (!showFilters && !showBulkSelect && !showActions && !showPagination) {
    return null;
  }

  return (
    <DataViewToolbar
      ouiaId={ouiaId}
      bulkSelect={
        showBulkSelect && onBulkSelect ? (
          <BulkSelect
            isDataPaginated
            selectedCount={selectedCount}
            totalCount={totalCount}
            pageCount={selectableCount}
            pageSelected={pageSelected}
            pagePartiallySelected={pagePartiallySelected}
            onSelect={onBulkSelect}
          />
        ) : undefined
      }
      filters={showFilters ? filters : undefined}
      clearAllFilters={clearAllFilters}
      actions={showActions ? actions : undefined}
      pagination={
        showPagination ? (
          <Pagination
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            perPageOptions={perPageOptions?.map((n) => ({ title: String(n), value: n }))}
            onSetPage={(_e, newPage) => onPageChange(newPage)}
            onPerPageSelect={(_e, newPerPage) => onPerPageChange(newPerPage)}
            variant={position === 'bottom' ? 'bottom' : undefined}
            isCompact={isTopToolbar}
          />
        ) : undefined
      }
    />
  );
};
