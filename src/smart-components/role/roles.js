import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import PropTypes from 'prop-types';

import AppTabs from '../app-tabs/app-tabs';
import { createRows } from './role-table-helpers';
import { defaultSettings } from '../../helpers/shared/pagination';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import RemoveRole from './remove-role-modal';

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

const Roles = ({ fetchRoles, isLoading, history: { push }, pagination }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ roles, setRoles ] = useState([]);

  const fetchData = () => {
    fetchRoles(pagination).then(({ value: { data }}) => setRoles(data));
  };

  const routes = () => <Fragment>
    <Route exact path="/roles/remove/:id" component={ RemoveRole } />
  </Fragment>;

  const actionResolver = () =>
    [
      {
        title: 'Delete',
        style: { color: 'var(--pf-global--danger-color--100)' },
        onClick: (_event, _rowId, role) =>
          push(`/roles/remove/${role.uuid}`)
      }
    ];

  const areActionsDisabled = (_roleData) => {
    return _roleData.policies.title > 1;
  };

  const renderRolesList = () =>
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title="User access management" />
          <AppTabs tabItems={ tabItems }/>
        </TopToolbar>
      </StackItem>
      <StackItem>
        <TableToolbarView
          actionResolver={ actionResolver }
          areActionsDisabled={ areActionsDisabled }
          columns={ columns }
          createRows={ createRows }
          data={ roles }
          fetchData={ fetchData }
          filterValue={ filterValue }
          setFilterValue={ setFilterValue }
          isLoading={ isLoading }
          pagination={ pagination }
          request={ fetchRoles }
          routes={ routes }
          titlePlural="roles"
          titleSingular="role"
        />
      </StackItem>
    </Stack>;

  return (
    <Switch>
      <Route path={ '/roles' } render={ () => renderRolesList() } />
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
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
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
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Roles);
