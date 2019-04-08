import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, Link } from 'react-router-dom';
import debouncePromise from 'awesome-debounce-promise';
import { Section } from '@red-hat-insights/insights-frontend-components';
import { Toolbar, ToolbarGroup, ToolbarItem, Button } from '@patternfly/react-core';
import { Table, TableHeader, TableBody, expandable } from '@patternfly/react-table';
import { Pagination } from '@red-hat-insights/insights-frontend-components/components/Pagination';

import AddGroup from './add-group-modal';
import RemoveGroup from './remove-group-modal';
import { fetchUsers } from '../../redux/Actions/UserActions';
import { createInitialRows } from './group-table-helpers';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import { fetchUsersByGroupId } from '../../redux/Actions/GroupActions';
import { scrollToTop, getCurrentPage, getNewPage } from '../../Helpers/Shared/helpers';
import GroupsFilterToolbar from '../../PresentationalComponents/Group/GroupsFilterToolbar';

import './group.scss';

const columns = [{
  title: 'Name',
  cellFormatters: [ expandable ]
},
'Description',
'Members'
];

class Groups extends Component {
    state = {
      filteredItems: [],
      isOpen: false,
      filterValue: '',
      rows: []
    };

    fetchData = () => {
      this.props.fetchGroups().then(() => this.setState({ rows: createInitialRows(this.props.groups) }));
      this.props.fetchUsers();
    };

    componentDidMount() {
      this.fetchData();
      scrollToTop();
    }

    handleOnPerPageSelect = limit => this.props.fetchGroups({
      offset: this.props.pagination.offset,
      limit
    }).then(() => this.setState({ rows: createInitialRows(this.props.groups) }));

    handleSetPage = (number, debounce) => {
      const options = {
        offset: getNewPage(number, this.props.pagination.limit),
        limit: this.props.pagination.limit
      };
      const request = () => this.props.fetchGroups(options);
      if (debounce) {
        return debouncePromise(request, 250)();
      }

      return request().then(() => this.setState({ rows: createInitialRows(this.props.groups) }));
    }

    setOpen = (data, uuid) => data.map(row => {
      if (row.uuid === uuid) {
        return {
          ...row,
          isOpen: !row.isOpen
        };
      }

      return { ...row };
    });

    setSelected = (data, uuid) => data.map(row => {
      if (row.uuid === uuid) {
        return {
          ...row,
          selected: !row.selected
        };
      }

      return { ...row };
    })

    onFilterChange = filterValue => this.setState({ filterValue })

    onCollapse = (_event, _index, _isOpen, { uuid }) => this.setState(({ rows }) => ({ rows: this.setOpen(rows, uuid) }));

    selectRow = (_event, selected, index, { uuid } = {}) => index === -1
      ? this.setState(({ rows }) => ({ rows: rows.map(row => ({ ...row, selected })) }))
      : this.setState(({ rows }) => ({ rows: this.setSelected(rows, uuid) }));

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
          <ToolbarGroup>
            <ToolbarItem>
              <Pagination
                itemsPerPage={ this.props.pagination.limit || 50 }
                numberOfItems={ this.props.pagination.count || 50 }
                onPerPageSelect={ this.handleOnPerPageSelect }
                page={ getCurrentPage(this.props.pagination.limit, this.props.pagination.offset) }
                onSetPage={ this.handleSetPage }
                direction="down"
              />
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      );
    }

    render() {
      return (
        <Fragment>
          <Route exact path="/groups/add-group" component={ AddGroup } />
          <Route exact path="/groups/edit/:id" component={ AddGroup } />
          <Route exact path="/groups/remove/:id" component={ RemoveGroup } />
          <Section type='content'>
            { this.renderToolbar() }
            <Table
              aria-label="Groups table"
              onCollapse={ this.onCollapse }
              rows={ this.state.rows }
              cells={ columns }
              onSelect={ this.selectRow }
            >
              <TableHeader />
              <TableBody />
            </Table>
          </Section>
        </Fragment>
      );
    }
}

const mapStateToProps = ({ groupReducer: { groups, isLoading }, userReducer: { users, filterValue }}) => ({
  groups: groups.data,
  pagination: groups.meta,
  users,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchGroups: apiProps => dispatch(fetchGroups(apiProps)),
    fetchUsersByGroupId: apiProps => dispatch(fetchUsersByGroupId(apiProps)),
    fetchUsers: apiProps => dispatch(fetchUsers(apiProps))
  };
};

Groups.propTypes = {
  filteredItems: PropTypes.array,
  groups: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchGroups: PropTypes.func.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  fetchUsersByGroupId: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

Groups.defaultProps = {
  groups: [],
  pagination: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(Groups);
