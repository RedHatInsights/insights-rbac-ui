import React, { Fragment, useState, useEffect } from 'react';
import { shallowEqual, useSelector, useDispatch  } from 'react-redux';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import { cellWidth } from '@patternfly/react-table';
import { createRows } from './role-table-helpers';
import { mappedProps } from '../../helpers/shared/helpers';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import AddRoleWizard from './add-role/add-role-wizard';
import RemoveRole from './remove-role-modal';
import { Section } from '@redhat-cloud-services/frontend-components';
import Role from './role';

const columns = [
  { title: 'Name', orderBy: 'name', transforms: [ cellWidth(20) ]},
  { title: 'Description' },
  { title: 'Permissions', transforms: [ cellWidth(5) ]},
  { title: 'Groups', transforms: [ cellWidth(5) ]},
  { title: 'Last modified', orderBy: 'modified', transforms: [ cellWidth(10) ]}
];

const selector = ({ roleReducer: { roles, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  userIdentity: roles.identity,
  userEntitlements: roles.entitlements,
  isLoading
});

const Roles = () => {
  const [ filterValue, setFilterValue ] = useState('');
  const dispatch = useDispatch();
  const { push } = useHistory();
  const {
    roles,
    isLoading,
    pagination,
    userIdentity,
    userEntitlements
  } = useSelector(selector, shallowEqual);
  const fetchData = (options) => dispatch(fetchRolesWithPolicies(options));

  useEffect(() => {
    fetchData({ ...pagination, name: filterValue });
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
          <TopToolbarTitle title="Roles" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={ 'tab-roles' }>
          <TableToolbarView
            actionResolver={ actionResolver }
            columns={ columns }
            createRows={ createRows }
            data={ roles }
            filterValue={ filterValue }
            fetchData={ (config) => fetchData(mappedProps(config)) }
            setFilterValue={ ({ name }) => setFilterValue(name) }
            isLoading={ isLoading }
            pagination={ pagination }
            routes={ routes }
            titlePlural="roles"
            titleSingular="role"
            toolbarButtons = { toolbarButtons }
            filterPlaceholder="name"
          />
        </Section>
      </StackItem>
    </Stack>;

  return (
    <Switch>
      <Route path={ '/roles/detail/:uuid' } render={ props => <Role { ...props }/> } />
      <Route path={ '/roles' } render={ () => renderRolesList() } />
    </Switch>
  );
};

export default Roles;
