import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchUsers } from '../../../redux/actions/user-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { Label } from '@patternfly/react-core';
import { sortable, cellWidth } from '@patternfly/react-table';
import UsersRow from '../../../presentational-components/shared/UsersRow';

const columns = [
  { title: 'Status', transforms: [ cellWidth(10), () => ({ className: 'ins-m-width-5' }) ]},
  { title: 'Username', key: 'username', transforms: [ sortable ]},
  { title: 'Email' },
  { title: 'First name' },
  { title: 'Last name' }
];

const createRows = (data, expanded, checkedRows = []) => {
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
      }, username, email, first_name, last_name ],
      selected: Boolean(checkedRows && checkedRows.find(row => row.uuid === username))
    }
  ]), []) : [];
};

const UsersList = ({ users, fetchUsers, isLoading, pagination, selectedUsers, setSelectedUsers, props }) => {
  const [ filterValue, setFilterValue ] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedUsers((users) => {
      return newSelection(users).map(({ uuid, name, username, label }) => ({ uuid, label: label || name || username }));
    });
  };

  return <TableToolbarView
    columns={ columns }
    isSelectable={ true }
    isCompact={ true }
    borders={ false }
    createRows={ createRows }
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
    fetchUsers: (apiProps = { limit: 10, offset: 0 }) => {
      dispatch(fetchUsers(mappedProps(apiProps)));
    },
    addNotification: (...props) => dispatch(addNotification(...props))
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
  props: PropTypes.object
};

UsersList.defaultProps = {
  users: [],
  pagination: defaultCompactSettings,
  selectedUsers: [],
  setSelectedUsers: () => undefined
};

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
