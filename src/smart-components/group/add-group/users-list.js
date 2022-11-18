import React, { useEffect, Fragment, useState, useContext, useRef } from 'react';
import { connect, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, useHistory } from 'react-router-dom';
import { mappedProps } from '../../../helpers/shared/helpers';
import { TableToolbarViewOld } from '../../../presentational-components/shared/table-toolbar-view-old';
import { fetchUsers, updateUsersFilters } from '../../../redux/actions/user-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Label } from '@patternfly/react-core';
import { sortable, nowrap } from '@patternfly/react-table';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import {
  defaultCompactSettings,
  defaultSettings,
  defaultAdminSettings,
  syncDefaultPaginationWithUrl,
  applyPaginationToUrl,
  isPaginationPresentInUrl,
} from '../../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../../helpers/shared/filters';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import PermissionsContext from '../../../utilities/permissions-context';
const createRows =
  (userLinks) =>
  (data, _expanded, checkedRows = []) => {
    const intl = useIntl();
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
                      <span key="yes">{intl.formatMessage(messages.yes)}</span>
                    </span>
                  </Fragment>
                ) : (
                  <Fragment>
                    <CloseIcon key="no-icon" className="pf-u-mr-sm" />
                    <span key="no">{intl.formatMessage(messages.no)}</span>
                  </Fragment>
                ),
                { title: userLinks ? <Link to={`/users/detail/${username}`}>{username.toString()}</Link> : username.toString() },
                email.toString(),
                firstName.toString(),
                lastName.toString(),
                {
                  title: (
                    <Label key="status" color={isActive && 'green'}>
                      {intl.formatMessage(isActive ? messages.active : messages.inactive)}
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
  const { orgAdmin } = useContext(PermissionsContext);
  // user for text filter to focus
  const innerRef = useRef(null);
  const defaultPagination = useSelector(({ userReducer: { users } }) => ({
    limit: inModal ? users.meta.limit : users.pagination.limit || (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
    offset: inModal ? users.meta.offset : users.pagination.offset || (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
    count: inModal ? users.meta.count : users.pagination.count,
    redirected: !inModal && users.pagination.redirected,
  }));
  const intl = useIntl();
  const history = useHistory();

  const columns = [
    { title: intl.formatMessage(messages.orgAdministrator), key: 'org-admin', transforms: [nowrap] },
    { title: intl.formatMessage(messages.username), key: 'username', transforms: [sortable] },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.firstName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.status), transforms: [nowrap] },
  ];

  let stateFilters = useSelector(
    ({
      userReducer: {
        users: { filters },
      },
    }) => (history.location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] })
  );

  const [filters, setFilters] = useState(
    inModal
      ? {
          username: '',
          email: '',
          status: [intl.formatMessage(messages.active)],
        }
      : stateFilters
  );

  useEffect(() => {
    inModal || (defaultPagination.redirected && applyPaginationToUrl(history, defaultPagination.limit, defaultPagination.offset));
  }, [defaultPagination.redirected]);

  useEffect(() => {
    const pagination = inModal ? defaultSettings : syncDefaultPaginationWithUrl(history, defaultPagination);
    const newFilters = inModal ? { status: filters.status } : syncDefaultFiltersWithUrl(history, ['username', 'email', 'status'], filters);
    setFilters(newFilters);
    fetchUsers({ ...mappedProps({ ...pagination, filters: newFilters }), inModal });
  }, []);

  useEffect(() => {
    if (!inModal) {
      isPaginationPresentInUrl(history) || applyPaginationToUrl(history, pagination.limit, pagination.offset);
      Object.values(filters).some((filter) => filter?.length > 0) &&
        !areFiltersPresentInUrl(history, Object.keys(filters)) &&
        syncDefaultFiltersWithUrl(history, Object.keys(filters), filters);
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
    <TableToolbarViewOld
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
        fetchUsers({ ...mappedProps({ count, limit, offset, orderBy, filters: { username, email, status } }), inModal }).then(() => {
          innerRef?.current?.focus();
        });
        inModal || applyPaginationToUrl(history, limit, offset);
        inModal || applyFiltersToUrl(history, { username, email, status });
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
      titlePlural={intl.formatMessage(messages.users).toLowerCase()}
      titleSingular={intl.formatMessage(messages.user)}
      noDataDescription={[
        intl.formatMessage(messages.filterMatchesNoItems, { items: intl.formatMessage(messages.users).toLowerCase() }),
        intl.formatMessage(messages.checkFilterBeginning),
      ]}
      noData={users.length === 0 && !filters.username && !filters.email}
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
      return dispatch(fetchUsers(apiProps));
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
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }),
  users: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchUsers: PropTypes.func.isRequired,
  updateUsersFilters: PropTypes.func.isRequired,
  setSelectedUsers: PropTypes.func.isRequired,
  selectedUsers: PropTypes.array,
  pagination: PropTypes.shape({
    limit: PropTypes.number,
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
