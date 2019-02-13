import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import propTypes from 'prop-types';
import { Route, Link } from 'react-router-dom';
import { Toolbar, ToolbarGroup, ToolbarItem, Button } from '@patternfly/react-core';
import { Section } from '@red-hat-insights/insights-frontend-components';
import GroupsFilterToolbar from '../../PresentationalComponents/Group/GroupsFilterToolbar';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import { fetchUsers } from '../../redux/Actions/UserActions';
import AddGroup from './add-group-modal';
import RemoveGroup from './remove-group-modal';
import GroupList from './GroupList';
import './group.scss';
import { scrollToTop } from '../../Helpers/Shared/helpers';
import { fetchUsersByGroupId } from '../../redux/Actions/GroupActions';

class Groups extends Component {
    state = {
      filteredItems: [],
      isOpen: false,
      filterValue: ''
    };

    fetchData = () => {
      this.props.fetchGroups();
      this.props.fetchUsers();
    };

    componentDidMount() {
      this.fetchData();
      scrollToTop();
    }

    onFilterChange = filterValue => this.setState({ filterValue })

    renderToolbar() {
      return (
        <Toolbar className="searchToolbar">
          <GroupsFilterToolbar onFilterChange={ this.onFilterChange } filterValue={ this.state.filterValue }/>
          <ToolbarGroup>
            <ToolbarItem>
              <Link to="/groups/add-group">
                <Button
                  variant="primary"
                  aria-label="Create Group"
                >
                Create Group
                </Button>
              </Link>
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      );
    }

    render() {
      let filteredItems = {
        items: this.props.groups
        .filter(({ name }) => name.toLowerCase().includes(this.state.filterValue.trim().toLowerCase())),
        isLoading: this.props.isLoading && this.props.groups.length === 0
      };

      return (
        <Fragment>
          <Route exact path="/groups/add-group" component={ AddGroup } />
          <Route exact path="/groups/edit/:id" component={ AddGroup } />
          <Route exact path="/groups/remove/:id" component={ RemoveGroup } />
          <Section type='content'>
            { this.renderToolbar() }
            <GroupList { ...filteredItems } noItems={ 'No Groups' } fetchUsersBYGroupId={ this.props.fetchUsersByGroupId} />
          </Section>
        </Fragment>
      );
    }
}

const mapStateToProps = (state) => {
  return {
    groups: state.groupReducer.groups,
    users: state.userReducer.users,
    isLoading: state.groupReducer.isLoading,
    searchFilter: state.userReducer.filterValue
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchGroups: apiProps => dispatch(fetchGroups(apiProps)),
    fetchUsersByGroupId: apiProps => dispatch(fetchUsersByGroupId(apiProps)),
    fetchUsers: apiProps => dispatch(fetchUsers(apiProps))
  };
};

Groups.propTypes = {
  filteredItems: propTypes.array,
  groups: propTypes.array,
  platforms: propTypes.array,
  isLoading: propTypes.bool,
  searchFilter: propTypes.string,
  fetchGroups: propTypes.func.isRequired,
  fetchUsers: propTypes.func.isRequired,
  fetchUsersByGroupId: propTypes.func.isRequired
};

Groups.defaultProps = {
  groups: []
};

export default connect(mapStateToProps, mapDispatchToProps)(Groups);
