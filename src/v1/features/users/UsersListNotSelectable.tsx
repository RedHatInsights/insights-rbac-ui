import React, { Fragment, Suspense, useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView } from '@redhat-cloud-services/frontend-components/TableView';
import { useTableState } from '@redhat-cloud-services/frontend-components/TableView';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import paths from '../../utilities/pathnames';
import { useIntl } from 'react-intl';

import { useCommonAuthModel } from '../../../capabilities/useCommonAuthModel';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import useUserData from '../../hooks/useUserData';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { AppLink } from '../../../shared/components/navigation/AppLink';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { OrgAdminToggle } from './OrgAdminToggle';
import { ActivateToggle } from './components/ActivateToggle';
import pathnames from '../../utilities/pathnames';
import { useChangeUserStatusMutation, useUsersQuery } from '../../../shared/data/queries/users';
import { commonMessages } from '../../../shared/messages/common';

interface UsersListNotSelectableProps {
  userLinks: boolean;
  usesMetaInURL: boolean;
  props: {
    isSelectable: boolean;
    isCompact: boolean;
  };
}

// User type for this component
interface User {
  id?: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_org_admin?: boolean;
  uuid: string;
  external_source_id?: number | string;
}

// Column definitions
const columns = ['org_admin', 'username', 'email', 'first_name', 'last_name', 'status'] as const;

