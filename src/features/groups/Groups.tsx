/**
 * Groups Page
 *
 * Displays a list of groups using the TableView component.
 * All table state (pagination, sorting, filtering, selection, expansion)
 * is managed by useTableState with URL synchronization.
 */

import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

// PatternFly imports
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';

// Red Hat components
import Section from '@redhat-cloud-services/frontend-components/Section';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

// Internal components
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { TableView, useTableState } from '../../components/table-view';
import { ActionDropdown } from '../../components/ActionDropdown';
import { GroupsEmptyState } from './components/GroupsEmptyState';

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
import { useGroupsFetcher } from './useGroupsFetcher';
import { useGroupsMutationRefresh } from './useGroupsMutationRefresh';

// Redux
import { fetchMembersForExpandedGroup, fetchRolesForExpandedGroup } from '../../redux/groups/actions';
import { selectGroupsPagination, selectIsGroupsLoading, selectMergedGroupsWithDefaults } from '../../redux/groups/selectors';

// Helpers and utilities
import { getBackRoute } from '../../helpers/navigation';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import type { Group } from './types';

import './Groups.scss';

// =============================================================================
// Groups Component
// =============================================================================

export const Groups: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chrome = useChrome();
  const toAppLink = useAppLink();

  // Permissions
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Redux state
  const groups = useSelector(selectMergedGroupsWithDefaults);
  const pagination = useSelector(selectGroupsPagination);
  const isLoading = useSelector(selectIsGroupsLoading);

  // Local state for route management
  const [removeGroupsList, setRemoveGroupsList] = useState<Group[]>([]);

  // Extract table configuration using hook
  const { columnConfig, cellRenderers, expansionRenderers, filterConfig, isCellExpandable } = useGroupsTableConfig({
    intl,
    toAppLink,
  });

  // Data fetching using hook
  const fetchData = useGroupsFetcher();

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
    onStaleData: fetchData,
  });

  // Mutation refresh helper
  const refreshAfterMutation = useGroupsMutationRefresh(tableState, fetchData);

  // Total count from Redux pagination
  const totalCount = pagination?.count ?? 0;

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
    chrome.appNavClick({ id: 'groups', secondaryNav: true });
  }, [chrome]);

  // Handle expansion - fetch data for expanded row
  const handleExpand = useCallback(
    (group: Group, column: CompoundColumnId) => {
      if (column === 'roles') {
        dispatch(fetchRolesForExpandedGroup(group.uuid, { limit: 100 }) as any);
      } else if (column === 'members') {
        dispatch(fetchMembersForExpandedGroup(group.uuid, undefined, { limit: 100 }) as any);
      }
    },
    [dispatch],
  );

  // =============================================================================
  // Action Handlers
  // =============================================================================

  const handleEdit = useCallback(
    (groupId: string) => {
      const editPath = (pathnames['edit-group'].link as string).replace(':groupId', groupId);
      navigate(toAppLink(editPath));
    },
    [navigate, toAppLink],
  );

  const handleDelete = useCallback(
    (groupsToDelete: Group[]) => {
      setRemoveGroupsList(groupsToDelete);
      const groupIds = groupsToDelete.map(({ uuid }) => uuid);
      const removePath = (pathnames['remove-group'].link as string).replace(':groupId', groupIds.join(','));
      navigate(toAppLink(removePath));
      tableState.clearSelection();
    },
    [navigate, toAppLink, tableState],
  );

  // =============================================================================
  // Toolbar Content
  // =============================================================================

  const toolbarActions = isAdmin ? (
    <Link to={toAppLink(pathnames['add-group'].link)}>
      <Button ouiaId="create-group-button" variant="primary">
        {intl.formatMessage(messages.createGroup)}
      </Button>
    </Link>
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
    <Fragment>
      <Stack className="rbac-c-groups">
        <StackItem>
          <PageLayout>
            <PageTitle title={intl.formatMessage(messages.groups)} />
          </PageLayout>
        </StackItem>
        <StackItem>
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
              // Expansion
              isCellExpandable={isCellExpandable}
              onExpand={handleExpand}
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
                    postMethod: () => refreshAfterMutation({ clearFilters: true }),
                  },
                  [pathnames['edit-group'].path]: {
                    postMethod: () => refreshAfterMutation({ clearFilters: true }),
                    cancelRoute: getBackRoute(pathnames['groups'].link, tableState.apiParams, filters),
                    submitRoute: getBackRoute(pathnames['groups'].link, { ...tableState.apiParams, offset: 0 }, filters),
                  },
                  [pathnames['remove-group'].path]: {
                    postMethod: (ids: string[]) =>
                      refreshAfterMutation({
                        clearFilters: removingAllRows,
                        resetPage: true,
                        removedIds: ids,
                      }),
                    cancelRoute: getBackRoute(pathnames['groups'].link, tableState.apiParams, filters),
                    submitRoute: getBackRoute(pathnames['groups'].link, { ...tableState.apiParams, offset: 0 }, removingAllRows ? {} : filters),
                  },
                }}
              />
            </Suspense>
          </Section>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

export default Groups;
