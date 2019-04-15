import React, { Component, Fragment } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import { TableToolbar } from '@red-hat-insights/insights-frontend-components/components/TableToolbar';

import UserList from './UserList';
import { scrollToTop } from '../../Helpers/Shared/helpers';
import { fetchUsers } from '../../redux/Actions/UserActions';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import UsersFilterToolbar from '../../PresentationalComponents/User/UsersFilterToolbar';

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
        { this.renderToolbar() }
        <UserList { ...filteredItems } noItems={ 'No Principals' }/>
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
    fetchGroups: apiProps => dispatch(fetchGroups(apiProps))
  };
};

Users.propTypes = {
  filteredItems: propTypes.array,
  users: propTypes.array,
  isLoading: propTypes.bool,
  searchFilter: propTypes.string,
  fetchUsers: propTypes.func.isRequired,
  fetchGroups: propTypes.func.isRequired
};

Users.defaultProps = {
  users: []
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);
