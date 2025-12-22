import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { ResponsiveAction, ResponsiveActions } from '@patternfly/react-component-groups';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView } from '../../../../../components/table-view';
import { ActionDropdown } from '../../../../../components/ActionDropdown';
import type { Group } from '../../../../../redux/groups/reducer';
import messages from '../../../../../Messages';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import pathnames from '../../../../../utilities/pathnames';
import { type SortableColumnId, columns, sortableColumns, useUserGroupsTableConfig } from './useUserGroupsTableConfig';

// =============================================================================
// Selection Helpers - Isolate DataView legacy { id, row } shape conversion
// =============================================================================
const toDataViewRow = (group: Group) => ({ id: group.uuid, row: [group.name] });
const toDataViewRows = (groups: Group[]) => groups.map(toDataViewRow);
const buildGroupIndex = (groups: Group[]) => new Map(groups.map((g) => [g.uuid, g]));

interface UserGroupsTableProps {
  // Data props
  groups: Group[];
  totalCount: number;
  isLoading: boolean;
  focusedGroup?: Group;

  // UI configuration props
  defaultPerPage?: number;
  enableActions?: boolean;
  orgAdmin?: boolean;
  isProd?: boolean;
  ouiaId?: string;

  // Data view state props - managed by container
  sortBy?: string;
  direction?: 'asc' | 'desc';
  onSort: (event: any, key: string, direction: 'asc' | 'desc') => void;
  filters: { name: string };
  onSetFilters: (filters: Partial<{ name: string }>) => void;
  clearAllFilters: () => void;
  page: number;
  perPage: number;
  onSetPage: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => void;
  onPerPageSelect: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, perPage: number) => void;
  pagination: any; // DataViewPagination hook return type

  // Selection object from useDataViewSelection hook
  selection?: any; // DataView selection object

  // Event handler props
  onRowClick?: (group: Group | undefined) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (group: Group) => void;

  // Children for modals
  children?: React.ReactNode;
}

