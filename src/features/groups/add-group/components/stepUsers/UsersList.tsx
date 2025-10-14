import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { debounce } from '../../../../../utilities/debounce';

// DataView imports
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewCheckboxFilter, DataViewTextFilter } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { PER_PAGE_OPTIONS } from '../../../../../helpers/pagination';

// Component imports
import { UsersListEmptyState } from './UsersListEmptyState';
import { useUsersList } from './useUsersList';
import type { User, UsersListProps } from './types';

export const UsersList: React.FC<UsersListProps> = (props) => {
  // Use custom hook for ALL business logic
  const { users, isLoading, filters, selection, tableRows, columns, fetchData, emptyStateProps, pagination } = useUsersList({
    usesMetaInURL: props.usesMetaInURL,
    displayNarrow: props.displayNarrow,
    initialSelectedUsers: props.initialSelectedUsers,
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

  // Debounced version for filter changes to prevent excessive API calls
  const debouncedFetchData = useMemo(() => debounce(fetchData), [fetchData]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
    };
  }, [debouncedFetchData]);

  // Filter change handler
  const handleFilterChange = useCallback(
    (_event: any, newFilters: Partial<{ username: string; email: string; status: string[] }>) => {
      // Update filter state immediately for UI responsiveness
      filters.onSetFilters(newFilters);

      // Merge new filters with existing ones to preserve all filter values
      // This is needed because PatternFly DataViewFilters only passes the active filter
      // when switching between filter types, losing other filter values
      const mergedFilters = {
        ...filters.filters,
        ...newFilters,
      };

      // Debounce API calls to prevent excessive requests - pass params directly, NOT nested under 'filters'
      debouncedFetchData({
        username: mergedFilters.username,
        email: mergedFilters.email,
        status: mergedFilters.status,
        offset: 0,
      });
    },
    [filters, debouncedFetchData],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    // Use onSetFilters directly to set empty filter values
    const emptyFilters = { username: '', email: '', status: [] };
    filters.onSetFilters(emptyFilters);
    // Trigger API call immediately (no debounce for button clicks)
    fetchData({
      username: '',
      email: '',
      status: [],
      offset: 0,
    });
  }, [filters, fetchData]);

  // Bulk select handler
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
    [selection, tableRows],
  );

  // Skeleton states
  const loadingHeader = useMemo(() => <SkeletonTableHead columns={columns.map((col) => col.cell)} />, [columns]);

  const loadingBody = useMemo(() => <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />, [columns.length]);

  // Empty state component
  const emptyState = useMemo(() => <UsersListEmptyState {...emptyStateProps} />, [emptyStateProps]);

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    const selectedCount = props.initialSelectedUsers.length;
    const totalCount = users.length;

    return (
      <BulkSelect isDataPaginated={false} selectedCount={selectedCount} totalCount={totalCount} onSelect={handleBulkSelect} pageCount={totalCount} />
    );
  }, [props.initialSelectedUsers.length, users.length, handleBulkSelect]);

  // Handle selection changes - call onSelect when selection changes
  useEffect(() => {
    if (selection.selected) {
      const selectedUserIds = selection.selected.map((item: any) => item.id);
      const selectedUserObjects = users.filter((user: User) => selectedUserIds.includes(user.uuid || user.username));
      props.onSelect(selectedUserObjects);
    }
  }, [selection.selected, users, props.onSelect]);

  // Determine active state
  const activeState = isLoading ? DataViewState.loading : users.length === 0 ? DataViewState.empty : undefined;

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
              <DataViewTextFilter filterId="username" title="Username" placeholder="Filter by username" />
              <DataViewTextFilter filterId="email" title="Email" placeholder="Filter by email" />
              <DataViewCheckboxFilter
                filterId="status"
                title="Status"
                placeholder="Filter by status..."
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
              />
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
          variant={props.displayNarrow ? 'compact' : undefined}
        />
        <DataViewToolbar
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
