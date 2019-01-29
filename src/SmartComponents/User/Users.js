import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import propTypes from 'prop-types';
import { Route, Link } from 'react-router-dom';
import { Toolbar, ToolbarGroup, ToolbarItem, Button } from '@patternfly/react-core';
import ExpandableList from '../../SmartComponents/ContentList/ExpandableList';
import ContentList from '../../SmartComponents/ContentList/ContentList';
import UserDetail from '../../PresentationalComponents/User/UserDetail';
import UsersFilterToolbar from '../../PresentationalComponents/User/UsersFilterToolbar';
import { fetchUsers } from '../../redux/Actions/UserActions';
import AddUser from './add-user-modal';
import RemoveUser from './remove-user-modal';
import './user.scss';
import { scrollToTop } from '../../Helpers/Shared/helpers';

class Users extends Component {
    state = {
      filteredItems: [],
      isOpen: false,
      filterValue: ''
    };

    fetchData = () => {
      this.props.fetchUsers();
    };

    componentDidMount() {
      this.fetchData();
      scrollToTop();
    }

    onFilterChange = filterValue => this.setState({ filterValue })

    renderToolbar() {
      return (
        <Toolbar>
          <UsersFilterToolbar onFilterChange={ this.onFilterChange } filterValue={ this.state.filterValue }/>
          <ToolbarGroup>
            <ToolbarItem>
              <Link to="/users/add-user">
                <Button
                  variant="primary"
                  aria-label="Create User"
                >
                Create User
                </Button>
              </Link>
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      );
    }

    render() {
      let filteredItems = {
        items: this.props.users
        .filter(({ name }) => name.toLowerCase().includes(this.state.filterValue.trim().toLowerCase()))
        .map(item => <UserDetail key={ item.id } { ...item } />),
        isLoading: this.props.isLoading && this.props.users.length === 0
      };

      return (
        <Fragment>
          <Route exact path="/users/add-user" component={ AddUser } />
          <Route exact path="/users/edit/:id" component={ AddUser } />
          <Route exact path="/users/remove/:id" component={ RemoveUser } />
          { this.renderToolbar() }
          <ContentList { ...filteredItems } noItems={ 'No Approvers'} />
        </Fragment>
      );
    }
}

const mapStateToProps = ({ userReducer: { users, isLoading, filterValue }}) => ({
  users,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchUsers: apiProps => dispatch(fetchUsers(apiProps))
  };
};

Users.propTypes = {
  filteredItems: propTypes.array,
  users: propTypes.array,
  isLoading: propTypes.bool,
  searchFilter: propTypes.string,
  fetchUsers: propTypes.func.isRequired
};

Users.defaultProps = {
  users: []
};

export default connect(mapStateToProps, mapDispatchToProps)(Users);