export const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  focusedGroup,

  enableActions = true,
  orgAdmin = true,
  isProd = false,
  ouiaId = 'iam-user-groups-table',
  sortBy,
  direction,
  onSort,
  filters,
  onSetFilters,
  clearAllFilters,
  page,
  perPage,
  onSetPage,
  onPerPageSelect,

  selection,
  onRowClick,
  onEditGroup,
  onDeleteGroup,
  children,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();

  // Table configuration from hook
  const { columnConfig, cellRenderers, filterConfig } = useUserGroupsTableConfig({ intl });

  // Permission flag for modifying groups
  const canModifyGroups = enableActions && orgAdmin;

  // Adapt sort state for TableView
  const sort = useMemo(
    () =>
      sortBy
        ? {
            column: sortBy as SortableColumnId,
            direction: (direction || 'asc') as 'asc' | 'desc',
          }
        : undefined,
    [sortBy, direction],
  );

  // Adapt sort handler for TableView
  const handleSortChange = useCallback(
    (column: SortableColumnId) => {
      const newDirection = sortBy === column && direction === 'asc' ? 'desc' : 'asc';
      onSort(undefined, column, newDirection);
    },
    [sortBy, direction, onSort],
  );

  // Adapt pagination handlers for TableView
  const handlePageChange = useCallback(
    (newPage: number) => {
      onSetPage(undefined as any, newPage);
    },
    [onSetPage],
  );

  const handlePerPageChange = useCallback(
    (newPerPage: number) => {
      onPerPageSelect(undefined as any, newPerPage);
    },
    [onPerPageSelect],
  );

  // Adapt filter handlers for TableView
  const handleFiltersChange = useCallback(
    (newFilters: Record<string, string | string[]>) => {
      onSetFilters({ name: (newFilters.name as string) || '' });
    },
    [onSetFilters],
  );

  // Build group index for O(1) lookups
  const groupIndex = useMemo(() => buildGroupIndex(groups), [groups]);

  // Adapt selection for TableView - convert DataView shape to Group[]
  const selectedRows = useMemo(() => {
    if (!selection?.selected) return [];
    return selection.selected.map((sel: { id: string }) => groupIndex.get(sel.id)).filter((g: Group | undefined): g is Group => !!g);
  }, [selection?.selected, groupIndex]);

  const handleSelectRow = useCallback(
    (group: Group, selected: boolean) => {
      if (!selection?.onSelect) return;
      selection.onSelect(selected, [toDataViewRow(group)]);
    },
    [selection],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: Group[]) => {
      if (!selection?.onSelect) return;
      selection.onSelect(selected, toDataViewRows(rows));
    },
    [selection],
  );

  // Check if group can be edited
  const isGroupEditable = useCallback((group: Group) => !group.platform_default && !group.system, []);

  // Check if group can be deleted
  const isGroupDeletable = useCallback((group: Group) => !group.platform_default && !group.system && orgAdmin && !isProd, [orgAdmin, isProd]);

  // Row click handler
  const handleRowClick = useCallback(
    (group: Group) => {
      if (onRowClick) {
        // Toggle focus - if clicking focused group, unfocus it
        onRowClick(focusedGroup?.uuid === group.uuid ? undefined : group);
      }
    },
    [onRowClick, focusedGroup],
  );

  // Toolbar actions
  const toolbarActions = useMemo(
    () => (
      <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-actions-dropdown`}>
        <ResponsiveAction ouiaId="add-usergroup-button" isPinned onClick={() => navigate(pathnames['users-and-user-groups-create-group'].link)}>
          {intl.formatMessage(messages.createUserGroup)}
        </ResponsiveAction>
      </ResponsiveActions>
    ),
    [intl, navigate, ouiaId],
  );

  // Transform filters for TableView
  const tableFilters = useMemo(() => ({ name: filters.name || '' }), [filters.name]);

  return (
    <>
      <TableView<typeof columns, Group, SortableColumnId>
        // Columns
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        // Data
        data={isLoading ? undefined : groups}
        totalCount={totalCount}
        getRowId={(group) => group.uuid}
        // Renderers
        cellRenderers={cellRenderers}
        // Selection
        selectable={canModifyGroups && !!selection}
        isRowSelectable={() => true}
        // Row click
        isRowClickable={() => !!onRowClick}
        onRowClick={handleRowClick}
        // Row actions
        renderActions={
          enableActions
            ? (group) => (
                <ActionDropdown
                  ariaLabel={`Actions for group ${group.name}`}
                  ouiaId={`${ouiaId}-${group.uuid}-actions`}
                  items={[
                    {
                      key: 'edit',
                      label: intl.formatMessage(messages['usersAndUserGroupsEditUserGroup']),
                      onClick: () => onEditGroup?.(group),
                      isDisabled: !isGroupEditable(group),
                    },
                    {
                      key: 'delete',
                      label: intl.formatMessage(messages['usersAndUserGroupsDeleteUserGroup']),
                      onClick: () => onDeleteGroup?.(group),
                      isDisabled: !isGroupDeletable(group),
                    },
                  ]}
                />
              )
            : undefined
        }
        // Filtering
        filterConfig={filterConfig}
        // Toolbar
        toolbarActions={toolbarActions}
        // Empty states
        emptyStateNoData={
          <DefaultEmptyStateNoData
            title={intl.formatMessage(messages.userGroupsEmptyStateTitle)}
            body={intl.formatMessage(messages.userGroupsEmptyStateSubtitle)}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.userGroups).toLowerCase() })}
            body={`${intl.formatMessage(messages.filterMatchesNoItems, { items: intl.formatMessage(messages.userGroups).toLowerCase() })} ${intl.formatMessage(messages.tryChangingFilters)}`}
          />
        }
        // Config
        variant="compact"
        ouiaId={`${ouiaId}-table`}
        ariaLabel="User Groups Table"
        // State (passed directly, not from useTableState)
        page={page}
        perPage={perPage}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        sort={sort}
        onSortChange={handleSortChange}
        filters={tableFilters}
        onFiltersChange={handleFiltersChange}
        clearAllFilters={clearAllFilters}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
      />
      {children}
    </>
  );
};
