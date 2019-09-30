import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

import AppTabs from '../app-tabs/app-tabs';
import { createRows } from './role-table-helpers';
import { defaultSettings } from '../../helpers/shared/pagination';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';

const columns = [
  { title: 'Role', orderBy: 'name' },
  { title: 'Description' },
  { title: 'Policies' },
  { title: 'Last Modified', orderBy: 'modified' }
];

const tabItems = [
  { eventKey: 0, title: 'Groups', name: '/groups' },
  { eventKey: 1, title: 'Roles', name: '/roles' }
];

const Roles = ({ fetchRoles, isLoading, pagination, roles }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const fetchData = (setRows) => {
    fetchRoles(pagination).then(({ value: { data }}) => setRows(createRows(data, filterValue)));
  };

  const renderRolesList = () =>
    <Fragment>
      <TopToolbar>
        <TopToolbarTitle title="User access management" />
        <AppTabs tabItems={ tabItems }/>
      </TopToolbar>
      <TableToolbarView
        data={ roles }
        createRows={ createRows }
        columns={ columns }
        fetchData={ fetchData }
        request={ fetchRoles }
        titlePlural="roles"
        titleSingular="role"
        pagination={ pagination }
        filterValue={ filterValue }
        setFilterValue={ setFilterValue }
        isLoading={ isLoading }
      />
    </Fragment>;

  return (
    <Switch>
      <Route exact path={ '/roles' } render={ () => renderRolesList() } />
    </Switch>
  );
};

const mapStateToProps = ({ roleReducer: { roles, filterValue, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: apiProps => dispatch(fetchRolesWithPolicies(apiProps))
  };
};

Roles.propTypes = {
  roles: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchRoles: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

Roles.defaultProps = {
  roles: [],
  isLoading: false,
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Roles);