const UsersListNotSelectable: React.FC<UsersListNotSelectableProps> = ({ userLinks, props, usesMetaInURL }) => {
  const intl = useIntl();
  const { orgAdmin } = useUserData();
  const { isEnabled: isCommonAuthModel } = useCommonAuthModel();
  const userData = useUserData();
  const appNavigate = useAppNavigate();

  const currAccountId = userData.identity?.internal?.account_id;

  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Get user ID for row identification
  const getUserId = useCallback((user: User) => user.username, []);

  // Table state management - defined early so we can derive queryParams from it
  const tableState = useTableState<typeof columns, User, 'username'>({
    columns,
    sortableColumns: ['username'] as const,
    getRowId: getUserId,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50, 100],
    initialSort: { column: 'username', direction: 'asc' },
    initialFilters: { status: ['Active'] },
    syncWithUrl: usesMetaInURL,
  });

  // Derived: Query params calculated from tableState (no useState sync needed)
  // Uses tableState.apiParams which already has properly formatted orderBy (e.g., '-username' for desc)
  const queryParams = useMemo(() => {
    const statusFilter = tableState.filters.status as string[] | undefined;

    // Map status filter to API status param
    let status: 'enabled' | 'disabled' | 'all' = 'enabled';
    if (statusFilter?.includes('Active') && statusFilter?.includes('Inactive')) {
      status = 'all';
    } else if (statusFilter?.includes('Inactive')) {
      status = 'disabled';
    } else if (statusFilter?.includes('Active') || !statusFilter || statusFilter.length === 0) {
      status = 'enabled';
    }

    return {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      orderBy: tableState.apiParams.orderBy, // Includes direction prefix (e.g., '-username')
      username: (tableState.filters.username as string) || undefined,
      email: (tableState.filters.email as string) || undefined,
      status,
    };
  }, [tableState.apiParams, tableState.filters]);

  // React Query for users data
  const { data: usersData, isLoading } = useUsersQuery(queryParams);
  const users: User[] = useMemo(
    () =>
      (usersData?.users ?? []).map((u) => ({
        ...u,
        uuid: u.username,
        email: u.email || '',
        first_name: u.first_name,
        last_name: u.last_name,
        is_active: u.is_active,
        is_org_admin: u.is_org_admin,
        external_source_id: u.external_source_id,
      })),
    [usersData],
  );
  const totalCount = usersData?.totalCount ?? 0;

  // React Query mutation for changing user status
  const changeUserStatusMutation = useChangeUserStatusMutation();

  const handleToggle = useCallback(
    async (isActive: boolean, updatedUser: User) => {
      if (changeUserStatusMutation.isPending) return;
      await changeUserStatusMutation.mutateAsync({
        users: [{ id: updatedUser.external_source_id, username: updatedUser.username, is_active: isActive }],
      });
    },
    [changeUserStatusMutation],
  );

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      org_admin: {
        label: intl.formatMessage({ id: 'orgAdministrator', defaultMessage: 'Org. Administrator', description: 'Org. Administrator name' }),
      },
      username: { label: intl.formatMessage(commonMessages.username), sortable: true },
      email: { label: intl.formatMessage(commonMessages.email) },
      first_name: { label: intl.formatMessage(commonMessages.firstName) },
      last_name: { label: intl.formatMessage(commonMessages.lastName) },
      status: { label: intl.formatMessage(commonMessages.status) },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, User> = useMemo(
    () => ({
      org_admin: (user) => {
        if (isCommonAuthModel) {
          // external_source_id may be string or number, convert to number for OrgAdminToggle
          const userId = typeof user.external_source_id === 'string' ? Number(user.external_source_id) : user.external_source_id;
          return (
            <OrgAdminToggle
              key={`toggle-${user.username}`}
              isOrgAdmin={user.is_org_admin ?? false}
              username={user.username}
              intl={intl}
              userId={userId}
              isActive={user.is_active ?? true}
              fetchData={() => {
                /* React Query will refetch via cache invalidation */
              }}
            />
          );
        }
        return user.is_org_admin ? (
          <Fragment>
            <CheckIcon key="yes-icon" className="pf-v6-u-mr-sm" />
            <span key="yes">{intl.formatMessage(commonMessages.yes)}</span>
          </Fragment>
        ) : (
          <Fragment>
            <CloseIcon key="no-icon" className="pf-v6-u-mr-sm" />
            <span key="no">{intl.formatMessage(commonMessages.no)}</span>
          </Fragment>
        );
      },
      username: (user) => (userLinks ? <AppLink to={pathnames['user-detail'].link(user.username)}>{user.username}</AppLink> : user.username),
      email: (user) => user.email,
      first_name: (user) => user.first_name ?? '',
      last_name: (user) => user.last_name ?? '',
      status: (user) => {
        if (isCommonAuthModel && orgAdmin) {
          // Convert external_source_id to number for ActivateToggle
          const extId = typeof user.external_source_id === 'string' ? Number(user.external_source_id) : user.external_source_id;
          return (
            <ActivateToggle
              key="active-toggle"
              user={{ ...user, is_active: user.is_active ?? false, external_source_id: extId }}
              onToggle={(isActive) => handleToggle(isActive, user)}
              accountId={currAccountId}
            />
          );
        }
        return (
          <Label key="status" color={user.is_active ? 'green' : 'grey'}>
            {intl.formatMessage(user.is_active ? commonMessages.active : commonMessages.inactive)}
          </Label>
        );
      },
    }),
    [intl, isCommonAuthModel, orgAdmin, userLinks, currAccountId, handleToggle],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'username',
        label: intl.formatMessage(commonMessages.username),
        placeholder: intl.formatMessage(commonMessages.filterByKey, { key: intl.formatMessage(commonMessages.username).toLowerCase() }),
      },
      {
        type: 'text',
        id: 'email',
        label: intl.formatMessage(commonMessages.email),
        placeholder: intl.formatMessage(commonMessages.filterByKey, { key: intl.formatMessage(commonMessages.email).toLowerCase() }),
      },
      {
        type: 'checkbox',
        id: 'status',
        label: intl.formatMessage(commonMessages.status),
        options: [
          { id: 'Active', label: intl.formatMessage(commonMessages.active) },
          { id: 'Inactive', label: intl.formatMessage(commonMessages.inactive) },
        ],
      },
    ],
    [intl],
  );

  const handleBulkActivation = useCallback(
    async (userStatus: boolean) => {
      if (changeUserStatusMutation.isPending) return;

      await changeUserStatusMutation.mutateAsync({
        users: tableState.selectedRows.map((user) => ({ id: user.external_source_id, username: user.username, is_active: userStatus })),
      });
      tableState.clearSelection();
      userStatus ? setIsActivateModalOpen(false) : setIsDeactivateModalOpen(false);
    },
    [changeUserStatusMutation, tableState],
  );

  // Toolbar buttons
  const toolbarActions = useMemo(() => {
    if (!orgAdmin || !isCommonAuthModel) return null;
    return (
      <>
        <AppLink to={paths['invite-users'].link()} key="invite-users" className="rbac-m-hide-on-sm">
          <Button ouiaId="invite-users-button" variant="primary" aria-label="Invite users">
            {intl.formatMessage({ id: 'inviteUsers', defaultMessage: 'Invite users', description: 'Invite users' })}
          </Button>
        </AppLink>
      </>
    );
  }, [orgAdmin, isCommonAuthModel, intl]);

  // Kebab menu state for bulk actions
  const [isKebabOpen, setIsKebabOpen] = useState(false);

  // Bulk actions as kebab dropdown menu
  const bulkActions = useMemo(() => {
    if (!orgAdmin || !isCommonAuthModel) return null;
    return (
      <Dropdown
        isOpen={isKebabOpen}
        onSelect={() => setIsKebabOpen(false)}
        onOpenChange={(isOpen) => setIsKebabOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            aria-label="kebab dropdown toggle"
            variant="plain"
            onClick={() => setIsKebabOpen(!isKebabOpen)}
            isExpanded={isKebabOpen}
            isDisabled={tableState.selectedRows.length === 0}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          <DropdownItem key="activate" onClick={() => setIsActivateModalOpen(true)}>
            {intl.formatMessage({ id: 'activateUsersButton', defaultMessage: 'Activate users', description: 'activate users button text' })}
          </DropdownItem>
          <DropdownItem key="deactivate" onClick={() => setIsDeactivateModalOpen(true)}>
            {intl.formatMessage({ id: 'deactivateUsersButton', defaultMessage: 'Deactivate users', description: 'deactivate users button text' })}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    );
  }, [orgAdmin, isCommonAuthModel, intl, tableState.selectedRows.length, isKebabOpen]);

  return (
    <React.Fragment>
      {isActivateModalOpen && (
        <WarningModal
          ouiaId="toggle-status-modal"
          isOpen={isActivateModalOpen}
          title={intl.formatMessage({
            id: 'activateUsersConfirmationModalTitle',
            defaultMessage: 'Activate users',
            description: 'activate users confirmation modal title text',
          })}
          confirmButtonLabel={intl.formatMessage({
            id: 'activateUsersConfirmationButton',
            defaultMessage: 'Activate user(s)',
            description: 'activate users confirmation button text',
          })}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsActivateModalOpen(false)}
          onConfirm={() => handleBulkActivation(true)}
          withCheckbox
          checkboxLabel={intl.formatMessage({
            id: 'activateUsersConfirmationModalCheckboxText',
            defaultMessage: 'Yes, I confirm that I want to add these users',
            description: 'activate users confirmation modal checkbox text',
          })}
        >
          {intl.formatMessage({
            id: 'activateUsersConfirmationModalDescription',
            defaultMessage: 'Are you sure you want to activate the user(s) below for your Red Hat organization?',
            description: 'activate users confirmation modal description text',
          })}

          <List isPlain isBordered className="pf-u-p-md">
            {tableState.selectedRows.map((user) => (
              <ListItem key={user.username}>{user.username}</ListItem>
            ))}
          </List>
        </WarningModal>
      )}
      {isDeactivateModalOpen && (
        <WarningModal
          ouiaId="toggle-status-modal"
          isOpen={isDeactivateModalOpen}
          title={intl.formatMessage({
            id: 'deactivateUsersConfirmationModalTitle',
            defaultMessage: 'Deactivate users',
            description: 'deactivate users confirmation modal title text',
          })}
          confirmButtonLabel={intl.formatMessage({
            id: 'deactivateUsersConfirmationButton',
            defaultMessage: 'Deactivate user(s)',
            description: 'deactivate users confirmation button text',
          })}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={() => handleBulkActivation(false)}
          withCheckbox
          checkboxLabel={intl.formatMessage({
            id: 'deactivateUsersConfirmationModalCheckboxText',
            defaultMessage: 'Yes, I confirm that I want to deactivate these users',
            description: 'deactivate users confirmation modal checkbox text',
          })}
        >
          {intl.formatMessage({
            id: 'deactivateUsersConfirmationModalDescription',
            defaultMessage: 'Are you sure you want to deactivate the user(s) below from your Red Hat organization?',
            description: 'deactivate users confirmation modal description text',
          })}

          <List isPlain isBordered className="pf-u-p-md">
            {tableState.selectedRows.map((user) => (
              <ListItem key={user.username}>{user.username}</ListItem>
            ))}
          </List>
        </WarningModal>
      )}
      <TableView<typeof columns, User, 'username'>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={['username'] as const}
        data={isLoading ? undefined : users}
        totalCount={totalCount}
        getRowId={getUserId}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        selectable={isCommonAuthModel && orgAdmin}
        toolbarActions={toolbarActions}
        bulkActions={bulkActions}
        emptyStateNoData={
          <DefaultEmptyStateNoData
            title={intl.formatMessage(
              { id: 'configureItems', defaultMessage: 'Configure {items}', description: 'Configure items message' },
              { items: intl.formatMessage(commonMessages.users) },
            )}
            body={`${intl.formatMessage(commonMessages.toConfigureUserAccess)} ${intl.formatMessage(commonMessages.createAtLeastOneItem, { item: intl.formatMessage({ id: 'user', defaultMessage: 'user', description: 'User label' }) })}`}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.users) })}
            body={`${intl.formatMessage(commonMessages.filterMatchesNoItems, { items: intl.formatMessage(commonMessages.users) })} ${intl.formatMessage(commonMessages.tryChangingFilters)}`}
          />
        }
        variant={props.isCompact ? 'compact' : undefined}
        ouiaId="users-table"
        ariaLabel="users table"
        {...tableState}
      />
      <Suspense>
        <Outlet
          context={{
            fetchData: () => {
              appNavigate(paths['users'].link());
              // Refetch will happen automatically via URL change and onStaleData
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};

export default UsersListNotSelectable;
