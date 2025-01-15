import React, { useEffect, useState, useContext, useRef, useCallback, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { mappedProps } from '../../helpers/shared/helpers';
import { TableComposableToolbarView } from '../../presentational-components/shared/table-composable-toolbar-view';
import { fetchUsers, updateUsersFilters } from '../../redux/actions/user-actions';
import UsersRow from '../../presentational-components/shared/UsersRow';
import paths from '../../utilities/pathnames';
import {
  defaultSettings,
  defaultAdminSettings,
  syncDefaultPaginationWithUrl,
  applyPaginationToUrl,
  isPaginationPresentInUrl,
} from '../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../helpers/shared/filters';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import PermissionsContext from '../../utilities/permissions-context';
import { createRows } from './user-table-helpers';
import { ISortBy } from '@patternfly/react-table';
import { UserFilters } from '../../redux/reducers/user-reducer';
import AppLink from '../../presentational-components/shared/AppLink';
import { Button } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import useAppNavigate from '../../hooks/useAppNavigate';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

interface UsersListNotSelectableI {
  userLinks: boolean;
  usesMetaInURL: boolean;
  props: Record<string, unknown>;
}

const UsersListNotSelectable = ({ userLinks, usesMetaInURL, props }: UsersListNotSelectableI) => {
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
    })
  );

  const fetchData = useCallback((apiProps: Parameters<typeof fetchUsers>[0]) => dispatch(fetchUsers(apiProps)), [dispatch]);
  const updateStateFilters = useCallback((filters: Parameters<typeof updateUsersFilters>[0]) => dispatch(updateUsersFilters(filters)), [dispatch]);

  const columns = [
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
        }
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

  const toolbarButtons = () => [
    <AppLink to={paths['invite-users'].link} key="invite-users" className="rbac-m-hide-on-sm">
      <Button ouiaId="invite-users-button" variant="primary" aria-label="Invite users">
        {intl.formatMessage(messages.inviteUsers)}
      </Button>
    </AppLink>,
  ];

  return (
    <React.Fragment>
      <TableComposableToolbarView
        toolbarButtons={orgAdmin && isCommonAuthModel ? toolbarButtons : () => [] as React.ReactNode[]}
        isSelectable={false}
        isCompact={false}
        borders={false}
        columns={columns}
        rows={createRows(userLinks, users, intl, undefined, undefined, authModel, orgAdmin)}
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
            }
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
