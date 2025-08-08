import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useIntl } from 'react-intl';
import PermissionsContext from '../../utilities/permissionsContext';
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTextFilter, useDataViewFilters } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import useAppNavigate from '../../hooks/useAppNavigate';
import { fetchAdminGroup, fetchGroups, fetchMembersForExpandedGroup, fetchRolesForExpandedGroup, fetchSystemGroup } from '../../redux/groups/actions';
import { ListGroupsOrderByEnum } from '@redhat-cloud-services/rbac-client/ListGroups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { defaultSettings } from '../../helpers/pagination';
import { getBackRoute } from '../../helpers/navigation';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import { GroupsTable } from './components/GroupsTable';
import { GroupActionsMenu } from './components/GroupActionsMenu';

import type { ExpandedCells, Group, SortByState } from './types';
import type { RBACStore } from '../../redux/store.d';

interface GroupsProps {
  // This container has no props - all data comes from Redux
}

export const Groups: React.FC<GroupsProps> = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  // Get permissions from context (not Redux)
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);

  // DataView filters for consistent filter management
  const filters = useDataViewFilters({
    initialFilters: {
      name: '',
    },
  });

  // Calculate admin status from permissions context
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Local state for table functionality
  const [sortByState, setSortByState] = useState<SortByState>({
    index: isAdmin ? 1 : 0, // Account for selection column when admin
    direction: 'asc',
  });
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [expandedCells, setExpandedCells] = useState<ExpandedCells>({});

  // Redux selectors - business logic only, no UI components
  const { regularGroups, pagination, isLoading, adminGroup, systemGroup } = useSelector(
    ({
      groupReducer: {
        groups: { data, pagination },
        isLoading,
        adminGroup,
        systemGroup,
      },
    }: RBACStore) => ({
      regularGroups: data?.filter(({ platform_default, admin_default }: Group) => !(platform_default || admin_default)) || [],
      adminGroup,
      systemGroup,
      pagination: {
        ...defaultSettings,
        ...pagination,
      },
      isLoading,
    }),
    shallowEqual,
  );

  // Combine groups based on admin status and filtering
  const groups = useMemo(() => {
    const nameFilter = filters.filters.name || '';
    const nameRegex = new RegExp(nameFilter, 'i');

    return [
      // Only include default groups for admin users and if they match the filter
      ...(isAdmin && adminGroup?.name?.match(nameRegex) ? [adminGroup] : []),
      ...(isAdmin && systemGroup?.name?.match(nameRegex) ? [systemGroup] : []),
      // Always include regular (non-default) groups
      ...regularGroups,
    ];
  }, [isAdmin, adminGroup, systemGroup, regularGroups, filters.filters.name]);

  // Sorting and filtering logic
  const orderBy = useMemo(() => {
    const columns = [{ key: 'name' }, { key: 'roles' }, { key: 'members' }, { key: 'modified' }];

    // Account for selection column offset when admin
    const columnIndex = (sortByState?.index || 0) - Number(isAdmin);
    const columnKey = columns[columnIndex]?.key || 'name';

    return `${sortByState?.direction === 'desc' ? '-' : ''}${columnKey}` as ListGroupsOrderByEnum;
  }, [sortByState, isAdmin]);

  const fetchData = useCallback(
    (apiProps: Record<string, any>) => {
      const { name } = filters.filters;

      dispatch(
        fetchGroups({
          ...defaultSettings,
          ...apiProps,
          // Use provided orderBy or fall back to current state
          orderBy: apiProps.orderBy || orderBy,
          filters: { name },
          // Explicitly exclude default groups from main API call
          platformDefault: false,
          adminDefault: false,
          usesMetaInURL: true,
        }),
      );
    },
    [dispatch, orderBy, filters.filters],
  );

  // Debounced version for filter changes
  const debouncedFetchData = useMemo(() => debounce(fetchData, 500), [fetchData]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
    };
  }, [debouncedFetchData]);

  // Initial data fetch and refetch on changes
  useEffect(() => {
    fetchData({});

    // Only fetch default groups for admin users (copied from legacy component)
    if (isAdmin) {
      const { name } = filters.filters;
      dispatch(fetchAdminGroup({ filterValue: name }));
      dispatch(fetchSystemGroup({ filterValue: name }));
    }
  }, [fetchData, isAdmin, dispatch, filters.filters]);

  // Filter handling
  const handleFilterChange = useCallback(
    (_event: any, newFilters: any) => {
      filters.onSetFilters(newFilters);
      debouncedFetchData({});
    },
    [filters, debouncedFetchData],
  );

  const handleClearAllFilters = useCallback(() => {
    filters.clearAllFilters();
    debouncedFetchData({});
  }, [filters, debouncedFetchData]);

  // Row selection logic (business logic only)
  const handleRowSelection = useCallback((newSelection: any[]) => {
    // Filter out default groups from selection
    const filteredSelection = newSelection.filter(({ platform_default, admin_default }: any) => !(platform_default || admin_default));
    setSelectedRows(filteredSelection.map(({ uuid, name }: any) => ({ uuid, name })));
  }, []);

  // Expansion logic
  const handleExpansion = useCallback(
    (groupId: string, columnKey: string, isExpanding: boolean) => {
      const newExpandedCells: ExpandedCells = { ...expandedCells };

      if (isExpanding) {
        newExpandedCells[groupId] = columnKey;

        // Fetch expanded data based on column
        if (columnKey === 'roles') {
          dispatch(fetchRolesForExpandedGroup(groupId, { limit: 100 }));
        } else if (columnKey === 'members') {
          dispatch(fetchMembersForExpandedGroup(groupId, undefined, { limit: 100 }));
        }
      } else {
        delete newExpandedCells[groupId];
      }

      setExpandedCells(newExpandedCells);
    },
    [dispatch, expandedCells],
  );

  // Sorting logic
  const handleSort = useCallback(
    (_event: any, index: number, direction: 'asc' | 'desc') => {
      const columns = [{ key: 'name' }, { key: 'roles' }, { key: 'members' }, { key: 'modified' }];

      // Account for selection column offset when admin
      const columnIndex = index - Number(isAdmin);
      const columnKey = columns[columnIndex]?.key;

      if (columnKey) {
        const newOrderBy = `${direction === 'desc' ? '-' : ''}${columnKey}` as ListGroupsOrderByEnum;
        setSortByState({ index, direction });

        // Trigger new API call with updated sorting
        fetchData({ orderBy: newOrderBy });
      }
    },
    [isAdmin, fetchData],
  );

  // Navigation actions (business logic only)
  const handleCreateGroup = useCallback(() => {
    navigate('/groups/add-group');
  }, [navigate]);

  const handleEditGroup = useCallback(
    (groupId: string) => {
      navigate(`/groups/edit/${groupId}`);
    },
    [navigate],
  );

  const handleDeleteGroups = useCallback(
    (groupIds: string[]) => {
      navigate(`/groups/remove-group/${groupIds.join(',')}`);
    },
    [navigate],
  );

  // Bulk select logic
  const selectableGroups = groups.filter((group) => !group.platform_default && !group.admin_default);

  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        handleRowSelection([]);
      } else if (value === BulkSelectValue.page) {
        handleRowSelection(selectableGroups);
      } else if (value === BulkSelectValue.nonePage) {
        handleRowSelection([]);
      }
    },
    [selectableGroups, handleRowSelection],
  );

  // DataView state management
  const hasActiveFilters = filters.filters.name?.length > 0;
  const activeState = isLoading ? DataViewState.loading : groups.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      <DataView activeState={activeState}>
        <DataViewToolbar
          bulkSelect={
            isAdmin ? (
              <BulkSelect
                isDataPaginated
                pageCount={selectableGroups.length}
                selectedCount={selectedRows.length}
                totalCount={pagination.count || 0}
                onSelect={handleBulkSelect}
              />
            ) : undefined
          }
          filters={
            <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
              <DataViewTextFilter
                filterId="name"
                title={intl.formatMessage(messages.name)}
                placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.name).toLowerCase() })}
              />
            </DataViewFilters>
          }
          clearAllFilters={hasActiveFilters ? handleClearAllFilters : undefined}
          actions={
            isAdmin ? (
              <GroupActionsMenu
                selectedRows={selectedRows}
                onCreateGroup={handleCreateGroup}
                onEditGroup={handleEditGroup}
                onDeleteGroups={handleDeleteGroups}
                onSelect={() => {}}
              />
            ) : undefined
          }
        />

        <GroupsTable
          groups={groups}
          isLoading={isLoading}
          isAdmin={isAdmin}
          selectedRows={selectedRows}
          expandedCells={expandedCells}
          setExpandedCells={setExpandedCells}
          sortByState={sortByState}
          hasActiveFilters={hasActiveFilters}
          onRowSelection={handleRowSelection}
          onExpansion={handleExpansion}
          onSort={handleSort}
          onEditGroup={handleEditGroup}
          onDeleteGroups={handleDeleteGroups}
        />
      </DataView>

      <Suspense>
        <Outlet
          context={{
            pagination,
            filters: filters.filters,
            [pathnames['add-group'].path]: {
              orderBy,
              postMethod: (config: any) => {
                filters.onSetFilters({ name: '' });
                fetchData(config);
              },
            },
            [pathnames['edit-group'].path]: {
              postMethod: (config: any) => {
                filters.onSetFilters({ name: '' });
                fetchData({ ...config, orderBy });
              },
              cancelRoute: getBackRoute(pathnames['groups'].link, pagination, filters.filters),
              submitRoute: getBackRoute(pathnames['groups'].link, { ...pagination, offset: 0 }, filters.filters),
            },
            [pathnames['remove-group'].path]: {
              postMethod: (ids: string[], config: any) => {
                const removingAllRows = pagination.count === ids.length;
                fetchData({
                  ...config,
                  filters: { name: removingAllRows ? '' : filters.filters.name || '' },
                  orderBy,
                });
                if (removingAllRows) {
                  filters.onSetFilters({ name: '' });
                }
                setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
              },
              cancelRoute: getBackRoute(pathnames['groups'].link, pagination, filters.filters),
              submitRoute: getBackRoute(
                pathnames['groups'].link,
                { ...pagination, offset: 0 },
                pagination.count === selectedRows.length ? {} : filters.filters,
              ),
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

// Default export for routing
export default Groups;
