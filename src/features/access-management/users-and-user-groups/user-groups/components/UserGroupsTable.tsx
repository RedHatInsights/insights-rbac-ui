import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { ResponsiveAction, ResponsiveActions } from '@patternfly/react-component-groups';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView, type UseTableStateReturn } from '../../../../../components/table-view';
import { ActionDropdown } from '../../../../../components/ActionDropdown';
import type { Group } from '../../../../../data/queries/groups';
import messages from '../../../../../Messages';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import pathnames from '../../../../../utilities/pathnames';
import { type SortableColumnId, columns, sortableColumns, useUserGroupsTableConfig } from './useUserGroupsTableConfig';

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

  // Table state from useTableState - managed by container
  tableState: UseTableStateReturn<typeof columns, Group, SortableColumnId, never>;

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
  tableState,
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
        <ResponsiveAction ouiaId="add-usergroup-button" isPinned onClick={() => navigate(pathnames['users-and-user-groups-create-group'].link())}>
          {intl.formatMessage(messages.createUserGroup)}
        </ResponsiveAction>
      </ResponsiveActions>
    ),
    [intl, navigate, ouiaId],
  );

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
        selectable={canModifyGroups}
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
        // All table state from useTableState - spread directly
        {...tableState}
      />
      {children}
    </>
  );
};
