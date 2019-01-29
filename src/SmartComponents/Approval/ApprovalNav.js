import React, { Component } from 'react';
import propTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Nav, NavGroup, NavItem } from '@patternfly/react-core';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { fetchUsers } from '../../redux/Actions/UserActions';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import './approval.scss';
import { NavLoader } from '../../PresentationalComponents/Shared/LoaderPlaceholders';

const USER_URL_BASE = '/user';
const USERS_URL_BASE = '/users';
const GROUP_URL_BASE = '/group';
const GROUPS_URL_BASE = '/groups';

class ApprovalNav extends Component {

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    this.props.fetchUsers();
    this.props.fetchGroups();
  }

  userNavItems = () => this.props.users.map(item => (
    <NavItem key={ item.id } id={ item.id } groupId="users">
      <NavLink to={ `${USER_URL_BASE}/${item.id}` }>
        { item.name }
      </NavLink>
    </NavItem>
  ))

  groupNavItems = () => this.props.groups.map(item => (
    <NavItem key={ item.id } id={ item.id }>
      <NavLink to={ `${GROUP_URL_BASE}/${item.id}` }>
        { item.name }
      </NavLink>
    </NavItem>
  ));

  renderUserNav = () => this.props.isUserDataLoading && this.props.users.length === 0
    ? <NavLoader items={ 3 } />
    : this.userNavItems()

  renderGroupNav = () => this.props.isLoading && this.props.groups.length === 0
    ? <NavLoader items={ 5 } />
    : this.groupNavItems()

  render() {
    return (
      <Nav aria-label="Approval" className="approval-nav">
        <NavGroup title="Users">
          <NavItem key='all' id="all-users">
            <NavLink exact to={ USERS_URL_BASE }>
            All Users
            </NavLink>
          </NavItem>
          { this.renderUserNav() }
        </NavGroup>
        <NavGroup title="Groups">
          <NavItem key='all' id="all-groups">
            <NavLink exact to={ GROUPS_URL_BASE }>
              All Groups
            </NavLink>
          </NavItem>
          { this.renderGroupNav() }
        </NavGroup>
      </Nav>
    );
  }
}

const mapStateToProps = ({
  userReducer: { users, isUserDataLoading },
  groupReducer: { isLoading, groups }
}) => ({
  isUserDataLoading,
  users,
  isLoading,
  groups
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchUsers,
  fetchGroups
}, dispatch);

ApprovalNav.propTypes = {
  users: propTypes.array,
  groups: propTypes.array,
  isUserDataLoading: propTypes.bool,
  fetchUsers: propTypes.func,
  fetchGroups: propTypes.func,
  isLoading: propTypes.bool
};

ApprovalNav.defaultProps = {
  users: []
};

export default connect(mapStateToProps, mapDispatchToProps)(ApprovalNav);
