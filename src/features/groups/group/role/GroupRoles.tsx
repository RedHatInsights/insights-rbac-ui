import React, { Fragment, Suspense, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import Section from '@redhat-cloud-services/frontend-components/Section';

// DataView imports
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';

// Component imports
import { GroupRolesEmptyState } from './components/GroupRolesEmptyState';
import { useGroupRoles } from './hooks/useGroupRoles';
import { fetchAddRolesForGroup } from '../../../../redux/groups/actions';
import { getBackRoute } from '../../../../helpers/navigation';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import type { GroupRolesProps } from './types';
import './group-roles.scss';

export const GroupRoles: React.FC<GroupRolesProps> = (props) => {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Use custom hook for ALL business logic
  const {
    roles,
    isLoading,
    filters,
    selection,
    tableRows,
    columns,
    hasActiveFilters,
    hasPermissions,
    isPlatformDefault,
    isAdminDefault,
    pagination,
    fetchData,
    emptyStateProps,
    toolbarButtons,
    group,
  } = useGroupRoles(props);

  // Filter change handler
  const handleFilterChange = useCallback(
    (key: string, newValues: Partial<{ name: string }>) => {
      const newFilters = { ...filters.filters, ...newValues };
      filters.onSetFilters(newFilters);
      fetchData({ name: newFilters.name, offset: 0 });
    },
    [filters, fetchData],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    filters.onSetFilters({ name: '' });
    fetchData({ offset: 0 });
  }, [filters, fetchData]);

  // Bulk select handler
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        selection.onSelect(false);
      } else if (value === BulkSelectValue.page) {
        // Use tableRows for bulk selection - this matches individual selection format
        selection.onSelect(true, tableRows);
      } else if (value === BulkSelectValue.nonePage) {
        selection.onSelect(false);
      }
    },
    [selection, tableRows],
  );

  // Skeleton states
  const loadingHeader = useMemo(() => <SkeletonTableHead columns={columns.map((col) => col.cell)} />, [columns]);

  const loadingBody = useMemo(() => <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />, [columns.length]);

  // Empty state component
  const emptyState = useMemo(() => <GroupRolesEmptyState {...emptyStateProps} />, [emptyStateProps]);

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    if (!hasPermissions || isAdminDefault) {
      return undefined;
    }

    const selectedCount = selection.selected?.length || 0;
    const totalCount = roles.length;

    return (
      <BulkSelect isDataPaginated={false} selectedCount={selectedCount} totalCount={totalCount} onSelect={handleBulkSelect} pageCount={totalCount} />
    );
  }, [hasPermissions, isAdminDefault, selection.selected?.length, roles.length, handleBulkSelect]);

  // Toolbar actions - use the buttons directly from the hook
  const toolbarActions = useMemo(() => {
    if (!hasPermissions || isAdminDefault) {
      return undefined;
    }
    return toolbarButtons;
  }, [hasPermissions, isAdminDefault, toolbarButtons]);

  // Determine active state
  const activeState = isLoading ? DataViewState.loading : roles.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      <Section type="content" id="tab-roles">
        <DataView activeState={activeState} selection={hasPermissions && !isAdminDefault ? selection : undefined}>
          <DataViewToolbar
            bulkSelect={bulkSelectComponent}
            filters={
              <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
                <DataViewTextFilter filterId="name" title="Name" placeholder="Filter by name" />
              </DataViewFilters>
            }
            clearAllFilters={hasActiveFilters ? clearAllFilters : undefined}
            actions={toolbarActions}
          />
          <DataViewTable
            columns={columns}
            rows={tableRows}
            headStates={{ loading: loadingHeader }}
            bodyStates={{
              loading: loadingBody,
              empty: emptyState,
            }}
          />
        </DataView>
      </Section>

      {!isPlatformDefault ? (
        <Suspense>
          <Outlet
            context={{
              [pathnames['group-add-roles'].path]: {
                postMethod: (promise: Promise<unknown>) => {
                  navigate(pathnames['group-detail-roles'].link.replace(':groupId', groupId!));
                  if (promise) {
                    promise.then(() => {
                      dispatch(fetchAddRolesForGroup(groupId!, { limit: 20, offset: 0 }));
                      fetchData();
                    });
                  }
                },
              },
              [pathnames['group-roles-edit-group'].path]: {
                group,
                cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId!),
                submitRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId!), // Stay on roles tab after edit
              },
              [pathnames['group-roles-remove-group'].path]: {
                postMethod: (promise: Promise<unknown>) => {
                  const backRoute = getBackRoute(pathnames['group-detail-roles'].link.replace(':groupId', groupId!), pagination, {});
                  navigate(backRoute);
                  if (promise) {
                    promise.then(() => {
                      dispatch(fetchAddRolesForGroup(groupId!, { limit: 20, offset: 0 }));
                      fetchData();
                    });
                  }
                },
                // Add cancelRoute so cancel button takes user back to group roles tab
                cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId!),
                // Add submitRoute for consistent navigation after successful removal
                submitRoute: getBackRoute(pathnames.groups.link, { ...pagination, offset: 0 }, {}),
              },
            }}
          />
        </Suspense>
      ) : null}
    </Fragment>
  );
};

export default GroupRoles;
