/**
 * Groups Page
 *
 * Displays a list of groups using the TableView component.
 * All table state (pagination, sorting, filtering, selection, expansion)
 * is managed by useTableState with URL synchronization.
 *
 * Data fetching is handled by React Query. Mutations automatically
 * invalidate the cache, so no manual refresh is needed.
 */

import React, { Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';

// PatternFly imports
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

// Red Hat components
import Section from '@redhat-cloud-services/frontend-components/Section';
import { usePlatformTracking } from '../../hooks/usePlatformTracking';

// Internal components
import { PageLayout } from '../../components/layout/PageLayout';
import { TableView, useTableState } from '../../components/table-view';
import { ActionDropdown } from '../../components/ActionDropdown';
import { GroupsEmptyState } from './components/GroupsEmptyState';
import { AppLink } from '../../components/navigation/AppLink';

// Hooks
import { useAppLink } from '../../hooks/useAppLink';
import {
  type CompoundColumnId,
  type SortableColumnId,
  columns,
  compoundColumns,
  sortableColumns,
  useGroupsTableConfig,
} from './useGroupsTableConfig';

// React Query
import { useAdminGroupQuery, useGroupsQuery } from '../../data/queries/groups';

// Helpers and utilities
import { getBackRoute } from '../../helpers/navigation';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import type { Group } from './types';

// =============================================================================
// Groups Component
// =============================================================================

export const Groups: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { trackNavigation } = usePlatformTracking();
  const toAppLink = useAppLink();

  // Permissions
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Local state for route management
  const [removeGroupsList, setRemoveGroupsList] = useState<Group[]>([]);

  // Extract table configuration using hook
  const { columnConfig, cellRenderers, expansionRenderers, filterConfig, isCellExpandable } = useGroupsTableConfig({
    intl,
    toAppLink,
  });

  // Use the table state hook - handles pagination, sort, filters, selection, expansion with URL sync
  const tableState = useTableState<typeof columns, Group, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns,
    compoundColumns,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: isAdmin ? 20 : 10,
    getRowId: (group) => group.uuid,
    isRowSelectable: (group) => !group.platform_default && !group.admin_default,
    syncWithUrl: true,
  });

  // Fetch groups via React Query
  const nameFilter = typeof tableState.filters.name === 'string' ? tableState.filters.name : '';
  const { data: groupsData, isLoading } = useGroupsQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    orderBy: tableState.apiParams.orderBy,
    name: nameFilter || undefined,
  });

  // Fetch admin group for merging
  const { data: adminGroup } = useAdminGroupQuery();

  // Fetch system default group
  const { data: systemGroupData } = useGroupsQuery({ platformDefault: true, limit: 1 });
  const systemGroup = systemGroupData?.data?.[0];

  // Merge default groups with regular groups
  // Map API GroupOut to local Group type (ensure boolean fields are not undefined)
  const groups = useMemo(() => {
    type ApiGroup = NonNullable<NonNullable<typeof groupsData>['data']>[number];

    const mapToGroup = (g: ApiGroup): Group => ({
      ...g,
      uuid: g.uuid,
      name: g.name,
      description: g.description,
      platform_default: g.platform_default ?? false,
      system: g.system ?? false,
      admin_default: g.admin_default ?? false,
      principalCount: g.principalCount,
      roleCount: g.roleCount,
    });

    const regularGroups: Group[] = (groupsData?.data ?? []).map(mapToGroup);
    const merged: Group[] = [...regularGroups];

    // Add admin group if it matches the filter (or no filter)
    if (adminGroup && (!nameFilter || adminGroup.name.toLowerCase().includes(nameFilter.toLowerCase()))) {
      if (!merged.find((g) => g.uuid === adminGroup.uuid)) {
        merged.unshift(mapToGroup(adminGroup as ApiGroup));
      }
    }

    // Add system group if it matches the filter (or no filter)
    if (systemGroup && (!nameFilter || systemGroup.name.toLowerCase().includes(nameFilter.toLowerCase()))) {
      if (!merged.find((g) => g.uuid === systemGroup.uuid)) {
        merged.unshift(mapToGroup(systemGroup as ApiGroup));
      }
    }

    return merged;
  }, [groupsData?.data, adminGroup, systemGroup, nameFilter]);

  // Total count from query response
  const totalCount = groupsData?.meta?.count ?? 0;

  // Transform data for display (default groups show "All" for member count)
  const data = useMemo(
    () =>
      groups.map((group: Group) =>
        group.platform_default || group.admin_default ? { ...group, principalCount: `All${group.admin_default ? ' org admins' : ''}` } : group,
      ),
    [groups],
  );

  // Computed values for route management
  const removingAllRows = totalCount === removeGroupsList.length;
  const filters = { name: tableState.filters.name || '' };

  // Chrome nav on mount
  useEffect(() => {
    trackNavigation('groups', true);
  }, [trackNavigation]);

  // =============================================================================
  // Action Handlers
  // =============================================================================

  const handleEdit = useCallback(
    (groupId: string) => {
      navigate(toAppLink(pathnames['edit-group'].link(groupId)));
    },
    [navigate, toAppLink],
  );

  const handleDelete = useCallback(
    (groupsToDelete: Group[]) => {
      setRemoveGroupsList(groupsToDelete);
      const groupIds = groupsToDelete.map(({ uuid }) => uuid);
      navigate(toAppLink(pathnames['remove-group'].link(groupIds.join(','))));
      tableState.clearSelection();
    },
    [navigate, toAppLink, tableState],
  );

  // =============================================================================
  // Toolbar Content
  // =============================================================================

  const toolbarActions = isAdmin ? (
    <AppLink to={pathnames['add-group'].link()}>
      <Button ouiaId="create-group-button" variant="primary">
        {intl.formatMessage(messages.createGroup)}
      </Button>
    </AppLink>
  ) : undefined;

  const bulkActions =
    isAdmin && tableState.selectedRows.length > 0 ? (
      <ActionDropdown
        ariaLabel="bulk actions"
        ouiaId="groups-bulk-actions"
        items={[
          {
            key: 'edit',
            label: intl.formatMessage(messages.edit),
            onClick: () => handleEdit(tableState.selectedRows[0].uuid),
            isDisabled: tableState.selectedRows.length !== 1,
          },
          {
            key: 'delete',
            label: intl.formatMessage(messages.delete),
            onClick: () => handleDelete(tableState.selectedRows),
          },
        ]}
      />
    ) : undefined;

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <PageLayout title={{ title: intl.formatMessage(messages.groups) }}>
      <Section type="content" id="tab-groups">
        <TableView<typeof columns, Group, SortableColumnId, CompoundColumnId>
          // Columns
          columns={columns}
          columnConfig={columnConfig}
          sortableColumns={sortableColumns}
          // Data
          data={isLoading ? undefined : data}
          totalCount={totalCount}
          getRowId={(group) => group.uuid}
          // Renderers
          cellRenderers={cellRenderers}
          expansionRenderers={expansionRenderers}
          // Selection
          selectable={isAdmin}
          isRowSelectable={(group) => !group.platform_default && !group.admin_default}
          // Expansion - components fetch their own data via React Query
          isCellExpandable={isCellExpandable}
          // Row actions
          renderActions={
            isAdmin
              ? (group) =>
                  !group.platform_default && !group.admin_default ? (
                    <ActionDropdown
                      ariaLabel={`${group.name} actions`}
                      ouiaId={`group-${group.uuid}-actions`}
                      items={[
                        { key: 'edit', label: intl.formatMessage(messages.edit), onClick: () => handleEdit(group.uuid) },
                        { key: 'delete', label: intl.formatMessage(messages.delete), onClick: () => handleDelete([group]) },
                      ]}
                    />
                  ) : null
              : undefined
          }
          // Filtering
          filterConfig={filterConfig}
          // Toolbar
          toolbarActions={toolbarActions}
          bulkActions={bulkActions}
          // Empty states
          emptyStateNoData={
            <GroupsEmptyState
              hasActiveFilters={false}
              titleText={`Configure ${intl.formatMessage(messages.groups).toLowerCase()}`}
              isAdmin={isAdmin}
            />
          }
          emptyStateNoResults={
            <GroupsEmptyState
              hasActiveFilters={true}
              titleText={`Configure ${intl.formatMessage(messages.groups).toLowerCase()}`}
              isAdmin={isAdmin}
            />
          }
          // Config
          variant="default"
          ouiaId="groups-table"
          ariaLabel={intl.formatMessage(messages.groups)}
          // Spread all state from hook
          {...tableState}
        />

        <Suspense fallback={<div>Loading...</div>}>
          <Outlet
            context={{
              pagination: { limit: tableState.apiParams.limit, offset: tableState.apiParams.offset },
              filters,
              [pathnames['add-group'].path]: {
                orderBy: tableState.apiParams.orderBy,
                // Mutations invalidate cache automatically, no postMethod needed
              },
              [pathnames['edit-group'].path]: {
                cancelRoute: getBackRoute(pathnames['groups'].link(), tableState.apiParams, filters),
                submitRoute: getBackRoute(pathnames['groups'].link(), { ...tableState.apiParams, offset: 0 }, filters),
                // Mutations invalidate cache automatically, no postMethod needed
              },
              [pathnames['remove-group'].path]: {
                cancelRoute: getBackRoute(pathnames['groups'].link(), tableState.apiParams, filters),
                submitRoute: getBackRoute(pathnames['groups'].link(), { ...tableState.apiParams, offset: 0 }, removingAllRows ? {} : filters),
                // Mutations invalidate cache automatically, no postMethod needed
              },
            }}
          />
        </Suspense>
      </Section>
    </PageLayout>
  );
};

export default Groups;
