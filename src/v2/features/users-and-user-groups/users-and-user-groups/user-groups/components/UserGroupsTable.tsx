import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import ResponsiveAction from '@patternfly/react-component-groups/dist/dynamic/ResponsiveAction';
import ResponsiveActions from '@patternfly/react-component-groups/dist/dynamic/ResponsiveActions';
// eslint-disable-next-line experience-ui/require-use-table-state -- tableState received as prop from parent container
import {
  DefaultEmptyStateNoData,
  DefaultEmptyStateNoResults,
  TableView,
  type UseTableStateReturn,
} from '@redhat-cloud-services/frontend-components/TableView';
import { ActionDropdown } from '../../../../../../shared/components/ActionDropdown';
import type { Group } from '../../../../../../v2/data/queries/groups';
import { isGroupSelectable } from '../useUserGroups';

import useAppNavigate from '../../../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../../../utilities/pathnames';
import { type SortableColumnId, columns, sortableColumns, useUserGroupsTableConfig } from './useUserGroupsTableConfig';
import { commonMessages } from '../../../../../../shared/messages/common';

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
  ouiaId?: string;

  // Table state from useTableState - managed by container
  tableState: UseTableStateReturn<typeof columns, Group, SortableColumnId, never>;

  // Event handler props
  onRowClick?: (group: Group | undefined) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (group: Group) => void;
  onDeleteGroups?: (groups: Group[]) => void;

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
  ouiaId = 'iam-user-groups-table',
  tableState,
  onRowClick,
  onEditGroup,
  onDeleteGroup,
  onDeleteGroups,
  children,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();

  // Table configuration from hook
  const { columnConfig, cellRenderers, filterConfig } = useUserGroupsTableConfig({ intl });

  // Permission flag for modifying groups
  const canModifyGroups = enableActions && orgAdmin;

  // Check if group can be edited (default access groups and system groups cannot be edited)
  const isGroupEditable = useCallback((group: Group) => !group.platform_default && !group.admin_default && !group.system, []);

  // Check if group can be deleted (platform_default and system groups cannot be deleted)
  const isGroupDeletable = useCallback((group: Group) => !group.platform_default && !group.system && orgAdmin, [orgAdmin]);

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

  const deletableSelectedRows = useMemo(() => tableState.selectedRows.filter(isGroupDeletable), [tableState.selectedRows, isGroupDeletable]);

  // Toolbar actions (only visible with write permission)
  const toolbarActions = useMemo(
    () =>
      canModifyGroups ? (
        <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-actions-dropdown`}>
          <ResponsiveAction ouiaId="add-usergroup-button" isPinned onClick={() => navigate(pathnames['users-and-user-groups-create-group'].link())}>
            {intl.formatMessage({ id: 'createUserGroup', defaultMessage: 'Create user group', description: 'create user group button label' })}
          </ResponsiveAction>
          {onDeleteGroups && (
            <ResponsiveAction
              ouiaId="delete-usergroup-button"
              isDisabled={deletableSelectedRows.length === 0}
              onClick={() => onDeleteGroups(deletableSelectedRows)}
            >
              {intl.formatMessage(
                {
                  id: 'usersAndUserGroupsDeleteUserGroupCount',
                  defaultMessage: 'Delete {count, plural, =0 {user group} one {user group (#)} other {user groups (#)}}',
                  description: 'Delete user group action label with selected count',
                },
                { count: deletableSelectedRows.length },
              )}
            </ResponsiveAction>
          )}
        </ResponsiveActions>
      ) : undefined,
    [intl, navigate, ouiaId, canModifyGroups, deletableSelectedRows, onDeleteGroups],
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
        isRowSelectable={isGroupSelectable}
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
                    ...(isGroupEditable(group)
                      ? [
                          {
                            key: 'edit',
                            label: intl.formatMessage({
                              id: 'usersAndUserGroupsEditUserGroup',
                              defaultMessage: 'Edit user group',
                              description: 'Edit user group label',
                            }),
                            onClick: () => onEditGroup?.(group),
                          },
                        ]
                      : []),
                    {
                      key: 'delete',
                      label: intl.formatMessage({
                        id: 'usersAndUserGroupsDeleteUserGroup',
                        defaultMessage: 'Delete user group',
                        description: 'Delete user group label',
                      }),
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
            title={intl.formatMessage({
              id: 'userGroupsEmptyStateTitle',
              defaultMessage: 'No user group found',
              description: 'Empty state title User groups',
            })}
            body={intl.formatMessage({
              id: 'userGroupsEmptyStateSubtitle',
              defaultMessage: 'This filter criteria matches no user groups. Try changing your filter input.',
              description: 'Empty state subtitle User groups',
            })}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.userGroups).toLowerCase() })}
            body={`${intl.formatMessage(commonMessages.filterMatchesNoItems, { items: intl.formatMessage(commonMessages.userGroups).toLowerCase() })} ${intl.formatMessage(commonMessages.tryChangingFilters)}`}
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
