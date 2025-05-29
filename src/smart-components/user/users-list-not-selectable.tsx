import React, { Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { mappedProps } from '../../helpers/shared/helpers';
import { TableComposableToolbarView } from '../../presentational-components/shared/table-composable-toolbar-view';
import { changeUsersStatus, fetchUsers, updateUsersFilters } from '../../redux/actions/user-actions';
import UsersRow from '../../presentational-components/shared/UsersRow';
import paths from '../../utilities/pathnames';
import {
  applyPaginationToUrl,
  defaultAdminSettings,
  defaultSettings,
  isPaginationPresentInUrl,
  syncDefaultPaginationWithUrl,
} from '../../helpers/shared/pagination';
import { applyFiltersToUrl, areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../helpers/shared/filters';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import PermissionsContext from '../../utilities/permissions-context';
import { UserProps, createRows } from './user-table-helpers';
import { ISortBy } from '@patternfly/react-table';
import { UserFilters } from '../../redux/reducers/user-reducer';
import AppLink from '../../presentational-components/shared/AppLink';
import { Button, ButtonVariant, List, ListItem } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import useAppNavigate from '../../hooks/useAppNavigate';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { WarningModal } from '@patternfly/react-component-groups';

interface UsersListNotSelectable {
  userLinks: boolean;
  usesMetaInURL: boolean;
  props: {
    isSelectable: boolean;
    isCompact: boolean;
  };
}

const UsersListNotSelectable = ({ userLinks, usesMetaInURL, props }: UsersListNotSelectable) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { orgAdmin } = useContext(PermissionsContext);
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const { getBundle, getApp } = useChrome();
  const appNavigate = useAppNavigate(`/${getBundle()}/${getApp()}`);
  // use for text filter to focus
  const innerRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const authModel = useFlag('platform.rbac.common-auth-model');
  const { auth, isProd } = useChrome();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [checkedStates, setCheckedStates] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      setAccountId((await auth.getUser())?.identity?.internal?.account_id as string);
      setToken((await auth.getToken()) as string);
    };
    getToken();
  }, [auth]);

  // for usesMetaInURL (Users page) store pagination settings in Redux, otherwise use results from meta
  const pagination = useSelector(({ userReducer: { users } }) => ({
    limit: (usesMetaInURL ? users.pagination.limit : users.meta.limit) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
    offset: (usesMetaInURL ? users.pagination.offset : users.meta.offset) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
    count: (usesMetaInURL ? users.pagination.count : users.meta.count) ?? 0,
    redirected: usesMetaInURL && users.pagination.redirected,
    itemCount: 0,
  }));

  const { users, isLoading, stateFilters } = useSelector(
    ({
      userReducer: {
        users: { data, filters = {} },
        isUserDataLoading,
      },
    }) => ({
      users: data?.map?.((data: any) => ({ ...data, uuid: data.username })),
      isLoading: isUserDataLoading,
      stateFilters: location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] },
    }),
  );

  const fetchData = useCallback((apiProps: Parameters<typeof fetchUsers>[0]) => dispatch(fetchUsers(apiProps)), [dispatch]);
  const updateStateFilters = useCallback((filters: Parameters<typeof updateUsersFilters>[0]) => dispatch(updateUsersFilters(filters)), [dispatch]);

  const columns = [
    ...(isCommonAuthModel ? [{ title: '', key: 'select' }] : []),
    { title: intl.formatMessage(messages.orgAdministrator), key: 'org-admin' },
    { title: intl.formatMessage(messages.username), key: 'username', sortable: true },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.firstName) },
    { title: intl.formatMessage(messages.lastName) },
    { title: intl.formatMessage(messages.status) },
  ];

  const [sortByState, setSortByState] = useState<ISortBy>({ index: 1, direction: 'asc' });

  const [filters, setFilters] = useState<UserFilters>(
    usesMetaInURL
      ? stateFilters
      : {
          username: '',
          email: '',
          status: [intl.formatMessage(messages.active)],
        },
  );

  useEffect(() => {
    usesMetaInURL && applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
  }, [pagination.offset, pagination.limit, pagination.count, pagination.redirected]);

  useEffect(() => {
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, pagination);
    const newFilters: UserFilters = usesMetaInURL
      ? syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], filters)
      : { status: filters.status };
    if (typeof newFilters.status !== 'undefined' && !Array.isArray(newFilters.status)) {
      newFilters.status = [newFilters.status];
    }
    setFilters(newFilters);
    fetchData({ ...mappedProps({ limit, offset, filters: newFilters }), usesMetaInURL });
  }, []);

  useEffect(() => {
    if (usesMetaInURL) {
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      Object.values(filters).some((filter: unknown[]) => filter?.length > 0) &&
        !areFiltersPresentInUrl(location, Object.keys(filters)) &&
        syncDefaultFiltersWithUrl(location, navigate, Object.keys(filters), filters);
    }
  });

  const updateFilters = (payload: any) => {
    usesMetaInURL && updateStateFilters(payload);
    setFilters({ username: '', ...payload });
  };

  const toolbarButtons = () =>
    orgAdmin && isCommonAuthModel
      ? [
          <AppLink to={paths['invite-users'].link} key="invite-users" className="rbac-m-hide-on-sm">
            <Button ouiaId="invite-users-button" variant="primary" aria-label="Invite users">
              {intl.formatMessage(messages.inviteUsers)}
            </Button>
          </AppLink>,
          {
            label: intl.formatMessage(messages.activateUsersButton),
            props: {},
            onClick: () => setIsActivateModalOpen(true),
          },
          {
            label: intl.formatMessage(messages.deactivateUsersButton),
            props: {},
            onClick: () => setIsDeactivateModalOpen(true),
          },
        ]
      : [];

  const [selectedUsers, setSelectedUsernames] = React.useState<UserProps[]>([]);
  const onSelectUser = (user: UserProps, isSelecting: boolean) => {
    setUserSelected(user, isSelecting);
  };
  const setUserSelected = (user: UserProps, isSelecting = true) => {
    setSelectedUsernames((prevSelected: UserProps[]) => {
      const otherSelectedUserNames = prevSelected.filter((r) => r.username !== user.username);
      user.isSelected = isSelecting;
      return isSelecting ? [...otherSelectedUserNames, user] : otherSelectedUserNames;
    });
  };
  const isUserSelected = (user: UserProps) => selectedUsers.some((r) => r.username === user.username);
  const setCheckedItems = () => {
    users?.forEach((user: UserProps) => setUserSelected(user, !checkedStates));
    setCheckedStates(!checkedStates);
  };

  const handleToggle = async (ev: unknown, isActive: boolean, updatedUsers: any[]) => {
    if (loading) return;
    setLoading(true);

    const usersList = updatedUsers.map((user) => ({ ...user, id: user.external_source_id, is_active: isActive }));
    try {
      await dispatch(changeUsersStatus(usersList, { isProd: isProd(), token, accountId }));
      fetchData({ ...pagination, filters, usesMetaInURL });
    } catch (error) {
      console.error('Failed to update status: ', error);
    } finally {
      setLoading(false);
    }

    setToken(token);
  };

  const handleBulkActivation = (userStatus: boolean) => {
    handleToggle(null, userStatus, selectedUsers);
    userStatus ? setIsActivateModalOpen(false) : setIsDeactivateModalOpen(false);
  };

  return (
    <React.Fragment>
      {isActivateModalOpen && (
        <WarningModal
          ouiaId={`toggle-status-modal`}
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
            {selectedUsers.map((user) => (
              <>
                <ListItem key={user.uuid}>{user.uuid}</ListItem>
              </>
            ))}
          </List>
        </WarningModal>
      )}
      {isDeactivateModalOpen && (
        <WarningModal
          ouiaId={`toggle-status-modal`}
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
            {selectedUsers.map((user) => (
              <>
                <ListItem key={user.uuid}>{user.uuid}</ListItem>
              </>
            ))}
          </List>
        </WarningModal>
      )}
      <TableComposableToolbarView
        setCheckedItems={setCheckedItems}
        toolbarButtons={toolbarButtons}
        borders={false}
        columns={columns}
        checkedRows={selectedUsers}
        rows={createRows(
          userLinks,
          users?.map((user: UserProps) => ({ ...user, isSelected: isUserSelected(user) })),
          intl,
          undefined,
          undefined,
          onSelectUser,
          handleToggle,
          authModel,
          orgAdmin,
          () => fetchData({ ...pagination, filters, usesMetaInURL }),
        )}
        sortBy={sortByState}
        onSort={(e, index, direction) => {
          const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index].key}`;
          setSortByState({ index, direction });
          fetchData({ ...pagination, filters, usesMetaInURL, orderBy });
        }}
        ouiaId="users-table"
        fetchData={(config) => {
          const status = Object.prototype.hasOwnProperty.call(config, 'status') ? config.status : filters.status;
          const { username, email, count, limit, offset, orderBy } = config;

          Promise.resolve(fetchData({ ...mappedProps({ count, limit, offset, orderBy, filters: { username, email, status } }), usesMetaInURL })).then(
            () => {
              if (innerRef !== null && innerRef.current !== null) {
                innerRef.current.focus();
              }
            },
          );
          applyPaginationToUrl(location, navigate, limit || 0, offset || 0);
          usesMetaInURL && applyFiltersToUrl(location, navigate, { username, email, status });
        }}
        emptyFilters={{ username: '', email: '', status: [] }}
        setFilterValue={({ username, email, status }) => {
          updateFilters({
            username: typeof username === 'undefined' ? filters.username : username,
            email: typeof email === 'undefined' ? filters.email : email,
            status: typeof status === 'undefined' || status === filters.status ? filters.status : status,
          });
        }}
        isLoading={isLoading}
        pagination={pagination}
        rowWrapper={UsersRow}
        title={{ singular: intl.formatMessage(messages.user), plural: intl.formatMessage(messages.users).toLowerCase() }}
        filters={[
          {
            key: 'username',
            value: typeof filters?.username === 'object' || typeof filters?.username === 'undefined' ? '' : filters.username,
            placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.username).toLowerCase() }),
            innerRef,
          },
          {
            key: 'email',
            value: filters.email || '',
            placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.email).toLowerCase() }),
            innerRef,
          },
          {
            key: 'status',
            value: filters.status || [],
            label: intl.formatMessage(messages.status),
            type: 'checkbox',
            items: [
              { label: intl.formatMessage(messages.active), value: 'Active' },
              { label: intl.formatMessage(messages.inactive), value: 'Inactive' },
            ],
          },
        ]}
        tableId="users-list"
        {...props}
      />
      <Suspense>
        <Outlet
          context={{
            fetchData: (isSubmit: boolean) => {
              appNavigate(paths['users'].link);
              if (isSubmit) {
                fetchData({ ...pagination, filters, usesMetaInURL });
              }
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};

export default UsersListNotSelectable;
