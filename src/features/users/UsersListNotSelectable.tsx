import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView } from '../../components/table-view';
import { useTableState } from '../../components/table-view/hooks/useTableState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../components/table-view/types';
import paths from '../../utilities/pathnames';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import PermissionsContext, { PermissionsContextType } from '../../utilities/permissionsContext';
import { useFlag } from '@unleash/proxy-client-react';
import useAppNavigate from '../../hooks/useAppNavigate';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { WarningModal } from '@patternfly/react-component-groups';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppLink } from '../../components/navigation/AppLink';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import OrgAdminDropdown from './OrgAdminDropdown';
import { ActivateToggle } from './components/ActivateToggle';
import pathnames from '../../utilities/pathnames';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { useChangeUserStatusMutation, useUsersQuery } from '../../data/queries/users';

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
  const addNotification = useAddNotification();
  const { orgAdmin } = useContext(PermissionsContext) as PermissionsContextType;
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const { isProd, auth } = useChrome();
  const appNavigate = useAppNavigate();
  const isITLess = useFlag('platform.rbac.itless');

  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [currAccountId, setCurrAccountId] = useState<string | undefined>();

  // Get token and account ID on mount
  useEffect(() => {
    const getToken = async () => {
      const user = await auth.getUser();
      setAccountId(user?.identity?.internal?.account_id ?? null);
      setToken((await auth.getToken()) ?? null);
      setCurrAccountId(user?.identity?.internal?.account_id ?? undefined);
    };
    getToken();
  }, [auth]);

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
  const { data: usersData, isLoading } = useUsersQuery(queryParams, { enabled: !!orgAdmin });
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

  // Handle user status toggle
  const handleToggle = useCallback(
    async (isActive: boolean, updatedUser: User) => {
      if (changeUserStatusMutation.isPending) return;

      try {
        await changeUserStatusMutation.mutateAsync({
          users: [{ ...updatedUser, id: updatedUser.external_source_id, is_active: isActive }],
          config: { isProd: isProd() || false, token, accountId },
          itless: isITLess,
        });
        addNotification({
          variant: 'success',
          title: intl.formatMessage(messages.editUserSuccessTitle),
          dismissable: true,
        });
      } catch (error) {
        console.error('Failed to update status: ', error);
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.editUserErrorTitle),
          dismissable: true,
        });
      }
    },
    [changeUserStatusMutation, isProd, token, accountId, isITLess, addNotification, intl],
  );

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      org_admin: { label: intl.formatMessage(messages.orgAdministrator) },
      username: { label: intl.formatMessage(messages.username), sortable: true },
      email: { label: intl.formatMessage(messages.email) },
      first_name: { label: intl.formatMessage(messages.firstName) },
      last_name: { label: intl.formatMessage(messages.lastName) },
      status: { label: intl.formatMessage(messages.status) },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, User> = useMemo(
    () => ({
      org_admin: (user) => {
        if (isCommonAuthModel && orgAdmin) {
          // external_source_id may be string or number, convert to number for OrgAdminDropdown
          const userId = typeof user.external_source_id === 'string' ? Number(user.external_source_id) : user.external_source_id;
          return (
            <OrgAdminDropdown
              key={`dropdown-${user.username}`}
              isOrgAdmin={user.is_org_admin ?? false}
              username={user.username}
              intl={intl}
              userId={userId}
              fetchData={() => {
                /* React Query will refetch via cache invalidation */
              }}
            />
          );
        }
        return user.is_org_admin ? (
          <Fragment>
            <CheckIcon key="yes-icon" className="pf-v6-u-mr-sm" />
            <span key="yes">{intl.formatMessage(messages.yes)}</span>
          </Fragment>
        ) : (
          <Fragment>
            <CloseIcon key="no-icon" className="pf-v6-u-mr-sm" />
            <span key="no">{intl.formatMessage(messages.no)}</span>
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
            {intl.formatMessage(user.is_active ? messages.active : messages.inactive)}
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
        label: intl.formatMessage(messages.username),
        placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.username).toLowerCase() }),
      },
      {
        type: 'text',
        id: 'email',
        label: intl.formatMessage(messages.email),
        placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.email).toLowerCase() }),
      },
      {
        type: 'checkbox',
        id: 'status',
        label: intl.formatMessage(messages.status),
        options: [
          { id: 'Active', label: intl.formatMessage(messages.active) },
          { id: 'Inactive', label: intl.formatMessage(messages.inactive) },
        ],
      },
    ],
    [intl],
  );

  // Handle bulk status change
  const handleBulkActivation = useCallback(
    async (userStatus: boolean) => {
      if (changeUserStatusMutation.isPending) return;

      const usersList = tableState.selectedRows.map((user) => ({
        ...user,
        id: user.external_source_id,
        is_active: userStatus,
      }));

      try {
        await changeUserStatusMutation.mutateAsync({
          users: usersList,
          config: { isProd: isProd() || false, token, accountId },
          itless: isITLess,
        });
        addNotification({
          variant: 'success',
          title: intl.formatMessage(messages.editUserSuccessTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editUserSuccessDescription),
        });
        tableState.clearSelection();
        // React Query will automatically refetch due to cache invalidation
      } catch (error) {
        console.error('Failed to update status: ', error);
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.editUserErrorTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editUserErrorDescription),
        });
      }

      userStatus ? setIsActivateModalOpen(false) : setIsDeactivateModalOpen(false);
    },
    [changeUserStatusMutation, tableState, isProd, token, accountId, isITLess, addNotification, intl],
  );

  // Toolbar buttons
  const toolbarActions = useMemo(() => {
    if (!orgAdmin || !isCommonAuthModel) return null;
    return (
      <>
        <AppLink to={paths['invite-users'].link()} key="invite-users" className="rbac-m-hide-on-sm">
          <Button ouiaId="invite-users-button" variant="primary" aria-label="Invite users">
            {intl.formatMessage(messages.inviteUsers)}
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
            {intl.formatMessage(messages.activateUsersButton)}
          </DropdownItem>
          <DropdownItem key="deactivate" onClick={() => setIsDeactivateModalOpen(true)}>
            {intl.formatMessage(messages.deactivateUsersButton)}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    );
  }, [orgAdmin, isCommonAuthModel, intl, tableState.selectedRows.length, isKebabOpen]);

  // Show UnauthorizedAccess component for users without proper permissions
  if (!orgAdmin) {
    return <UnauthorizedAccess serviceName="User Access Administration" bodyText="You need Organization Administrator permissions to view users." />;
  }

  return (
    <React.Fragment>
      {isActivateModalOpen && (
        <WarningModal
          ouiaId="toggle-status-modal"
          isOpen={isActivateModalOpen}
          title={intl.formatMessage(messages.activateUsersConfirmationModalTitle)}
          confirmButtonLabel={intl.formatMessage(messages.activateUsersConfirmationButton)}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsActivateModalOpen(false)}
          onConfirm={() => handleBulkActivation(true)}
          withCheckbox
          checkboxLabel={intl.formatMessage(messages.activateUsersConfirmationModalCheckboxText)}
        >
          {intl.formatMessage(messages.activateUsersConfirmationModalDescription)}

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
          title={intl.formatMessage(messages.deactivateUsersConfirmationModalTitle)}
          confirmButtonLabel={intl.formatMessage(messages.deactivateUsersConfirmationButton)}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={() => handleBulkActivation(false)}
          withCheckbox
          checkboxLabel={intl.formatMessage(messages.deactivateUsersConfirmationModalCheckboxText)}
        >
          {intl.formatMessage(messages.deactivateUsersConfirmationModalDescription)}

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
            title={intl.formatMessage(messages.configureItems, { items: intl.formatMessage(messages.users) })}
            body={`${intl.formatMessage(messages.toConfigureUserAccess)} ${intl.formatMessage(messages.createAtLeastOneItem, { item: intl.formatMessage(messages.user) })}`}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.users) })}
            body={`${intl.formatMessage(messages.filterMatchesNoItems, { items: intl.formatMessage(messages.users) })} ${intl.formatMessage(messages.tryChangingFilters)}`}
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
