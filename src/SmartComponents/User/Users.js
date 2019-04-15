import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { TableToolbar } from '@red-hat-insights/insights-frontend-components/components/TableToolbar';

import UserList from './UserList';
import { scrollToTop } from '../../Helpers/Shared/helpers';
import { fetchUsers } from '../../redux/Actions/UserActions';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import UsersFilterToolbar from '../../PresentationalComponents/User/UsersFilterToolbar';

const Users = ({ users, isLoading, fetchUsers, fetchGroups }) => {
  const [ filterValue, setFiltervalue ] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    scrollToTop();
  }, []);

  let filteredItems = {
    items: users
    .filter(({ email }) => email.toLowerCase().includes(filterValue.trim().toLowerCase())),
    isLoading: isLoading && users.length === 0
  };

  return (
    <Fragment>
      <TableToolbar>
        <UsersFilterToolbar onFilterChange={ value => setFiltervalue(value) } filterValue={ filterValue } />
      </TableToolbar>
      <UserList { ...filteredItems } noItems={ 'No Principals' }/>
    </Fragment>
  );
};

const mapStateToProps = ({ userReducer: { users, isUserDataLoading }, groupReducer: { groups }}) => ({
  users,
  isLoading: isUserDataLoading,
  groups
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchUsers,
  fetchGroups
}, dispatch);

Users.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    email: PropTypes.string.isRequired
  })),
  isLoading: PropTypes.bool,
  fetchUsers: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired
};

Users.defaultProps = {
  users: []
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);
