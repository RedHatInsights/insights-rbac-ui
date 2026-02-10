import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Split, SplitItem } from '@patternfly/react-core';

// eslint-disable-next-line rbac-local/require-use-table-state -- tableState received as prop from parent container
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView, type UseTableStateReturn } from '../../../../../components/table-view';
import { ActionDropdown } from '../../../../../components/ActionDropdown';
import type { User } from '../../../../../data/queries/users';
import messages from '../../../../../Messages';
import { type SortableColumnId, sortableColumns, standardColumns, useUsersTableConfig } from './useUsersTableConfig';

interface UsersTableProps {
  // Data props
  users: User[];
  totalCount: number;
  isLoading: boolean;

  // UI state
  focusedUser?: User;

  // Configuration
  authModel: boolean;
  orgAdmin: boolean;
  defaultPerPage?: number;
  ouiaId?: string;

  // Action callbacks
  onAddUserToGroup: (users: User[]) => void;
  onRemoveUserFromGroup: (users: User[]) => void;
  onInviteUsersClick: () => void;
  onToggleUserStatus: (user: User, isActive: boolean) => void;
  onToggleOrgAdmin: (user: User, isOrgAdmin: boolean) => void;
  onDeleteUser: (user: User) => void;
  onBulkActivate: (users: User[]) => void;
  onBulkDeactivate: (users: User[]) => void;
  onRowClick?: (user: User | undefined) => void;

  // Table state from useTableState - managed by container
  tableState: UseTableStateReturn<typeof standardColumns, User, SortableColumnId, never>;

  // Children prop for modals and other container components
  children?: React.ReactNode;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  totalCount,
  isLoading,
  focusedUser,
  authModel,
  orgAdmin,
  ouiaId = 'iam-users-table',
  onAddUserToGroup,
  onRemoveUserFromGroup,
  onInviteUsersClick,
  onToggleUserStatus,
  onToggleOrgAdmin,
  onDeleteUser,
  onBulkActivate,
  onBulkDeactivate,
  onRowClick,
  tableState,
  children,
}) => {
  const intl = useIntl();

  // Table configuration from hook - columns derived from authModel internally
  const { columns, columnConfig, cellRenderers, filterConfig } = useUsersTableConfig({
    intl,
    authModel,
    orgAdmin,
    focusedUser,
    ouiaId,
    onToggleUserStatus,
    onToggleOrgAdmin,
  });

  // Use selectedRows from tableState
  const { selectedRows } = tableState;

  // Row click handler
  const handleRowClick = useCallback(
    (user: User) => {
      if (onRowClick) {
        onRowClick(focusedUser?.username === user.username ? undefined : user);
      }
    },
    [onRowClick, focusedUser],
  );

  // Check if user can be deleted (only org admins can delete users)
  const isDeleteDisabled = !orgAdmin;

  // Toolbar actions: "Add to user group" button + overflow kebab (only visible with write permission)
  const toolbarActions = useMemo(
    () =>
      orgAdmin ? (
        <Split hasGutter>
          <SplitItem>
            <Button
              variant="primary"
              isDisabled={selectedRows.length === 0}
              onClick={() => onAddUserToGroup(selectedRows)}
              ouiaId={`${ouiaId}-add-user-button`}
            >
              {intl.formatMessage(messages['addToUserGroup'])}
            </Button>
          </SplitItem>
          <SplitItem>
            <ActionDropdown
              ariaLabel="Actions overflow menu"
              ouiaId={`${ouiaId}-toolbar-overflow`}
              items={[
                {
                  key: 'activate',
                  label: intl.formatMessage(messages.activateUsersButton),
                  onClick: () => onBulkActivate(selectedRows),
                  isDisabled: selectedRows.length === 0,
                },
                {
                  key: 'deactivate',
                  label: intl.formatMessage(messages.deactivateUsersButton),
                  onClick: () => onBulkDeactivate(selectedRows),
                  isDisabled: selectedRows.length === 0,
                },
                {
                  key: 'divider-1',
                  label: '',
                  isDivider: true,
                },
                {
                  key: 'remove-from-group',
                  label: intl.formatMessage(messages.removeFromUserGroup),
                  onClick: () => onRemoveUserFromGroup(selectedRows),
                  isDisabled: selectedRows.length === 0,
                },
                {
                  key: 'divider-2',
                  label: '',
                  isDivider: true,
                },
                {
                  key: 'invite',
                  label: intl.formatMessage(messages.inviteUsers),
                  onClick: onInviteUsersClick,
                },
              ]}
            />
          </SplitItem>
        </Split>
      ) : undefined,
    [intl, selectedRows, onAddUserToGroup, onRemoveUserFromGroup, onBulkActivate, onBulkDeactivate, onInviteUsersClick, ouiaId, orgAdmin],
  );

  return (
    <>
      {children}
      <TableView<typeof columns, User, SortableColumnId>
        // Columns from hook (derived based on authModel)
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        // Data
        data={isLoading ? undefined : users}
        totalCount={totalCount}
        getRowId={(user) => user.username}
        // Renderers
        cellRenderers={cellRenderers}
        // Selection (only with write permission)
        selectable={orgAdmin}
        isRowSelectable={() => true}
        // Row click
        isRowClickable={() => !!onRowClick}
        onRowClick={handleRowClick}
        // Row actions (only with write permission)
        renderActions={
          orgAdmin
            ? (user) => (
                <ActionDropdown
                  ariaLabel={`Actions for user ${user.username}`}
                  ouiaId={`${ouiaId}-${user.username}-actions`}
                  items={[
                    {
                      key: 'add-to-group',
                      label: intl.formatMessage(messages['addToUserGroup']),
                      onClick: () => onAddUserToGroup([user]),
                    },
                    {
                      key: 'remove-from-group',
                      label: intl.formatMessage(messages.removeFromUserGroup),
                      onClick: () => onRemoveUserFromGroup([user]),
                    },
                    {
                      key: 'divider',
                      label: '',
                      isDivider: true,
                    },
                    {
                      key: 'delete',
                      label: intl.formatMessage(messages.delete),
                      onClick: () => onDeleteUser(user),
                      isDisabled: isDeleteDisabled,
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
            title={intl.formatMessage(messages.usersEmptyStateTitle)}
            body={intl.formatMessage(messages.usersEmptyStateSubtitle)}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(messages.usersEmptyStateTitle)}
            body={intl.formatMessage(messages.usersEmptyStateSubtitle)}
          />
        }
        // Config
        variant="compact"
        ouiaId={`${ouiaId}-table`}
        ariaLabel="Users Table"
        // All table state from useTableState - spread directly
        {...tableState}
      />
    </>
  );
};
