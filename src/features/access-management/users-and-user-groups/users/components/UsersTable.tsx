import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { UsersEmptyState } from './UsersEmptyState';
import { DataViewState, DataViewTextFilter, DataViewTh, useDataViewSelection } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { ResponsiveAction } from '@patternfly/react-component-groups/dist/dynamic/ResponsiveAction';
import { ResponsiveActions } from '@patternfly/react-component-groups/dist/dynamic/ResponsiveActions';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Pagination, Split, SplitItem, Switch } from '@patternfly/react-core';
import { ThProps } from '@patternfly/react-table';
import { EllipsisVIcon } from '@patternfly/react-icons';
import messages from '../../../../../Messages';
import { User } from '../../../../../redux/users/reducer';

// User row actions component
interface UserRowActionsProps {
  user: User;
  onDeleteUser: (user: User) => void;
  orgAdmin: boolean;
  isProd: boolean;
  ouiaId?: string;
}

const UserRowActions: React.FC<UserRowActionsProps> = ({ user, onDeleteUser, orgAdmin, isProd, ouiaId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const intl = useIntl();

  // Delete should be disabled if not org admin or in production
  const isDeleteDisabled = !orgAdmin || isProd;

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for user ${user.username}`}
          variant="plain"
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          data-ouia-component-id={`${ouiaId}-menu-toggle`}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      ouiaId={ouiaId}
    >
      <DropdownList>
        <DropdownItem
          key="delete"
          onClick={() => {
            setIsOpen(false);
            onDeleteUser(user);
          }}
          isDisabled={isDeleteDisabled}
          data-ouia-component-id={`${ouiaId}-delete`}
        >
          {intl.formatMessage(messages.delete)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

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

  // Define columns based on authModel flag
  const columns = useMemo(() => {
    if (authModel) {
      return [
        { label: intl.formatMessage(messages.orgAdmin), key: 'is_org_admin', index: 0, sort: false },
        { label: intl.formatMessage(messages.username), key: 'username', index: 1, sort: true },
        { label: intl.formatMessage(messages.email), key: 'email', index: 2, sort: false },
        { label: intl.formatMessage(messages.firstName), key: 'first_name', index: 3, sort: false },
        { label: intl.formatMessage(messages.lastName), key: 'last_name', index: 4, sort: false },
        { label: intl.formatMessage(messages.status), key: 'is_active', index: 5, sort: false },
        { label: 'Actions', key: 'actions', index: 6, sort: false },
      ];
    } else {
      return [
        { label: intl.formatMessage(messages.username), key: 'username', index: 0, sort: true },
        { label: intl.formatMessage(messages.email), key: 'email', index: 1, sort: false },
        { label: intl.formatMessage(messages.firstName), key: 'first_name', index: 2, sort: false },
        { label: intl.formatMessage(messages.lastName), key: 'last_name', index: 3, sort: false },
        { label: intl.formatMessage(messages.status), key: 'is_active', index: 4, sort: false },
        { label: intl.formatMessage(messages.orgAdmin), key: 'is_org_admin', index: 5, sort: false },
        { label: 'Actions', key: 'actions', index: 6, sort: false },
      ];
    }
  }, [authModel, intl]);

  // All data view state is now managed by container - just compute derived values
  const sortByIndex = useMemo(() => columns.findIndex((column) => column.key === (sortBy || 'username')), [sortBy, columns]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction: direction || 'asc',
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => onSort(_event, columns[index].key, direction),
    columnIndex,
  });

  const sortableColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.label,
    props: column.sort ? { sort: getSortParams(index) } : {},
  }));

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect } = selection;

  // Transform users into table rows
  const rows = useMemo(() => {
    const handleRowClick = (event: any, user: User | undefined) => {
      if (event.target.matches('td') || event.target.matches('tr')) {
        onRowClick?.(user);
      }
    };

    if (authModel) {
      // Auth model column order: org_admin, username, email, first_name, last_name, status, actions
      return users.map((user) => ({
        id: String(user.id || user.username),
        row: [
          // Org admin column
          <Switch
            key={`${user.id}-org-admin`}
            id={`${user.id}-org-admin-switch`}
            aria-label={`Toggle org admin for ${user.username}`}
            isChecked={user.is_org_admin || false}
            isDisabled={!orgAdmin || !user.is_active || isProd}
            onChange={(_, checked) => onToggleOrgAdmin(user, checked)}
            ouiaId={`${ouiaId}-${user.id}-org-admin-switch`}
          />,
          // Username (bold if focused)
          focusedUser?.id === user.id ? <strong key={`${user.id}-username`}>{user.username}</strong> : user.username,
          // Email
          user.email,
          // First name
          user.first_name,
          // Last name
          user.last_name,
          // Status
          <Switch
            key={`${user.id}-status`}
            id={`${user.id}-status-switch`}
            aria-label={`Toggle status for ${user.username}`}
            isChecked={user.is_active || false}
            isDisabled={!user.is_active && !orgAdmin}
            onChange={(_, checked) => onToggleUserStatus(user, checked)}
            ouiaId={`${ouiaId}-${user.id}-status-switch`}
          />,
          // Actions column
          <UserRowActions
            key={`${user.id}-actions`}
            user={user}
            onDeleteUser={onDeleteUser}
            orgAdmin={orgAdmin}
            isProd={isProd}
            ouiaId={`${ouiaId}-${user.id}-actions`}
          />,
        ],
        props: {
          isClickable: true,
          onRowClick: (event: any) => handleRowClick(event, focusedUser?.id === user.id ? undefined : user),
          isRowSelected: false,
        },
      }));
    } else {
      // Standard column order: username, email, first_name, last_name, status, org_admin, actions
      return users.map((user) => ({
        id: String(user.id || user.username),
        row: [
          // Username (bold if focused)
          focusedUser?.id === user.id ? <strong key={`${user.id}-username`}>{user.username}</strong> : user.username,
          // Email
          user.email,
          // First name
          user.first_name,
          // Last name
          user.last_name,
          // Status
          <Switch
            key={`${user.id}-status`}
            id={`${user.id}-status-switch`}
            aria-label={`Toggle status for ${user.username}`}
            isChecked={user.is_active || false}
            isDisabled={!user.is_active && !orgAdmin}
            onChange={(_, checked) => onToggleUserStatus(user, checked)}
            ouiaId={`${ouiaId}-${user.id}-status-switch`}
          />,
          // Org admin column
          <Switch
            key={`${user.id}-org-admin`}
            id={`${user.id}-org-admin-switch`}
            aria-label={`Toggle org admin for ${user.username}`}
            isChecked={user.is_org_admin || false}
            isDisabled={!orgAdmin || !user.is_active || isProd}
            onChange={(_, checked) => onToggleOrgAdmin(user, checked)}
            ouiaId={`${ouiaId}-${user.id}-org-admin-switch`}
          />,
          // Actions column
          <UserRowActions
            key={`${user.id}-actions`}
            user={user}
            onDeleteUser={onDeleteUser}
            orgAdmin={orgAdmin}
            isProd={isProd}
            ouiaId={`${ouiaId}-${user.id}-actions`}
          />,
        ],
        props: {
          isClickable: true,
          onRowClick: (event: any) => handleRowClick(event, focusedUser?.id === user.id ? undefined : user),
          isRowSelected: false,
        },
      }));
    }
  }, [users, focusedUser, orgAdmin, isProd, ouiaId, intl, onToggleUserStatus, onToggleOrgAdmin, onDeleteUser, authModel, onRowClick]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.label)} />;
  const loadingBody = <SkeletonTableBody rowsCount={perPage} columnsCount={columns.length} />;

  const activeState = isLoading ? DataViewState.loading : users.length === 0 ? DataViewState.empty : undefined;

  return (
    <>
      {children}
      <DataView ouiaId={ouiaId} selection={selection} activeState={activeState}>
        <DataViewToolbar
          ouiaId={`${ouiaId}-header-toolbar`}
          bulkSelect={
            <BulkSelect
              isDataPaginated
              pageCount={users.length}
              selectedCount={selected.length}
              totalCount={totalCount}
              onSelect={handleBulkSelect}
            />
          }
          pagination={
            <Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} isCompact />
          }
          filters={
            <DataViewFilters ouiaId={`${ouiaId}-filters`} onChange={(_e, values) => onSetFilters(values)} values={filters}>
              <DataViewTextFilter
                filterId="username"
                title={intl.formatMessage(messages.username)}
                placeholder={intl.formatMessage(messages.filterByUsername)}
                ouiaId={`${ouiaId}-username-filter`}
              />
              <DataViewTextFilter
                filterId="email"
                title={intl.formatMessage(messages.email)}
                placeholder={intl.formatMessage(messages.filterByUsername)}
                ouiaId={`${ouiaId}-email-filter`}
              />
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
          actions={
            <Split hasGutter>
              <SplitItem>
                <Dropdown
                  isOpen={isDropdownOpen}
                  onSelect={onBulkStatusChange}
                  onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      isDisabled={selected.length === 0}
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
                  onClick={() => {
                    const selectedUsers = selected
                      .map((selectedRow) => {
                        return users.find((user) => String(user.id || user.username) === selectedRow.id);
                      })
                      .filter((user): user is User => user !== undefined);
                    onAddUserClick(selectedUsers);
                  }}
                  variant="primary"
                  isDisabled={selected.length === 0}
                  ouiaId={`${ouiaId}-add-user-button`}
                >
                  {intl.formatMessage(messages['addToUserGroup'])}
                </ResponsiveAction>
                <ResponsiveAction variant="primary" onClick={onInviteUsersClick}>
                  {intl.formatMessage(messages.inviteUsers)}
                </ResponsiveAction>
              </ResponsiveActions>
            </Split>
          }
        />
        <DataViewTable
          variant="compact"
          aria-label="Users Table"
          ouiaId={`${ouiaId}-table`}
          columns={sortableColumns}
          rows={rows}
          headStates={{ loading: loadingHeader }}
          bodyStates={{ loading: loadingBody, empty: <UsersEmptyState /> }}
        />
        <DataViewToolbar
          ouiaId={`${ouiaId}-footer-toolbar`}
          pagination={<Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} />}
        />
      </DataView>
    </>
  );
};
