import React, { useEffect, Fragment, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { mappedProps } from '../../../helpers/shared/helpers';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchUsers, updateUsersFilters } from '../../../redux/actions/user-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Label } from '@patternfly/react-core';
import { sortable, nowrap } from '@patternfly/react-table';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import {
  defaultCompactSettings,
  defaultSettings,
  syncDefaultPaginationWithUrl,
  applyPaginationToUrl,
  isPaginationPresentInUrl,
} from '../../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../../helpers/shared/filters';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';

const columns = [
  { title: 'Org. Administrator', key: 'org-admin', transforms: [nowrap] },
  { title: 'Username', key: 'username', transforms: [sortable] },
  { title: 'Email' },
  { title: 'First name', transforms: [nowrap] },
  { title: 'Last name', transforms: [nowrap] },
  { title: 'Status', transforms: [nowrap] },
];

const createRows =
  (userLinks) =>
  (data, _expanded, checkedRows = []) => {
    return data
      ? data.reduce(
          (acc, { username, is_active: isActive, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin }) => [
            ...acc,
            {
              uuid: username,
              cells: [
                isOrgAdmin ? (
                  <Fragment>
                    <span>
                      <CheckIcon key="yes-icon" className="pf-u-mr-sm" />
                      <span key="yes">Yes</span>
                    </span>
                  </Fragment>
                ) : (
                  <Fragment>
                    <CloseIcon key="no-icon" className="pf-u-mr-sm" />
                    <span key="no">No</span>
                  </Fragment>
                ),
                { title: userLinks ? <Link to={`detail/${username}`}>{username.toString()}</Link> : username.toString() },
                email.toString(),
                firstName.toString(),
                lastName.toString(),
                {
                  title: (
                    <Label key="status" color={isActive && 'green'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Label>
                  ),
                  props: {
                    'data-is-active': isActive,
                  },
                },
              ],
              selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === username)),
            },
          ],
          []
        )
      : [];
  };

const UsersList = ({ users, fetchUsers, updateUsersFilters, isLoading, pagination, selectedUsers, setSelectedUsers, userLinks, inModal, props }) => {
  const defaultPagination = useSelector(({ userReducer: { users } }) => ({
    limit: inModal ? users.meta.limit : users.pagination.limit || defaultSettings.limit,
    offset: inModal ? users.meta.offset : users.pagination.offset || defaultSettings.offset,
    count: inModal ? users.meta.count : users.pagination.count,
    redirected: !inModal && users.pagination.redirected,
  }));

  const location = useLocation();
  const navigate = useNavigate();

  let stateFilters = useSelector(
    ({
      userReducer: {
        users: { filters },
      },
    }) => (location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] })
  );

  const [filters, setFilters] = useState(
    inModal
      ? {
          username: '',
          email: '',
          status: ['Active'],
        }
      : stateFilters
  );

  useEffect(() => {
    inModal || (defaultPagination.redirected && applyPaginationToUrl(location, navigate, defaultPagination.limit, defaultPagination.offset));
  }, [defaultPagination.redirected]);

  useEffect(() => {
    const pagination = inModal ? defaultSettings : syncDefaultPaginationWithUrl(location, navigate, defaultPagination);
    const newFilters = inModal ? { status: filters.status } : syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], filters);
    setFilters(newFilters);
    fetchUsers({ ...mappedProps({ ...pagination, filters: newFilters }), inModal });
  }, []);

  useEffect(() => {
    if (!inModal) {
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      Object.values(filters).some((filter) => filter?.length > 0) &&
        !areFiltersPresentInUrl(location, Object.keys(filters)) &&
        syncDefaultFiltersWithUrl(location, navigate, Object.keys(filters), filters);
    }
  });

  const setCheckedItems = (newSelection) => {
    setSelectedUsers((users) => {
      return newSelection(users).map(({ uuid, username }) => ({ uuid, label: username || uuid }));
    });
  };

  const updateFilters = (payload) => {
    inModal || updateUsersFilters(payload);
    setFilters({ username: '', ...payload });
  };

  return (
    <TableToolbarView
      columns={columns}
      isSelectable
      isCompact={true}
      borders={false}
      createRows={createRows(userLinks)}
      data={users}
      ouiaId="users-table"
      fetchData={(config) => {
        const status = Object.prototype.hasOwnProperty.call(config, 'status') ? config.status : filters.status;
        const { username, email, count, limit, offset, orderBy } = config;
        fetchUsers({ ...mappedProps({ count, limit, offset, orderBy, filters: { username, email, status } }), inModal });
        inModal || applyPaginationToUrl(location, navigate, limit, offset);
        inModal || applyFiltersToUrl(location, navigate, { username, email, status });
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
      sortBy={{
        index: 1,
        direction: 'asc',
      }}
      rowWrapper={UsersRow}
      titlePlural="users"
      titleSingular="user"
      noDataDescription={[
        'This filter criteria matches no users.',
        'Make sure the beginning of your search input corresponds to the beginning of the value you are looking for, or try changing your filter settings.',
      ]}
      noData={users.length === 0 && !filters.username && !filters.email}
      filters={[
        { key: 'username', value: filters.username, placeholder: 'Filter by username' },
        { key: 'email', value: filters.email, placeholder: 'Filter by email' },
        {
          key: 'status',
          value: filters.status,
          label: 'Status',
          type: 'checkbox',
          items: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ],
        },
      ]}
      tableId="users-list"
      {...props}
    />
  );
};

const mapStateToProps = ({ userReducer: { users, isUserDataLoading } }) => {
  return {
    users: users.data && users.data.map((data) => ({ ...data, uuid: data.username })),
    pagination: users.meta,
    isLoading: isUserDataLoading,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchUsers: (apiProps = defaultSettings) => {
      dispatch(fetchUsers(apiProps));
    },
    updateUsersFilters: (filters) => {
      dispatch(updateUsersFilters(filters));
    },
    addNotification: (...props) => dispatch(addNotification(...props)),
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  return {
    ...ownProps,
    ...propsFromState,
    ...propsFromDispatch,
    fetchUsers: (apiProps) => {
      return propsFromDispatch.fetchUsers(apiProps ? apiProps : defaultCompactSettings);
    },
  };
};

UsersList.propTypes = {
  users: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchUsers: PropTypes.func.isRequired,
  updateUsersFilters: PropTypes.func.isRequired,
  setSelectedUsers: PropTypes.func.isRequired,
  selectedUsers: PropTypes.array,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number,
    count: PropTypes.number,
  }),
  userLinks: PropTypes.bool,
  props: PropTypes.object,
  inModal: PropTypes.bool,
};

UsersList.defaultProps = {
  users: [],
  selectedUsers: [],
  setSelectedUsers: () => undefined,
  userLinks: false,
  inModal: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
export const CompactUsersList = connect(mapStateToProps, mapDispatchToProps, mergeProps)(UsersList);
