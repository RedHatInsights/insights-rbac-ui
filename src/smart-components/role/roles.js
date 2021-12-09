import React, { Fragment, Suspense, useState, useEffect, lazy, useContext } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { cellWidth, nowrap, sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import { createRows } from './role-table-helpers';
import { getBackRoute, mappedProps } from '../../helpers/shared/helpers';
import { fetchRolesWithPolicies } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import RemoveRole from './remove-role-modal';
import Section from '@redhat-cloud-services/frontend-components/Section';
import Role from './role';
import paths from '../../utilities/pathnames';
import EditRole from './edit-role-modal';
import PageActionRoute from '../common/page-action-route';
import ResourceDefinitions from './role-resource-definitions';
import { syncDefaultPaginationWithUrl, applyPaginationToUrl, isPaginationPresentInUrl } from '../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../helpers/shared/filters';
import { useScreenSize, isSmallScreen } from '@redhat-cloud-services/frontend-components/useScreenSize';
import './roles.scss';
import PermissionsContext from '../../utilities/permissions-context';

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
  filters: roles.filters,
  meta: roles.pagination,
  isLoading,
});

const Roles = () => {
  const dispatch = useDispatch();
  const { push } = useHistory();
  const { roles, isLoading, filters, meta } = useSelector(selector, shallowEqual);
  const fetchData = (options) => dispatch(fetchRolesWithPolicies({ ...options, inModal: false }));
  const history = useHistory();
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);

  const [pagination, setPagination] = useState(meta);
  const [filterValue, setFilterValue] = useState(filters.display_name || '');
  const screenSize = useScreenSize();

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(history, pagination);
    setPagination(syncedPagination);
    const { display_name } = syncDefaultFiltersWithUrl(history, ['display_name'], { display_name: filterValue });
    setFilterValue(display_name);
    insights.chrome.appNavClick({ id: 'roles', secondaryNav: true });
    fetchData({ ...syncedPagination, filters: { display_name } });
  }, []);

  useEffect(() => {
    setFilterValue(filters.display_name);
    setPagination(meta);
  }, [filters, meta]);

  useEffect(() => {
    meta.redirected && applyPaginationToUrl(history, meta.limit, meta.offset);
  }, [meta.redirected]);

  useEffect(() => {
    isPaginationPresentInUrl(history) || applyPaginationToUrl(history, pagination.limit, pagination.offset);
    filterValue?.length > 0 &&
      !areFiltersPresentInUrl(history, ['display_name']) &&
      syncDefaultFiltersWithUrl(history, ['display_name'], { display_name: filterValue });
  });

  const routes = () => (
    <Suspense fallback={<Fragment />}>
      <Route exact path={paths['add-role']}>
        <AddRoleWizard pagination={pagination} filters={{ display_name: filterValue }} />
      </Route>
      <Route exact path={paths['remove-role']}>
        {!isLoading && (
          <RemoveRole
            afterSubmit={() => fetchData({ ...pagination, offset: 0, filters: { display_name: filterValue } }, true)}
            routeMatch={paths['remove-role']}
            cancelRoute={getBackRoute(paths.roles, pagination, filters)}
            submitRoute={getBackRoute(paths.roles, { ...pagination, offset: 0 }, filters)}
          />
        )}
      </Route>
      <Route exact path={paths['edit-role']}>
        {!isLoading && (
          <EditRole
            afterSubmit={() => fetchData({ ...pagination, offset: 0, filters: { display_name: filterValue } }, true)}
            routeMatch={paths['edit-role']}
            cancelRoute={getBackRoute(paths.roles, pagination, filters)}
            submitRoute={getBackRoute(paths.roles, { ...pagination, offset: 0 }, filters)}
          />
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
    orgAdmin || userAccessAdministrator
      ? [
          <Link to={paths['add-role']} key="add-role" className="ins-m-hide-on-sm">
            <Button ouiaId="create-role-button" variant="primary" aria-label="Create role">
              Create role
            </Button>
          </Link>,
          ...(isSmallScreen(screenSize)
            ? [
                {
                  label: 'Create role',
                  onClick: () => {
                    history.push(paths['add-role']);
                  },
                },
              ]
            : []),
        ]
      : [];

  const renderRolesList = () => (
    <Stack className="rbac-c-roles">
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title="Roles" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'tab-roles'}>
          <TableToolbarView
            actionResolver={actionResolver}
            sortBy={{ index: 0, direction: 'asc' }}
            columns={columns}
            createRows={createRows}
            data={roles}
            filterValue={filterValue}
            fetchData={(config) => {
              const { name, count, limit, offset, orderBy } = config;
              applyPaginationToUrl(history, limit, offset);
              applyFiltersToUrl(history, { display_name: name });
              return fetchData(mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
            }}
            setFilterValue={({ name }) => setFilterValue(name)}
            isLoading={!isLoading && roles?.length === 0 && filterValue?.length === 0 ? true : isLoading}
            pagination={pagination}
            routes={routes}
            ouiaId="roles-table"
            titlePlural="roles"
            titleSingular="role"
            toolbarButtons={toolbarButtons}
            filterPlaceholder="name"
            tableId="roles"
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
