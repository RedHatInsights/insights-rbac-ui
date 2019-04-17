import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import propTypes from 'prop-types';
import { Route } from 'react-router-dom';
import UserList from './UserList';
import UsersFilterToolbar from '../../PresentationalComponents/User/UsersFilterToolbar';
import { fetchUsers } from '../../redux/Actions/UserActions';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import { TableToolbar } from '@red-hat-insights/insights-frontend-components/components/TableToolbar';
import AddUser from './add-user-modal';
import RemoveUser from './remove-user-modal';
import { scrollToTop } from '../../Helpers/Shared/helpers';
import { fetchGroupsByUserId } from '../../redux/Actions/UserActions';

import './user.scss';

class Users extends Component {
    state = {
      filteredItems: [],
      isOpen: false,
      filterValue: ''
    };

    fetchData = () => {
      this.props.fetchUsers();
      this.props.fetchGroups();
    };

    componentDidMount() {
      this.fetchData();
      scrollToTop();
    }

  onFilterChange = filterValue => this.setState({ filterValue })

  renderToolbar() {
    return (
      <TableToolbar>
        <UsersFilterToolbar onFilterChange={ this.onFilterChange } filterValue={ this.state.filterValue } />
      </TableToolbar>
    );
  }

  render() {
    let filteredItems = {
      items: this.props.users
      .filter(({ email }) => email.toLowerCase().includes(this.state.filterValue.trim().toLowerCase())),
      isLoading: this.props.isLoading && this.props.users.length === 0
    };

    return (
      <Fragment>
        <Route exact path="/users/add-user" component={ AddUser } />
        <Route exact path="/users/edit/:id" component={ AddUser } />
        <Route exact path="/users/remove/:id" component={ RemoveUser } />
        { this.renderToolbar() }
        <UserList { ...filteredItems } noItems={ 'No Principals' } fetchGroupsByUserId={ this.props.fetchGroupsByUserId }/>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    users: state.userReducer.users,
    isLoading: state.userReducer.isUserDataLoading,
    groups: state.groupReducer.groups,
    searchFilter: state.userReducer.filterValue
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchUsers: apiProps => dispatch(fetchUsers(apiProps)),
    fetchGroupsByUserId: apiProps => dispatch(fetchGroupsByUserId(apiProps)),
    fetchGroups: apiProps => dispatch(fetchGroups(apiProps))
  };
};

Users.propTypes = {
  filteredItems: propTypes.array,
  users: propTypes.array,
  isLoading: propTypes.bool,
  searchFilter: propTypes.string,
  fetchUsers: propTypes.func.isRequired,
  fetchGroups: propTypes.func.isRequired,
  fetchGroupsByUserId: propTypes.func.isRequired
};

Users.defaultProps = {
  users: []
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);
