import React, { Fragment, Suspense, useState, useEffect, lazy, useContext } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Link, Route, Routes, Switch, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { roles, isLoading, filters, meta } = useSelector(selector, shallowEqual);
  const fetchData = (options) => dispatch(fetchRolesWithPolicies({ ...options, inModal: false }));
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);

  const [pagination, setPagination] = useState(meta);
  const [filterValue, setFilterValue] = useState(filters.display_name || '');
  const screenSize = useScreenSize();

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(location, navigate, pagination);
    setPagination(syncedPagination);
    const { display_name } = syncDefaultFiltersWithUrl(location, navigate, ['display_name'], { display_name: filterValue });
    setFilterValue(display_name);
    insights.chrome.appNavClick({ id: 'roles', secondaryNav: true });
    fetchData({ ...syncedPagination, filters: { display_name } });
  }, []);

  useEffect(() => {
    setFilterValue(filters.display_name);
    setPagination(meta);
  }, [filters, meta]);

  useEffect(() => {
    meta.redirected && applyPaginationToUrl(location, navigate, meta.limit, meta.offset);
  }, [meta.redirected]);

  useEffect(() => {
    isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
    filterValue?.length > 0 &&
      !areFiltersPresentInUrl(location, ['display_name']) &&
      syncDefaultFiltersWithUrl(location, navigate, ['display_name'], { display_name: filterValue });
  });

  const routes = () => (
    <Suspense fallback={<Fragment />}>
      <Routes>
        <Route path="add-role" element={<AddRoleWizard pagination={pagination} filters={{ display_name: filterValue }} />} />
        <Route
          exact
          path={paths['remove-role'].path}
          element={
            <>
              {!isLoading && (
                <RemoveRole
                  afterSubmit={() => fetchData({ ...pagination, offset: 0, filters: { display_name: filterValue } }, true)}
                  routeMatch={paths['remove-role'].path}
                  cancelRoute={getBackRoute(paths.roles.path, pagination, filters)}
                  submitRoute={getBackRoute(paths.roles.path, { ...pagination, offset: 0 }, filters)}
                />
              )}
            </>
          }
        />
        <Route
          exact
          path={paths['edit-role'].path}
          element={
            <>
              {!isLoading && (
                <EditRole
                  afterSubmit={() => fetchData({ ...pagination, offset: 0, filters: { display_name: filterValue } }, true)}
                  cancelRoute={getBackRoute(paths.roles.path, pagination, filters)}
                  submitRoute={getBackRoute(paths.roles.path, { ...pagination, offset: 0 }, filters)}
                />
              )}
            </>
          }
        ></Route>
      </Routes>
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
          <Link to="add-role" key="add-role" className="rbac-m-hide-on-sm">
            <Button ouiaId="create-role-button" variant="primary" aria-label="Create role">
              Create role
            </Button>
          </Link>,
          ...(isSmallScreen(screenSize)
            ? [
                {
                  label: 'Create role',
                  onClick: () => {
                    navigate(paths['add-role'].path);
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
              applyPaginationToUrl(location, navigate, limit, offset);
              applyFiltersToUrl(location, navigate, { display_name: name });
              return fetchData(mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
            }}
            setFilterValue={({ name = '' }) => setFilterValue(name)}
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
    <Routes>
      <Route
        path={paths['role-detail-permission'].path}
        element={
          <PageActionRoute pageAction="role-detail-permission">
            <ResourceDefinitions />
          </PageActionRoute>
        }
      />
      <Route
        path="detail/:uuid/*"
        element={
          <PageActionRoute pageAction="role-detail">
            <Role onDelete={() => setFilterValue('')} />
          </PageActionRoute>
        }
      />
      <Route path="/*" element={<PageActionRoute pageAction="roles-list">{renderRolesList()}</PageActionRoute>} />
    </Routes>
  );
};

export default Roles;
