import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import PropTypes from 'prop-types';

import AppTabs from '../app-tabs/app-tabs';
import { createRows } from './role-table-helpers';
import { defaultSettings } from '../../helpers/shared/pagination';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import AddRoleWizard from './add-role/add-role-wizard';
import RemoveRole from './remove-role-modal';
import { Section, Skeleton } from '@redhat-cloud-services/frontend-components';
import awesomeDebouncePromise from '../../utilities/async-debounce';
import SuspendComponent from '../common/suspend-component';

const debouncedFilter = awesomeDebouncePromise(callback => callback(), 1000);

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

const Roles = ({ fetchRoles, roles, isLoading, history: { push }, pagination, userIdentity }) => {
  const [ filterValue, setFilterValue ] = useState('');
  useEffect(() => {
    fetchRoles({ ...pagination, name: filterValue });
  }, []);

  const routes = () => <Fragment>
    <Route exact path="/roles/add-role" component={ AddRoleWizard } />
    <Route exact path="/roles/remove/:id" component={ RemoveRole } />
  </Fragment>;

  const actionResolver = ({ system }) => {
    const userAllowed = insights.chrome.isBeta() && userIdentity.user.is_org_admin;
    return (system || !userAllowed) ? [] : [
      {
        title: 'Delete',
        onClick: (_event, _rowId, role) =>
          push(`/roles/remove/${role.uuid}`),
        props: {
          isDisabled: true
        },
        isDisabled: true
      }
    ];
  };

  const areActionsDisabled = (_roleData) => {
    return _roleData.policies.title > 1;
  };

  const toolbarButtons = () => [
    <SuspendComponent key="add-role"
      fallback={ <Skeleton /> }
      asyncFunction={ insights.chrome.auth.getUser }
      callback={ ({ entitlements }, props) => (
        entitlements.cost_management ?
          <Link to="/roles/add-role" { ...props }>
            <Button
              variant="primary"
              aria-label="Create role"
            >
                Add role
            </Button>
          </Link> :
          <Fragment />
      ) }
    />
  ];

  const renderRolesList = () =>
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title="User access management" />
          <AppTabs tabItems={ tabItems }/>
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={ 'tab-roles' }>
          <TableToolbarView
            actionResolver={ actionResolver }
            areActionsDisabled={ areActionsDisabled }
            columns={ columns }
            createRows={ createRows }
            data={ roles }
            filterValue={ filterValue }
            setFilterValue={ (value) => {
              setFilterValue(value);
              debouncedFilter(() => fetchRoles({ ...pagination, name: value }));
            } }
            isLoading={ isLoading }
            pagination={ pagination }
            request={ fetchRoles }
            routes={ routes }
            titlePlural="roles"
            titleSingular="role"
            toolbarButtons = { toolbarButtons }
          />
        </Section>
      </StackItem>
    </Stack>;

  return (
    <Switch>
      <Route path={ '/roles' } render={ () => renderRolesList() } />
    </Switch>
  );
};

const mapStateToProps = ({ roleReducer: { roles, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  userIdentity: roles.identity,
  isLoading
});

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: apiProps => {
      const mappedPros = Object.entries(apiProps).reduce((acc, [ key, value ]) => ({
        ...acc,
        ...value && { [key]: value }
      }), {});
      dispatch(fetchRolesWithPolicies(mappedPros));
    }
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
  fetchRoles: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  }),
  userIdentity: PropTypes.shape({
    user: PropTypes.shape({
      [PropTypes.string]: PropTypes.oneOfType([ PropTypes.string, PropTypes.bool ])
    })
  })
};

Roles.defaultProps = {
  roles: [],
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Roles);
