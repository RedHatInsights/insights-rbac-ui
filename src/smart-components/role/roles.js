import React, { Fragment, useState, useEffect, lazy } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { cellWidth, nowrap, sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import { createRows } from './role-table-helpers';
import { mappedProps } from '../../helpers/shared/helpers';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import RemoveRole from './remove-role-modal';
import { Section } from '@redhat-cloud-services/frontend-components';
import Role from './role';
import { routes as paths } from '../../../package.json';
import EditRole from './edit-role-modal';
import PageActionRoute from '../common/page-action-route';
import ResourceDefinitions from './role-resource-definitions';
import { Suspense } from 'react';

const AddRoleWizard = lazy(() => import(/* webpackChunkname: "AddRoleWizard" */ './add-role-new/add-role-wizard'));

const columns = [
  { title: 'Name', key: 'display_name', transforms: [cellWidth(20), sortable] },
  { title: 'Description' },
  { title: 'Permissions', transforms: [nowrap] },
  { title: 'Groups', transforms: [nowrap] },
  { title: 'Last modified', key: 'modified', transforms: [nowrap, sortable] },
];

const selector = ({ roleReducer: { roles, isLoading } }) => ({
  roles: roles.data,
  pagination: roles.meta,
  userIdentity: roles.identity,
  isLoading,
});

const Roles = () => {
  const [filterValue, setFilterValue] = useState('');
  const dispatch = useDispatch();
  const { push } = useHistory();
  const { roles, isLoading, pagination, userIdentity } = useSelector(selector, shallowEqual);
  const fetchData = (options) => dispatch(fetchRolesWithPolicies(options));

  useEffect(() => {
    insights.chrome.appNavClick({ id: 'roles', secondaryNav: true });
    fetchData({ ...pagination, name: filterValue });
  }, []);

  const routes = () => (
    <Suspense fallback={<Fragment />}>
      {insights.chrome.isBeta() && <Route exact path={paths['add-role']} component={AddRoleWizard} />}
      <Route exact path={paths['remove-role']}>
        {!isLoading && (
          <RemoveRole
            routeMatch={paths['remove-role']}
            cancelRoute={paths.roles}
            afterSubmit={() => fetchData({ ...pagination, name: filterValue })}
          />
        )}
      </Route>
      <Route exact path={paths['edit-role']}>
        {!isLoading && (
          <EditRole afterSubmit={() => fetchData({ ...pagination, name: filterValue })} routeMatch={paths['edit-role']} cancelRoute={paths.roles} />
        )}
      </Route>
    </Suspense>
  );

  const actionResolver = ({ system }) => {
    return system
      ? []
      : [
          {
            title: 'Edit',
            onClick: (_event, _rowId, role) => push(`/roles/edit/${role.uuid}`),
          },
          {
            title: 'Delete',
            onClick: (_event, _rowId, role) => push(`/roles/remove/${role.uuid}`),
          },
        ];
  };

  const toolbarButtons = () =>
    [
      insights.chrome.isBeta() && userIdentity?.user?.is_org_admin
        ? {
            label: 'Create role',
            onClick: () => {
              push(paths['add-role']);
            },
          }
        : undefined,
    ].filter((x) => x);

  const renderRolesList = () => (
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title="Roles" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'tab-roles'}>
          <TableToolbarView
            dedicatedAction={
              insights.chrome.isBeta() && userIdentity?.user?.is_org_admin ? (
                <Link to={paths['add-role']}>
                  <Button ouiaId="create-role-button" variant="primary" aria-label="Create role" className="pf-m-visible-on-md">
                    Create role
                  </Button>
                </Link>
              ) : undefined
            }
            actionResolver={actionResolver}
            sortBy={{ index: 0, direction: 'asc' }}
            columns={columns}
            createRows={createRows}
            data={roles}
            filterValue={filterValue}
            fetchData={(config) => fetchData(mappedProps(config))}
            setFilterValue={({ name }) => setFilterValue(name)}
            isLoading={isLoading}
            pagination={pagination}
            routes={routes}
            ouiaId="roles-table"
            titlePlural="roles"
            titleSingular="role"
            toolbarButtons={toolbarButtons}
            filterPlaceholder="name"
          />
        </Section>
      </StackItem>
    </Stack>
  );

  return (
    <Switch>
      <PageActionRoute pageAction="role-detail-permission" path={paths['role-detail-permission']}>
        <ResourceDefinitions />
      </PageActionRoute>
      <PageActionRoute pageAction="role-detail" path={paths['role-detail']}>
        <Role onDelete={() => setFilterValue('')} />
      </PageActionRoute>
      <PageActionRoute pageAction="roles-list" path={paths.roles} render={() => renderRolesList()} />
    </Switch>
  );
};

export default Roles;
