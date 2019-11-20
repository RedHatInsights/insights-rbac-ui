import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchUsers } from '../../../redux/actions/user-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';

const columns = [
  { title: 'User name', orderBy: 'name' },
  { title: 'Email' },
  { title: 'First name' },
  { title: 'Last name' }
];

const createRows = (data, expanded, checkedRows = []) => {
  console.log(data);
  return data ? data.reduce((acc, { username, email, first_name, last_name }) => ([
    ...acc, {
      uuid: username,
      cells: [ username, email, first_name, last_name ],
      selected: Boolean(checkedRows && checkedRows.find(row => row.uuid === username))
    }
  ]), []) : [];
};

const UsersList = ({ users, fetchUsers, isLoading, pagination, selectedUsers, setSelectedUsers }) => {
  const [ filterValue, setFilterValue ] = useState('');

  useEffect(() => {
    fetchUsers({});
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedUsers((users) => {
      return newSelection(users).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  console.log('render', users);
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
    request={ fetchUsers }
    checkedRows={ selectedUsers }
    setCheckedItems={ setCheckedItems }
    titlePlural="users"
    titleSingular="user"
  />;
};

const mapStateToProps = ({ userReducer: { users, isUserDataLoading }}) => {
  console.log(users, isUserDataLoading);
  return {
    users: users.data,
    pagination: users.meta,
    isLoading: isUserDataLoading
  };};

const mapDispatchToProps = dispatch => {
  return {
    fetchUsers: (apiProps) => {
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
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  })
};

UsersList.defaultProps = {
  users: [],
  pagination: defaultCompactSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(UsersList);
