import React, { Fragment, Suspense, useState, useEffect, lazy, useContext, useRef } from 'react';
import { useIntl } from 'react-intl';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { cellWidth, compoundExpand, nowrap, sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import { createRows } from './role-table-helpers';
import { getBackRoute, mappedProps } from '../../helpers/shared/helpers';
import { fetchRoleDetails, fetchRolesWithPolicies } from '../../redux/actions/role-actions';
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
import RoleRowWrapper from './role-row-wrapper';
import './roles.scss';

const AddRoleWizard = lazy(() => import(/* webpackChunkname: "AddRoleWizard" */ './add-role-new/add-role-wizard'));

const selector = ({ roleReducer: { roles, isLoading } }) => ({
  roles: roles.data,
  filters: roles.filters,
  meta: roles.pagination,
  isLoading,
});

const Roles = () => {
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const [selectedRows, setSelectedRows] = useState([]);
  const intl = useIntl();
  const dispatch = useDispatch();
  const textFilterRef = useRef(null);
  const history = useHistory();
  const screenSize = useScreenSize();

  const { roles, filters, meta, isLoading } = useSelector(selector, shallowEqual);

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'display_name', transforms: [cellWidth(20), sortable] },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.permissions), cellTransforms: [compoundExpand], transforms: [nowrap] },
    { title: intl.formatMessage(messages.groups), cellTransforms: [compoundExpand], transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [nowrap, sortable] },
  ];
  const fetchData = (options) => {
    return dispatch(fetchRolesWithPolicies({ ...options, inModal: false }));
  };

  const isSelectable = orgAdmin || userAccessAdministrator;
  const [pagination, setPagination] = useState({ ...(orgAdmin ? defaultAdminSettings : defaultSettings), ...meta });
  const [filterValue, setFilterValue] = useState(filters.display_name || '');
  const [sortByState, setSortByState] = useState({ index: Number(isSelectable), direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index - Number(isSelectable)].key}`;
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(history, pagination);
    setPagination(syncedPagination);
    const { display_name } = syncDefaultFiltersWithUrl(history, ['display_name'], { display_name: filterValue });
    setFilterValue(display_name);
    insights.chrome.appNavClick({ id: 'roles', secondaryNav: true });
    fetchData({ ...syncedPagination, orderBy, filters: { display_name } });
  }, []);

  useEffect(() => {
    setFilterValue(filters?.display_name || '');
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

  const fetchPermissionsForRole = (uuid) => dispatch(fetchRoleDetails(uuid));

  const routes = () => (
    <Suspense fallback={<Fragment />}>
      <Route exact path={paths['add-role'].path}>
        <AddRoleWizard pagination={pagination} orderBy={orderBy} filters={{ display_name: filterValue }} />
      </Route>
      <Route exact path={paths['remove-role'].path}>
        {!isLoading && (
          <RemoveRole
            routeMatch={paths['remove-role'].path}
            afterSubmit={() => {
              setSelectedRows([]);
              fetchData({ ...pagination, offset: 0, orderBy, filters: { display_name: filterValue } }, true);
            }}
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

  const actionResolver = (row) =>
    row.compoundParent
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
          {
            label: intl.formatMessage(messages.edit),
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => history.push(`/roles/edit/${selectedRows[0].uuid}`),
          },
          {
            label: intl.formatMessage(messages.delete),
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              history.push(`/roles/remove/${selectedRows.map(({ uuid }) => uuid)}`);
            },
          },
        ]
      : [];
  const fetchTableData = (config) => {
    const { name, count, limit, offset, orderBy } = config;
    applyPaginationToUrl(history, limit, offset);
    applyFiltersToUrl(history, { display_name: name });
    return fetchData(mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
  };

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault, admin_default: isAdminDefault, system }) => !(isPlatformDefault || isAdminDefault || system))
        .map(({ uuid, name }) => ({ uuid, label: name }))
    );
  };

  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
    if (!isOpen) {
      setExpanded({ ...expanded, [rowData.uuid]: colIndex + Number(!isSelectable) });
      colIndex + Number(!isSelectable) === 3 && fetchPermissionsForRole(rowData.uuid);
    } else {
      setExpanded({ ...expanded, [rowData.uuid]: -1 });
    }
  };

  const rows = createRows(roles, selectedRows, intl, expanded);
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
            isSelectable={isSelectable}
            checkedRows={selectedRows}
            textFilterRef={textFilterRef}
            setCheckedItems={setCheckedItems}
            actionResolver={actionResolver}
            sortBy={sortByState}
            columns={columns}
            areActionsDisabled={({ system }) => !!system}
            rowWrapper={RoleRowWrapper}
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
            isExpandable
            onExpand={onExpand}
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
              const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index - Number(isSelectable)].key}`;
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
