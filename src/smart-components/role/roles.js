import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import PropTypes from 'prop-types';
import AppTabs from '../app-tabs/app-tabs';
import { createRows } from './role-table-helpers';
import { defaultSettings } from '../../helpers/shared/pagination';
import { mappedProps } from '../../helpers/shared/helpers';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import AddRoleWizard from './add-role/add-role-wizard';
import RemoveRole from './remove-role-modal';
import { Section } from '@redhat-cloud-services/frontend-components';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';

const debouncedFetch = debouncePromise(callback => callback());

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

const Roles = ({
  fetchRoles,
  roles,
  isLoading,
  history: { push },
  pagination,
  userIdentity,
  userEntitlements
}) => {
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
    <Fragment key="add-role">
      { userEntitlements && userEntitlements.cost_management ?
        <Link to="/roles/add-role" >
          <Button
            variant="primary"
            aria-label="Create role"
          >
          Add role
          </Button>
        </Link> :
        <Fragment /> }
    </Fragment>
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
            setFilterValue={ (config, isDebounce) => {
              setFilterValue(config.name);
              if (isDebounce) {
                debouncedFetch(() => fetchRoles(config));
              } else {
                fetchRoles(config);
              }
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
  userEntitlements: roles.entitlements,
  isLoading
});

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRolesWithPolicies(mappedProps(apiProps)));
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
  }),
  userEntitlements: PropTypes.shape({
    [PropTypes.string]: PropTypes.bool
  })
};

Roles.defaultProps = {
  roles: [],
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Roles);
