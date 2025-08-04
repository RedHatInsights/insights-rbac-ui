import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { nowrap, sortable } from '@patternfly/react-table';
import { mappedProps } from '../../../helpers/dataUtilities';
import { fetchUsers, updateUsersFilters } from '../../../redux/users/actions';
import { TableToolbarView } from '../../../components/tables/TableToolbarView';
import { UsersRow } from '../../users/components/UsersRow';
import PermissionsContext from '../../../utilities/permissionsContext';
import {
  applyPaginationToUrl,
  defaultAdminSettings,
  defaultSettings,
  isPaginationPresentInUrl,
  syncDefaultPaginationWithUrl,
} from '../../../helpers/pagination';
import { applyFiltersToUrl, areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../../helpers/urlFilters';
import messages from '../../../Messages';
import { createRows } from '../../users/user-table-helpers';

const UsersList = ({ selectedUsers, setSelectedUsers, userLinks, usesMetaInURL, displayNarrow, props }) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { orgAdmin } = useContext(PermissionsContext);
  // use for text filter to focus
  const innerRef = useRef(null);

  // for usesMetaInURL (Users page) store pagination settings in Redux, otherwise use results from meta
  let pagination = useSelector(({ userReducer: { users } }) => ({
    limit: (usesMetaInURL ? users.pagination.limit : users.meta.limit) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
    offset: (usesMetaInURL ? users.pagination.offset : users.meta.offset) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
    count: usesMetaInURL ? users.pagination.count : users.meta.count,
    redirected: usesMetaInURL && users.pagination.redirected,
  }));

  const { users, isLoading, stateFilters } = useSelector(
    ({
      userReducer: {
        users: { data, filters = {} },
        isUserDataLoading,
      },
    }) => ({
      users: data?.map?.((data) => ({ ...data, uuid: data.username })),
      isLoading: isUserDataLoading,
      stateFilters: location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] },
    }),
  );

  const fetchData = useCallback((apiProps) => dispatch(fetchUsers(apiProps)), [dispatch]);
  const updateStateFilters = useCallback((filters) => dispatch(updateUsersFilters(filters)), [dispatch]);
  const columns = [
    { title: intl.formatMessage(displayNarrow ? messages.orgAdmin : messages.orgAdministrator), key: 'org-admin', transforms: [nowrap] },
    { title: intl.formatMessage(messages.username), key: 'username', transforms: [sortable] },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.firstName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.status), transforms: [nowrap] },
  ];
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' });

  const [filters, setFilters] = useState(
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
    const newFilters = usesMetaInURL
      ? syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], filters)
      : { status: filters.status };
    setFilters(newFilters);
    fetchData({ ...mappedProps({ limit, offset, filters: newFilters }), usesMetaInURL });
  }, []);

  useEffect(() => {
    if (usesMetaInURL) {
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      Object.values(filters).some((filter) => filter?.length > 0) &&
        !areFiltersPresentInUrl(location, Object.keys(filters)) &&
        syncDefaultFiltersWithUrl(location, navigate, Object.keys(filters), filters);
    }
  });

  const setCheckedItems = (newSelection) => {
    setSelectedUsers((users) => {
      // Handle both function signatures
      if (typeof newSelection === 'function') {
        // newSelection is a function that takes the current users and returns selected items
        return newSelection(users).map(({ uuid, username }) => ({ uuid, label: username || uuid }));
      } else {
        // newSelection is an array of selected items directly
        return newSelection.map(({ uuid, username }) => ({ uuid, label: username || uuid }));
      }
    });
  };

  const updateFilters = (payload) => {
    usesMetaInURL && updateStateFilters(payload);
    setFilters({ username: '', ...payload });
  };

  return (
    <TableToolbarView
      isCompact
      isSelectable
      borders={false}
      columns={columns}
      rows={createRows(userLinks, users, intl, selectedUsers, true)}
      sortBy={sortByState}
      onSort={(e, index, direction) => {
        const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index - 1].key}`;
        setSortByState({ index, direction });
        fetchData({ ...pagination, filters, usesMetaInURL, orderBy });
      }}
      data={users}
      ouiaId="users-table"
      fetchData={(config) => {
        const status = Object.prototype.hasOwnProperty.call(config, 'status') ? config.status : filters.status;
        const { username, email, count, limit, offset, orderBy } = config;

        fetchData({ ...mappedProps({ count, limit, offset, orderBy, filters: { username, email, status } }), usesMetaInURL }).then(() => {
          innerRef?.current?.focus();
        });
        usesMetaInURL && applyFiltersToUrl(location, navigate, { username, email, status });
      }}
      emptyFilters={{ username: '', email: '', status: '' }}
      setFilterValue={({ username, email, status }) => {
        updateFilters({
          username: typeof username === 'undefined' ? filters.username : username,
          email: typeof email === 'undefined' ? filters.email : email,
          status: typeof status === 'undefined' || status === filters.status ? filters.status : status,
        });
      }}
      isLoading={isLoading}
      pagination={pagination}
      checkedRows={selectedUsers}
      setCheckedItems={setCheckedItems}
      rowWrapper={UsersRow}
      titlePlural={intl.formatMessage(messages.users).toLowerCase()}
      titleSingular={intl.formatMessage(messages.user)}
      filters={[
        {
          key: 'username',
          value: filters.username,
          placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.username).toLowerCase() }),
          innerRef,
        },
        {
          key: 'email',
          value: filters.email,
          placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.email).toLowerCase() }),
          innerRef,
        },
        {
          key: 'status',
          value: filters.status,
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
  );
};

UsersList.propTypes = {
  displayNarrow: PropTypes.bool,
  users: PropTypes.array,
  searchFilter: PropTypes.string,
  setSelectedUsers: PropTypes.func.isRequired,
  selectedUsers: PropTypes.array,
  userLinks: PropTypes.bool,
  props: PropTypes.object,
  usesMetaInURL: PropTypes.bool,
};

UsersList.defaultProps = {
  displayNarrow: false,
  users: [],
  selectedUsers: [],
  setSelectedUsers: () => undefined,
  userLinks: false,
  usesMetaInURL: false,
};

export default UsersList;
