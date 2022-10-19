import React, { Fragment, Suspense, useState, useEffect, lazy, useContext } from 'react';
import { useIntl } from 'react-intl';
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
import PermissionsContext from '../../utilities/permissions-context';
import {
  syncDefaultPaginationWithUrl,
  applyPaginationToUrl,
  isPaginationPresentInUrl,
  defaultAdminSettings,
  defaultSettings,
} from '../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../helpers/shared/filters';
import { useScreenSize, isSmallScreen } from '@redhat-cloud-services/frontend-components/useScreenSize';
import messages from '../../Messages';
import './roles.scss';

const AddRoleWizard = lazy(() => import(/* webpackChunkname: "AddRoleWizard" */ './add-role-new/add-role-wizard'));

const selector = ({ roleReducer: { roles, isLoading } }) => ({
  roles: roles.data,
  filters: roles.filters,
  meta: roles.pagination,
  isLoading,
});

const Roles = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const screenSize = useScreenSize();

  const { roles, filters, meta, isLoading } = useSelector(selector, shallowEqual);
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'display_name', transforms: [cellWidth(20), sortable] },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.permissions), transforms: [nowrap] },
    { title: intl.formatMessage(messages.groups), transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [nowrap, sortable] },
  ];
  const fetchData = (options) => {
    return dispatch(fetchRolesWithPolicies({ ...options, inModal: false }));
  };

  const [pagination, setPagination] = useState({ ...(orgAdmin ? defaultAdminSettings : defaultSettings), ...meta });
  const [filterValue, setFilterValue] = useState(filters.display_name || '');
  const [sortByState, setSortByState] = useState({ index: 0, direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`;

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(history, pagination);
    setPagination(syncedPagination);
    const { display_name } = syncDefaultFiltersWithUrl(history, ['display_name'], { display_name: filterValue });
    setFilterValue(display_name);
    insights.chrome.appNavClick({ id: 'roles', secondaryNav: true });
    fetchData({ ...syncedPagination, orderBy, filters: { display_name } });
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
      <Route exact path={paths['add-role'].path}>
        <AddRoleWizard pagination={pagination} orderBy={orderBy} filters={{ display_name: filterValue }} />
      </Route>
      <Route exact path={paths['remove-role'].path}>
        {!isLoading && (
          <RemoveRole
            afterSubmit={() => fetchData({ ...pagination, offset: 0, orderBy, filters: { display_name: filterValue } }, true)}
            routeMatch={paths['remove-role'].path}
            cancelRoute={getBackRoute(paths.roles.path, pagination, filters)}
            submitRoute={getBackRoute(paths.roles.path, { ...pagination, offset: 0 }, filters)}
          />
        )}
      </Route>
      <Route exact path={paths['edit-role'].path}>
        {!isLoading && (
          <EditRole
            afterSubmit={() => fetchData({ ...pagination, offset: 0, orderBy, filters: { display_name: filterValue } }, true)}
            routeMatch={paths['edit-role'].path}
            cancelRoute={getBackRoute(paths.roles.path, pagination, filters)}
            submitRoute={getBackRoute(paths.roles.path, { ...pagination, offset: 0 }, filters)}
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
            title: intl.formatMessage(messages.edit),
            onClick: (_event, _rowId, role) => history.push(`/roles/edit/${role.uuid}`),
          },
          {
            title: intl.formatMessage(messages.delete),
            onClick: (_event, _rowId, role) => history.push(`/roles/remove/${role.uuid}`),
          },
        ];
  };

  const toolbarButtons = () =>
    orgAdmin || userAccessAdministrator
      ? [
          <Link to={paths['add-role'].path} key="add-role" className="rbac-m-hide-on-sm">
            <Button ouiaId="create-role-button" variant="primary" aria-label="Create role">
              {intl.formatMessage(messages.createRole)}
            </Button>
          </Link>,
          ...(isSmallScreen(screenSize)
            ? [
                {
                  label: intl.formatMessage(messages.createRole),
                  onClick: () => {
                    history.push(paths['add-role'].path);
                  },
                },
              ]
            : []),
        ]
      : [];
  const fetchTableData = (config) => {
    const { name, count, limit, offset, orderBy } = config;
    applyPaginationToUrl(history, limit, offset);
    applyFiltersToUrl(history, { display_name: name });
    return fetchData(mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
  };

  const rows = createRows(roles);
  const renderRolesList = () => (
    <Stack className="rbac-c-roles">
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title={intl.formatMessage(messages.roles)} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'tab-roles'}>
          <TableToolbarView
            actionResolver={actionResolver}
            sortBy={sortByState}
            columns={columns}
            rows={rows}
            data={roles}
            filterValue={filterValue}
            fetchData={(config) => {
              const { name, count, limit, offset, orderBy } = config;
              applyPaginationToUrl(history, limit, offset);
              applyFiltersToUrl(history, { display_name: name });
              return fetchData(mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
            }}
            setFilterValue={({ name = '' }) => setFilterValue(name)}
            isLoading={!isLoading && roles?.length === 0 && filterValue?.length === 0 ? true : isLoading}
            pagination={pagination}
            routes={routes}
            ouiaId="roles-table"
            titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
            titleSingular={intl.formatMessage(messages.role).toLowerCase()}
            toolbarButtons={toolbarButtons}
            filterPlaceholder={intl.formatMessage(messages.name).toLowerCase()}
            tableId="roles"
            testRoles={true}
            onSort={(e, index, direction) => {
              const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index].key}`;
              setSortByState({ index, direction });
              fetchTableData({
                ...pagination,
                offset: 0,
                orderBy,
                ...(filters?.length > 0
                  ? {
                      ...filters.reduce(
                        (acc, curr) => ({
                          ...acc,
                          [curr.key]: curr.value,
                        }),
                        {}
                      ),
                    }
                  : { name: filterValue }),
              });
            }}
          />
        </Section>
      </StackItem>
    </Stack>
  );

  return (
    <Switch>
      <PageActionRoute pageAction="role-detail-permission" path={paths['role-detail-permission'].path}>
        <ResourceDefinitions />
      </PageActionRoute>
      <PageActionRoute pageAction="role-detail" path={paths['role-detail'].path}>
        <Role onDelete={() => setFilterValue('')} />
      </PageActionRoute>
      <PageActionRoute pageAction="roles-list" path={paths.roles.path} render={() => renderRolesList()} />
    </Switch>
  );
};

export default Roles;
