import React, { Fragment, useCallback, useMemo } from 'react';

// DataView imports
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { PER_PAGE_OPTIONS } from '../../../../../helpers/pagination';

// Component imports
import { RolesListEmptyState } from './RolesListEmptyState';
import { useRolesList } from './useRolesList';

// Types
interface Role {
  uuid: string;
  display_name?: string;
  name: string;
  description?: string;
}

interface RolesListProps {
  initialSelectedRoles: Role[];
  onSelect: (selectedRoles: Role[]) => void; // Consumers handle selection changes
  rolesExcluded?: boolean;
  groupId?: string;
  usesMetaInURL?: boolean;
}

export const RolesList: React.FC<RolesListProps> = (props) => {
  // Use custom hook for ALL business logic
  const { roles, isLoading, filters, selection, tableRows, columns, hasActiveFilters, fetchData, debouncedFetchData, emptyStateProps, pagination } =
    useRolesList({
      rolesExcluded: props.rolesExcluded,
      groupId: props.groupId,
      usesMetaInURL: props.usesMetaInURL,
      initialSelectedRoles: props.initialSelectedRoles,
      onSelect: props.onSelect,
    });

  // Pagination calculations
  const calculatePage = (limit: number, offset: number) => Math.floor(offset / limit) + 1;
  const calculateOffset = (page: number, limit: number) => (page - 1) * limit;

  const currentPage = calculatePage(pagination.limit, pagination.offset);

  // Pagination handlers
  const onSetPage = useCallback(
    (_event: any, page: number) => {
      fetchData({ offset: calculateOffset(page, pagination.limit) });
    },
    [fetchData, pagination.limit],
  );

  const onPerPageSelect = useCallback(
    (_event: any, perPage: number) => {
      fetchData({ limit: perPage, offset: 0 });
    },
    [fetchData],
  );

  // Filter change handler - use debounced fetch for better performance
  const handleFilterChange = useCallback(
    (key: string, newValues: Partial<{ name: string }>) => {
      const newFilters = { ...filters.filters, ...newValues };
      filters.onSetFilters(newFilters);
      // Pass the new filter value directly to avoid stale closure issues
      debouncedFetchData({ offset: 0 }, newFilters.name);
    },
    [filters, debouncedFetchData], // Include dependencies for stable references
  );

  // Clear all filters - match exact pattern from working AccessTable and RolesTable
  const clearAllFilters = useCallback(() => {
    filters.clearAllFilters();
    // Trigger API call with default parameters after clearing filters (match AccessTable pattern)
    debouncedFetchData({
      limit: pagination.limit,
      offset: 0,
    });
  }, [filters.clearAllFilters, debouncedFetchData, pagination.limit]);

  // Bulk select handler (avoid unstable dependencies)
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        selection.onSelect(false);
      } else if (value === BulkSelectValue.page) {
        selection.onSelect(true, tableRows);
      } else if (value === BulkSelectValue.nonePage) {
        selection.onSelect(false, tableRows);
      }
    },
    [], // Remove unstable dependencies to prevent infinite loops - rely on closure
  );

  // Skeleton states
  const loadingHeader = useMemo(() => <SkeletonTableHead columns={columns.map((col) => col.cell)} />, [columns]);

  const loadingBody = useMemo(() => <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />, [columns.length]);

  // Empty state component
  const emptyState = useMemo(() => <RolesListEmptyState {...emptyStateProps} />, [emptyStateProps]);

  // Selection is now handled by useEffect hooks for bidirectional sync

  // Memoize bulkSelect component to remove dependency on handleBulkSelect (prevent loops)
  const bulkSelectComponent = useMemo(
    () => <BulkSelect pageCount={roles.length} selectedCount={selection.selected.length} onSelect={handleBulkSelect} />,
    [roles.length, selection.selected.length], // Only re-create when counts change
  );

  // Determine active state
  const activeState = isLoading ? DataViewState.loading : roles.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      <DataView activeState={activeState} selection={selection}>
        <DataViewToolbar
          bulkSelect={bulkSelectComponent}
          pagination={
            <Pagination
              perPageOptions={PER_PAGE_OPTIONS}
              itemCount={pagination.count || 0}
              page={currentPage}
              perPage={pagination.limit}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              isCompact
            />
          }
          filters={
            <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
              <DataViewTextFilter filterId="name" title="Role name" placeholder="Filter by role name" />
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
        />
        <DataViewTable
          columns={columns}
          rows={tableRows}
          headStates={{ loading: loadingHeader }}
          bodyStates={{
            loading: loadingBody,
            empty: emptyState,
          }}
          variant="compact"
        />
        <DataViewToolbar
          clearAllFilters={hasActiveFilters ? clearAllFilters : undefined}
          pagination={
            <Pagination
              perPageOptions={PER_PAGE_OPTIONS}
              itemCount={pagination.count || 0}
              page={currentPage}
              perPage={pagination.limit}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              isCompact
            />
          }
        />
      </DataView>
    </Fragment>
  );
};
