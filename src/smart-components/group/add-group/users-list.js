import React, { useState, useEffect } from 'react';
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

const columns = [
  { title: 'Status', transforms: [ cellWidth(10), () => ({ className: 'ins-m-width-5' }) ]},
  { title: 'Username', key: 'username', transforms: [ sortable ]},
  { title: 'Email' },
  { title: 'First name' },
  { title: 'Last name' }
];

const createRows = (userLinks) => (data, expanded, checkedRows = []) => {
  return data ? data.reduce((acc, { username, is_active: isActive, email, first_name, last_name }) => ([
    ...acc, {
      uuid: username,
      cells: [{
          title: (
            <Label isCompact className={ `ins-c-rbac__user-label ${isActive ? '' : 'ins-m-inactive'}` }>
            {isActive ? 'Active' : 'Inactive'}
          </Label>
        ),
        props: {
          data: { isActive }
        }
      }, { title: userLinks ? <Link to={ `/users/detail/${username}` }>{username}</Link> : username }, email, first_name, last_name ],
      selected: Boolean(checkedRows && checkedRows.find(row => row.uuid === username))
    }
  ]), []) : [];
};

const UsersList = ({ users, fetchUsers, isLoading, pagination, selectedUsers, setSelectedUsers, userLinks, props }) => {
  const [ filterValue, setFilterValue ] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedUsers((users) => {
      return newSelection(users).map(({ uuid, username }) => ({ uuid, label: username || uuid }));
    });
  };

  return <TableToolbarView
    columns={ columns }
    isSelectable={ true }
    isCompact={ true }
    borders={ false }
    createRows={ createRows(userLinks) }
    data={ users }
    filterValue={ filterValue }
    fetchData={ (config) => fetchUsers(mappedProps(config)) }
    setFilterValue={ ({ name }) => setFilterValue(name) }
    isLoading={ isLoading }
    pagination={ pagination }
    checkedRows={ selectedUsers }
    setCheckedItems={ setCheckedItems }
    sortBy={ {
      index: 1,
      direction: 'asc'
    } }
    rowWrapper={ UsersRow }
    filterPlaceholder="exact username"
    titlePlural="users"
    titleSingular="user"
    { ...props }
  />;
};

const mapStateToProps = ({ userReducer: { users, isUserDataLoading }}) => {
  return {
    users: users.data && users.data.map(data => ({ ...data, uuid: data.username })),
    pagination: users.meta,
    isLoading: isUserDataLoading
  };};

const mapDispatchToProps = dispatch => {
  return {
    fetchUsers: (apiProps = defaultSettings) => {
      dispatch(fetchUsers(mappedProps(apiProps)));
    },
    addNotification: (...props) => dispatch(addNotification(...props))
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  return {
    ...ownProps,
    ...propsFromState,
    ...propsFromDispatch,
    fetchUsers: (apiProps) => {
      return propsFromDispatch.fetchUsers(apiProps ? apiProps : defaultCompactSettings);
    }
  };
};

UsersList.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
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
    count: PropTypes.number
  }),
  userLinks: PropTypes.bool,
  props: PropTypes.object
};

UsersList.defaultProps = {
  users: [],
  selectedUsers: [],
  setSelectedUsers: () => undefined,
  userLinks: false
};

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
export const CompactUsersList = connect(mapStateToProps, mapDispatchToProps, mergeProps)(UsersList);
