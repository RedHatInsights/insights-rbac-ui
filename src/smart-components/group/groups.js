import React, { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchAdminGroup, fetchSystemGroup } from '../../redux/actions/group-actions';
import Group from './group';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import Role from '../role/role';
import GroupRowWrapper from './group-row-wrapper';
import pathnames from '../../utilities/pathnames';
import './groups.scss';
import PageActionRoute from '../common/page-action-route';
import { applyPaginationToUrl, isPaginationPresentInUrl, syncDefaultPaginationWithUrl } from '../../helpers/shared/pagination';
import { applyFiltersToUrl, areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../helpers/shared/filters';
import { getBackRoute } from '../../helpers/shared/helpers';
import PermissionsContext from '../../utilities/permissions-context';
import { experimentalFetchGroups } from '../../redux/experimental/groups-actions';

const columns = [
  { title: 'Name', key: 'name', transforms: [sortable] },
  { title: 'Roles' },
  { title: 'Members' },
  { title: 'Last modified', key: 'modified', transforms: [sortable] },
];

const extractIdFromSymbol = (s) => s.toString().replace(/(^Symbol\(|\)$)/gm, '');

const useActivePage = (options) => {
  const dispatch = useDispatch();
  const { pages, isLoading, activePage, defaultPageMeta, entities } = useSelector(
    ({
      experimentalGroupsReducer: {
        activePage,
        isLoading,
        storage: { pages, entities },
        defaultPageMeta,
      },
    }) => {
      return {
        isLoading,
        pages,
        activePage,
        defaultPageMeta,
        entities,
      };
    },
    shallowEqual
  );

  const pageQuery = extractIdFromSymbol(activePage);
  const {
    meta,
    pagination,
    filters,
    entities: pageEntities,
  } = pages[pageQuery] || {
    ...defaultPageMeta,
    entities: [],
  };

  const data = pageEntities.map((id) => entities[id]);
  useEffect(() => {
    const internalOptions = typeof options === 'function' ? options() : options;
    dispatch(experimentalFetchGroups(internalOptions));
  }, []);

  return {
    meta: pagination || meta,
    filters: filters,
    isLoading,
    entities: data || [],
  };
};

const Groups = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const fetchData = (options) => dispatch(experimentalFetchGroups({ ...options, name: options?.filters?.name, inModal: false }));
  const optionsSetup = useCallback(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(history, pagination);
    const { name } = syncDefaultFiltersWithUrl(history, ['name'], { name: filterValue });

    return {
      ...syncedPagination,
      filters: { name },
      name,
      inModal: false,
    };
  }, []);
  const { meta, filters, isLoading, entities: groups } = useActivePage(optionsSetup);
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  const [pagination, setPagination] = useState(meta);
  const [filterValue, setFilterValue] = useState(filters.name || '');
  const [selectedRows, setSelectedRows] = useState([]);
  const [removeGroupsList, setRemoveGroupsList] = useState([]);

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(history, pagination);
    setPagination(syncedPagination);
    const { name } = syncDefaultFiltersWithUrl(history, ['name'], { name: filterValue });
    setFilterValue(name);
    insights.chrome.appNavClick({ id: 'groups', secondaryNav: true });
    dispatch(fetchAdminGroup(name));
    dispatch(fetchSystemGroup(name));
  }, []);

  useEffect(() => {
    isPaginationPresentInUrl(history) || applyPaginationToUrl(history, pagination.limit, pagination.offset);
    filterValue?.length > 0 && !areFiltersPresentInUrl(history, ['name']) && syncDefaultFiltersWithUrl(history, ['name'], { name: filterValue });
  });

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault, admin_default: isAdminDefault }) => !(isPlatformDefault || isAdminDefault))
        .map(({ uuid, name }) => ({ uuid, label: name }))
    );
  };

  useEffect(() => {
    pagination.redirected && applyPaginationToUrl(history, pagination.limit, pagination.offset);
  }, [pagination.redirected]);

  useEffect(() => {
    setFilterValue(filters.name);
    setPagination(meta);
  }, [filters, meta]);

  const routes = () => (
    <Fragment>
      <Route exact path={pathnames['add-group']}>
        <AddGroupWizard
          pagination={pagination}
          filters={filters}
          postMethod={(config) => {
            fetchData(config);
            setFilterValue('');
          }}
        />
      </Route>
      <Route exact path={pathnames['group-edit'].path}>
        <EditGroup
          pagination={pagination}
          filters={filters}
          postMethod={(config) => {
            fetchData(config);
          }}
          cancelRoute={getBackRoute(pathnames.groups, pagination, filters)}
          submitRoute={getBackRoute(pathnames.groups, { ...pagination, offset: 0 }, filters)}
        />
      </Route>
      <Route exact path={pathnames['remove-group']}>
        <RemoveGroup
          pagination={pagination}
          filters={filters}
          postMethod={(ids, config) => {
            fetchData(config);
            setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
          }}
          cancelRoute={getBackRoute(pathnames.groups, pagination, filters)}
          submitRoute={getBackRoute(pathnames.groups, { ...pagination, offset: 0 }, filters)}
          isModalOpen
          groupsUuid={removeGroupsList}
        />
      </Route>
    </Fragment>
  );

  const actionResolver = ({ isPlatformDefault, isAdminDefault }) =>
    isPlatformDefault || isAdminDefault || !isAdmin
      ? null
      : [
          {
            title: 'Edit',
            onClick: (_event, _rowId, group) => {
              history.push(`/groups/edit/${group.uuid}`);
            },
          },
          {
            title: 'Delete',
            onClick: (_event, _rowId, group) => {
              setRemoveGroupsList([group]);
              history.push(pathnames['remove-group']);
            },
          },
        ];

  // TODO check this later
  const toolbarButtons = () => [
    ...(isAdmin
      ? [
          <Link to={pathnames['add-group']} key="add-group" className="rbac-m-hide-on-sm">
            <Button ouiaId="create-group-button" variant="primary" aria-label="Create group">
              Create group
            </Button>
          </Link>,
          {
            label: 'Create group',
            props: {
              className: 'rbac-m-hide-on-md',
            },
            onClick: () => {
              history.push(pathnames['add-group']);
            },
          },
          {
            label: 'Edit',
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => history.push(`/groups/edit/${selectedRows[0].uuid}`),
          },
          {
            label: 'Delete',
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              setRemoveGroupsList(selectedRows);
              history.push(pathnames['remove-group']);
            },
          },
        ]
      : []),
  ];

  const renderGroupsList = () => (
    <Stack className="rbac-c-groups">
      <StackItem>
        <TopToolbar paddingBottom>
          <TopToolbarTitle title="Groups" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'tab-groups'}>
          <TableToolbarView
            data={groups.map((group) => (group.platform_default || group.admin_default ? { ...group, principalCount: 'All' } : group))}
            createRows={(...args) => createRows(isAdmin, ...args)}
            columns={columns}
            isSelectable={isAdmin}
            checkedRows={selectedRows}
            setCheckedItems={setCheckedItems}
            routes={routes}
            actionResolver={actionResolver}
            titlePlural="groups"
            titleSingular="group"
            ouiaId="groups-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={(config) => {
              const { name, count, limit, offset, orderBy } = config;
              applyPaginationToUrl(history, limit, offset);
              applyFiltersToUrl(history, { name });
              return fetchData({ count, limit, offset, orderBy, filters: { name } });
            }}
            setFilterValue={({ name }) => setFilterValue(name)}
            toolbarButtons={toolbarButtons}
            isLoading={!isLoading && groups?.length === 0 && filterValue?.length === 0 ? true : isLoading}
            filterPlaceholder="name"
            rowWrapper={GroupRowWrapper}
            tableId="groups"
          />
        </Section>
      </StackItem>
    </Stack>
  );
  return (
    <Switch>
      <PageActionRoute pageAction="role-detail" path={pathnames['group-detail-role-detail']} render={(props) => <Role {...props} />} />
      <PageActionRoute
        pageAction="group-detail"
        path={pathnames['group-detail']}
        render={(props) => (
          <Group
            {...props}
            onDelete={(uuid) => {
              setFilterValue('');
              setSelectedRows(selectedRows.filter((row) => row.uuid != uuid));
            }}
          />
        )}
      />
      <PageActionRoute pageAction="group-list" path={pathnames.groups} render={() => renderGroupsList()} />
    </Switch>
  );
};

export default Groups;
