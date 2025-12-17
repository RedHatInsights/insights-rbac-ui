import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { ResponsiveAction } from '@patternfly/react-component-groups/dist/dynamic/ResponsiveAction';
import { ResponsiveActions } from '@patternfly/react-component-groups/dist/dynamic/ResponsiveActions';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Split, SplitItem } from '@patternfly/react-core';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView } from '../../../../../components/table-view';
import { ActionDropdown } from '../../../../../components/ActionDropdown';
import type { User } from '../../../../../redux/users/reducer';
import messages from '../../../../../Messages';
import { type SortableColumnId, sortableColumns, useUsersTableConfig } from './useUsersTableConfig';

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
  isProd: boolean;
  defaultPerPage?: number;
  ouiaId?: string;

  // Action callbacks
  onAddUserClick: (users: User[]) => void;
  onInviteUsersClick: () => void;
  onToggleUserStatus: (user: User, isActive: boolean) => void;
  onToggleOrgAdmin: (user: User, isOrgAdmin: boolean) => void;
  onDeleteUser: (user: User) => void;
  onBulkStatusChange: () => void;
  onRowClick?: (user: User | undefined) => void;

  // Data view props - managed by container
  sortBy?: string;
  direction?: 'asc' | 'desc';
  onSort: (event: any, key: string, direction: 'asc' | 'desc') => void;
  filters: { username: string; email: string };
  onSetFilters: (filters: Partial<{ username: string; email: string }>) => void;
  clearAllFilters: () => void;
  page: number;
  perPage: number;
  onSetPage: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => void;
  onPerPageSelect: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, perPage: number) => void;
  pagination: any; // DataViewPagination hook return type

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
  isProd,
  ouiaId = 'iam-users-table',
  onAddUserClick,
  onInviteUsersClick,
  onToggleUserStatus,
  onToggleOrgAdmin,
  onDeleteUser,
  onBulkStatusChange,
  onRowClick,
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
  children,
}) => {
  const intl = useIntl();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Selection state (managed locally since this is a presentational component)
  const [selectedRows, setSelectedRows] = React.useState<User[]>([]);

  // Table configuration from hook - columns derived from authModel internally
  const { columns, columnConfig, cellRenderers, filterConfig } = useUsersTableConfig({
    intl,
    authModel,
    orgAdmin,
    isProd,
    focusedUser,
    ouiaId,
    onToggleUserStatus,
    onToggleOrgAdmin,
  });

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

  // Adapt pagination handlers for TableView - container callbacks expect events that we don't have
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Create a minimal event object to satisfy the container's callback signature
      const syntheticEvent = {} as React.MouseEvent;
      onSetPage(syntheticEvent, newPage);
    },
    [onSetPage],
  );

  const handlePerPageChange = useCallback(
    (newPerPage: number) => {
      // Create a minimal event object to satisfy the container's callback signature
      const syntheticEvent = {} as React.MouseEvent;
      onPerPageSelect(syntheticEvent, newPerPage);
    },
    [onPerPageSelect],
  );

  // Adapt filter handlers for TableView
  const handleFiltersChange = useCallback(
    (newFilters: Record<string, string | string[]>) => {
      onSetFilters({
        username: (newFilters.username as string) || '',
        email: (newFilters.email as string) || '',
      });
    },
    [onSetFilters],
  );

  // Selection handlers
  const handleSelectRow = useCallback((user: User, selected: boolean) => {
    setSelectedRows((prev) => {
      if (selected) {
        return prev.some((u) => u.id === user.id) ? prev : [...prev, user];
      }
      return prev.filter((u) => u.id !== user.id);
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean, rows: User[]) => {
    if (selected) {
      setSelectedRows((prev) => {
        const newSelected = [...prev];
        rows.forEach((user) => {
          if (!newSelected.some((u) => u.id === user.id)) {
            newSelected.push(user);
          }
        });
        return newSelected;
      });
    } else {
      setSelectedRows((prev) => prev.filter((u) => !rows.some((r) => r.id === u.id)));
    }
  }, []);

  // Row click handler
  const handleRowClick = useCallback(
    (user: User) => {
      if (onRowClick) {
        onRowClick(focusedUser?.id === user.id ? undefined : user);
      }
    },
    [onRowClick, focusedUser],
  );

  // Check if user can be deleted
  const isDeleteDisabled = !orgAdmin || isProd;

  // Toolbar actions with bulk status dropdown
  const toolbarActions = useMemo(
    () => (
      <Split hasGutter>
        <SplitItem>
          <Dropdown
            isOpen={isDropdownOpen}
            onSelect={onBulkStatusChange}
            onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                isDisabled={selectedRows.length === 0}
                ref={toggleRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                isExpanded={isDropdownOpen}
              >
                {intl.formatMessage(messages.activateUsersButton)}
              </MenuToggle>
            )}
            ouiaId={`${ouiaId}-status-dropdown`}
            shouldFocusToggleOnSelect
          >
            <DropdownList>
              <DropdownItem>{intl.formatMessage(messages.activateUsersButton)}</DropdownItem>
              <DropdownItem>{intl.formatMessage(messages.deactivateUsersButton)}</DropdownItem>
            </DropdownList>
          </Dropdown>
        </SplitItem>
        <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-table-actions`}>
          <ResponsiveAction
            isPersistent
            onClick={() => onAddUserClick(selectedRows)}
            variant="primary"
            isDisabled={selectedRows.length === 0}
            ouiaId={`${ouiaId}-add-user-button`}
          >
            {intl.formatMessage(messages['addToUserGroup'])}
          </ResponsiveAction>
          <ResponsiveAction variant="primary" onClick={onInviteUsersClick}>
            {intl.formatMessage(messages.inviteUsers)}
          </ResponsiveAction>
        </ResponsiveActions>
      </Split>
    ),
    [intl, isDropdownOpen, selectedRows, onBulkStatusChange, onAddUserClick, onInviteUsersClick, ouiaId],
  );

  // Transform filters for TableView
  const tableFilters = useMemo(() => ({ username: filters.username || '', email: filters.email || '' }), [filters]);

  // Has active filters check
  const hasActiveFilters = !!filters.username || !!filters.email;

  return (
    <>
      {children}
      <TableView
        // Columns from hook (derived based on authModel)
        // Type assertions needed: hook returns union of column configs, TableView needs specific type
        columns={columns as readonly string[]}
        columnConfig={columnConfig as Record<string, { label: string; sortable?: boolean }>}
        sortableColumns={sortableColumns}
        // Data
        data={isLoading ? undefined : users}
        totalCount={totalCount}
        getRowId={(user) => String(user.id || user.username)}
        // Renderers
        cellRenderers={cellRenderers as Record<string, (user: User) => React.ReactNode>}
        // Selection
        selectable={true}
        isRowSelectable={() => true}
        // Row click
        isRowClickable={() => !!onRowClick}
        onRowClick={handleRowClick}
        // Row actions
        renderActions={(user) => (
          <ActionDropdown
            ariaLabel={`Actions for user ${user.username}`}
            ouiaId={`${ouiaId}-${user.id}-actions`}
            items={[
              {
                key: 'delete',
                label: intl.formatMessage(messages.delete),
                onClick: () => onDeleteUser(user),
                isDisabled: isDeleteDisabled,
              },
            ]}
          />
        )}
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
        hasActiveFilters={hasActiveFilters}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
      />
    </>
  );
};
