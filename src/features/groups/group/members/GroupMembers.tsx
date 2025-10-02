import React, { Fragment, Suspense, useCallback, useEffect, useMemo } from 'react';
import { debounce } from '../../../../utilities/debounce';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';

import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { GroupMembersEmptyState } from './components/GroupMembersEmptyState';

import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { fetchGroup, fetchGroups } from '../../../../redux/groups/actions';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';

import { getBackRoute } from '../../../../helpers/navigation';
import pathnames from '../../../../utilities/pathnames';
import messages from '../../../../Messages';
// Removed useless GroupMembersTable placeholder - using DataViewTable directly
import { MemberActionsMenu } from './components/MemberActionsMenu';
import { DefaultMembersCard } from '../../components/DefaultMembersCard';

import { useGroupMembers } from './useGroupMembers';
import type { GroupMembersFilters, Member, MemberTableRow } from './types';
import type { RBACStore } from '../../../../redux/store.d';

interface GroupMembersProps {
  // This container has no props - all data comes from Redux and URL params
}

interface SelectedItem {
  id: string;
}

// Member row actions component

const GroupMembers: React.FC<GroupMembersProps> = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Use custom hook for business logic
  const {
    members,
    isLoading,
    group,
    adminDefault,
    platformDefault,

    totalCount,
    isAdmin,
    filters,
    selection,
    hasActiveFilters,

    tableRows,
    columns,
    fetchData,
    handleRemoveMembers,
    emptyStateProps,
    pagination,
  } = useGroupMembers();

  // Additional selectors not in hook
  const groupsPagination = useSelector(
    (state: RBACStore) => state.groupReducer.groups.pagination || state.groupReducer.groups.meta || {},
    shallowEqual,
  );
  const groupsFilters = useSelector((state: RBACStore) => state.groupReducer.groups.filters || {}, shallowEqual);

  // Show default cards for admin/platform default groups
  const showDefaultCard = adminDefault || platformDefault;

  // Create skeleton loading states
  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.cell)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />;

  // Empty state component using props from hook
  const emptyState = <GroupMembersEmptyState {...emptyStateProps} />;

  // Debounced version for filter changes
  const debouncedFetchData = useMemo(() => debounce(fetchData), [fetchData]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
    };
  }, [debouncedFetchData]);

  // CRITICAL: Fix dependency bug - fetch group details on mount
  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      fetchData();
    }
  }, [groupId, dispatch, fetchData]);

  // Filter handling
  const handleFilterChange = useCallback(
    (_event: any, newFilters: GroupMembersFilters) => {
      filters.onSetFilters(newFilters);
      const usernameFilter = newFilters.name || undefined;
      debouncedFetchData(usernameFilter, { offset: 0 });
    },
    [filters, debouncedFetchData],
  );

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    filters.onSetFilters({ name: '' });
    fetchData(undefined, { offset: 0 });
  }, [filters, fetchData]);

  // Bulk selection handling using DataView selection
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

  // Pagination handlers
  const handleSetPage = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
      const offset = (newPage - 1) * pagination.perPage;
      fetchData(undefined, { offset, limit: pagination.perPage });
    },
    [fetchData, pagination.perPage],
  );

  const handlePerPageSelect = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
      fetchData(undefined, { offset: 0, limit: newPerPage });
    },
    [fetchData],
  );

  // Pagination component
  const paginationComponent = useMemo(() => {
    return (
      <Pagination
        itemCount={totalCount}
        perPage={pagination.perPage}
        page={pagination.page}
        onSetPage={handleSetPage}
        onPerPageSelect={handlePerPageSelect}
        isCompact
      />
    );
  }, [totalCount, pagination.perPage, pagination.page, handleSetPage, handlePerPageSelect]);

  // Navigation handlers
  const handleAddMembers = useCallback(() => {
    if (groupId) {
      navigate(pathnames['group-add-members'].link.replace(':groupId', groupId));
    }
  }, [navigate, groupId]);

  if (!groupId) {
    return null;
  }

  // Determine DataView active state based on loading and data
  const activeState = isLoading ? DataViewState.loading : members.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      {showDefaultCard ? (
        <DefaultMembersCard isAdminDefault={adminDefault || false} />
      ) : (
        <DataView activeState={activeState} selection={isAdmin ? selection : undefined}>
          <DataViewToolbar
            bulkSelect={
              isAdmin ? (
                <BulkSelect
                  isDataPaginated
                  pageCount={tableRows.length}
                  selectedCount={selection.selected?.length || 0}
                  totalCount={totalCount}
                  onSelect={handleBulkSelect}
                />
              ) : undefined
            }
            pagination={paginationComponent}
            filters={
              <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
                <DataViewTextFilter
                  filterId="name"
                  title={intl.formatMessage(messages.username)}
                  placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.username).toLowerCase() })}
                />
              </DataViewFilters>
            }
            clearAllFilters={hasActiveFilters ? handleClearAllFilters : undefined}
            actions={
              isAdmin ? (
                <>
                  <Button variant="primary" onClick={handleAddMembers}>
                    {intl.formatMessage(messages.addMember)}
                  </Button>
                  {selection.selected.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const selectedMembers = selection.selected
                          .map((item: any) => {
                            const tableRow = tableRows.find((row) => row.id === item.id);
                            return tableRow?.member;
                          })
                          .filter((member: any): member is Member => member !== undefined);
                        handleRemoveMembers(selectedMembers);
                      }}
                    >
                      {intl.formatMessage(messages.remove)} ({selection.selected.length})
                    </Button>
                  )}
                  <MemberActionsMenu
                    selectedRows={selection.selected.map((item: SelectedItem): MemberTableRow => {
                      // Find the corresponding table row and member data
                      const tableRow = tableRows.find((row) => row.id === item.id);
                      return (
                        tableRow || {
                          id: item.id,
                          row: [],
                          member: {
                            username: item.id,
                            email: '',
                            first_name: '',
                            last_name: '',
                            is_active: true,
                          },
                        }
                      );
                    })}
                    onRemoveMembers={handleRemoveMembers}
                  />
                </>
              ) : undefined
            }
          />

          <DataViewTable
            aria-label="Group members table"
            columns={columns}
            rows={tableRows}
            headStates={{
              loading: loadingHeader,
            }}
            bodyStates={{
              loading: loadingBody,
              empty: emptyState,
            }}
          />
          <DataViewToolbar pagination={paginationComponent} />
        </DataView>
      )}

      <Suspense>
        <Outlet
          context={{
            [pathnames['group-members-edit-group'].path]: {
              group,
              cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
              submitRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId), // Stay on members tab after edit
            },
            [pathnames['group-members-remove-group'].path]: {
              postMethod: () => dispatch(fetchGroups({ ...groupsPagination, offset: 0, filters: groupsFilters, usesMetaInURL: true })),
              cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
              submitRoute: getBackRoute(
                pathnames.groups.link,
                { ...groupsPagination, offset: 0, limit: (groupsPagination as any)?.limit || 20 },
                groupsFilters,
              ),
              groupsUuid: [group],
            },
            [pathnames['group-add-members'].path]: {
              fetchData: () => fetchData(),
              cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

// Named export for stories and tests
export { GroupMembers };

// Default export for routing
export default GroupMembers;
