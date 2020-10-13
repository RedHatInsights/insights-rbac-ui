import React, { useState, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { mappedProps } from '../../../helpers/shared/helpers';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchUsers } from '../../../redux/actions/user-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Label } from '@patternfly/react-core';
import { sortable, cellWidth } from '@patternfly/react-table';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import { defaultCompactSettings, defaultSettings } from '../../../helpers/shared/pagination';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';

const columns = [
  { title: 'Org. Administrator', key: 'org-admin' },
  { title: 'Username', key: 'username', transforms: [sortable] },
  { title: 'Email' },
  { title: 'First name' },
  { title: 'Last name' },
  { title: 'Status', transforms: [cellWidth(10), () => ({ className: 'ins-m-width-5' })] },
];

const createRows = (userLinks) => (data, _expanded, checkedRows = []) => {
  return data
    ? data.reduce(
        (acc, { username, is_active: isActive, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin }) => [
          ...acc,
          {
            uuid: username,
            cells: [
              isOrgAdmin ? (
                <Fragment>
                  <CheckIcon key="yes-icon" className="pf-u-mr-sm" />
                  <span key="yes">Yes</span>
                </Fragment>
              ) : (
                <Fragment>
                  <CloseIcon key="no-icon" className="pf-u-mr-sm" />
                  <span key="no">No</span>
                </Fragment>
              ),
              { title: userLinks ? <Link to={`/users/detail/${username}`}>{username}</Link> : username },
              email,
              firstName,
              lastName,
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

const UsersList = ({ users, fetchUsers, isLoading, pagination, selectedUsers, setSelectedUsers, userLinks, props }) => {
  const [filterValue, setFilterValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [statusValue, setStatusValue] = useState(['Active']);

  useEffect(() => {
    fetchUsers(mappedProps({ ...defaultSettings, status: ['Active'] }));
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedUsers((users) => {
      return newSelection(users).map(({ uuid, username }) => ({ uuid, label: username || uuid }));
    });
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
        const status = Object.prototype.hasOwnProperty.call(config, 'status') ? config.status : statusValue;
        fetchUsers(mappedProps({ ...config, status }));
      }}
      setFilterValue={({ username, email, status }) => {
        typeof username !== 'undefined' && setFilterValue(username);
        typeof email !== 'undefined' && setEmailValue(email);
        typeof statusValue !== undefined && setStatusValue(status);
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
      filters={[
        { key: 'username', value: filterValue, placeholder: 'Filter by exact username' },
        { key: 'email', value: emailValue, placeholder: 'Filter by exact email' },
        {
          key: 'status',
          value: statusValue,
          label: 'Status',
          type: 'checkbox',
          items: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ],
        },
      ]}
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
      dispatch(fetchUsers(mappedProps(apiProps)));
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
  setSelectedUsers: PropTypes.func.isRequired,
  selectedUsers: PropTypes.array,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number,
    count: PropTypes.number,
  }),
  userLinks: PropTypes.bool,
  props: PropTypes.object,
};

UsersList.defaultProps = {
  users: [],
  selectedUsers: [],
  setSelectedUsers: () => undefined,
  userLinks: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
export const CompactUsersList = connect(mapStateToProps, mapDispatchToProps, mergeProps)(UsersList);
