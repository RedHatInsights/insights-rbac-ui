import React, { useContext, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Section from '@redhat-cloud-services/frontend-components/Section';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchAdminGroup, fetchGroups, fetchSystemGroup } from '../../redux/actions/group-actions';
import AppLink, { mergeToBasename } from '../../presentational-components/shared/AppLink';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Group from './group';
import Role from '../role/role';
import GroupRowWrapper from './group-row-wrapper';
import PageActionRoute from '../common/page-action-route';
import {
  applyPaginationToUrl,
  defaultAdminSettings,
  defaultSettings,
  isPaginationPresentInUrl,
  syncDefaultPaginationWithUrl,
} from '../../helpers/shared/pagination';
import { applyFiltersToUrl, areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../helpers/shared/filters';
import { getBackRoute, removeQueryParams } from '../../helpers/shared/helpers';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import './groups.scss';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

const Groups = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const chrome = useChrome();
  const fetchData = (options) => dispatch(fetchGroups({ ...options, usesMetaInURL: true }));
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;
  const textFilterRef = useRef(null);

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'name', transforms: [sortable] },
    { title: intl.formatMessage(messages.roles) },
    { title: intl.formatMessage(messages.members) },
    { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [sortable] },
  ];

  // using 'isAdmin' (0 or 1) determines correct index for columns due to 'isSelectable' property on Table component
  const [sortByState, setSortByState] = useState({ index: Number(isAdmin), direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index - Number(isAdmin)].key}`;

  const { groups, pagination, filters, isLoading, systemGroup } = useSelector(
    ({
      groupReducer: {
        groups: { data, filters, pagination },
        isLoading,
        adminGroup,
        systemGroup,
      },
    }) => ({
      groups: [
        ...(adminGroup?.name?.match(new RegExp(filters.name, 'i')) ? [adminGroup] : []),
        ...(systemGroup?.name?.match(new RegExp(filters.name, 'i')) ? [systemGroup] : []),
        ...(data?.filter(({ platform_default, admin_default } = {}) => !(platform_default || admin_default)) || []),
      ],
      pagination: {
        limit: pagination?.limit ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
        offset: pagination?.offset ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
        count: pagination?.count,
        redirected: pagination?.redirected,
      },
      filters: filters,
      isLoading,
      systemGroup,
    }),
    shallowEqual
  );

  const [filterValue, setFilterValue] = useState(filters?.name || '');
  const [selectedRows, setSelectedRows] = useState([]);
  const [removeGroupsList, setRemoveGroupsList] = useState([]);

  useEffect(() => {
    applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
  }, [pagination.offset, pagination.limit, pagination.count, pagination.redirected]);

  useEffect(() => {
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, pagination);
    const { name } = syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
    setFilterValue(name);
    chrome.appNavClick({ id: 'groups', secondaryNav: true });
    fetchData({ limit, offset, orderBy, filters: { name } });
    dispatch(fetchAdminGroup(name));
    dispatch(fetchSystemGroup(name));
  }, []);

  useEffect(() => {
    if (!location.pathname.includes('detail')) {
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      filterValue?.length > 0 &&
        !areFiltersPresentInUrl(location, ['name']) &&
        syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
    } else {
      removeQueryParams(location, navigate);
    }
  }, [location.pathname]);

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault, admin_default: isAdminDefault }) => !(isPlatformDefault || isAdminDefault))
        .map(({ uuid, name }) => ({ uuid, label: name }))
    );
  };

  const routes = () => (
    <Routes>
      <Route
        path={pathnames['add-group'].path}
        element={
          <AddGroupWizard
            pagination={pagination}
            filters={filters}
            orderBy={orderBy}
            postMethod={(config) => {
              setFilterValue('');
              fetchData(config);
            }}
          />
        }
      />
      <Route
        path={pathnames['edit-group'].path}
        element={
          <EditGroup
            pagination={pagination}
            filters={filters}
            postMethod={(config) => {
              setFilterValue('');
              fetchData({ ...config, orderBy });
            }}
            cancelRoute={getBackRoute('../', pagination, filters)}
            submitRoute={getBackRoute('../', { ...pagination, offset: 0 }, filters)}
          />
        }
      />
      <Route
        path={pathnames['remove-group'].path}
        element={
          <RemoveGroup
            pagination={pagination}
            filters={filters}
            postMethod={(ids, config) => {
              fetchData({ ...config, orderBy });
              setFilterValue('');
              setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
            }}
            cancelRoute={getBackRoute('../', pagination, filters)}
            submitRoute={getBackRoute('../', { ...pagination, offset: 0 }, filters)}
            isModalOpen
            groupsUuid={removeGroupsList}
          />
        }
      />
    </Routes>
  );

  const actionResolver = ({ isPlatformDefault, isAdminDefault }) =>
    isPlatformDefault || isAdminDefault || !isAdmin
      ? null
      : [
          {
            title: intl.formatMessage(messages.edit),
            onClick: (_event, _rowId, group) => navigate(mergeToBasename(pathnames['edit-group'].link).replace(':groupId', group.uuid)),
          },
          {
            title: intl.formatMessage(messages.delete),
            onClick: (_event, _rowId, group) => {
              setRemoveGroupsList([group]);
              navigate(mergeToBasename(pathnames['remove-group'].link));
            },
          },
        ];

  // TODO check this later
  const toolbarButtons = () => [
    ...(isAdmin
      ? [
          <AppLink to={pathnames['add-group'].link} key="add-group" className="rbac-m-hide-on-sm">
            <Button ouiaId="create-group-button" variant="primary" aria-label="Create group">
              {intl.formatMessage(messages.createGroup)}
            </Button>
          </AppLink>,
          {
            label: intl.formatMessage(messages.createGroup),
            props: {
              className: 'rbac-m-hide-on-md',
            },
            onClick: () => navigate(mergeToBasename(pathnames['add-group'].link)),
          },
          {
            label: intl.formatMessage(messages.edit),
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => navigate(mergeToBasename(pathnames['edit-group'].link.replace(':groupId', selectedRows[0].uuid))),
          },
          {
            label: intl.formatMessage(messages.delete),
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              setRemoveGroupsList(selectedRows);
              navigate(mergeToBasename(pathnames['remove-group'].link));
            },
          },
        ]
      : []),
  ];
  const data = groups.map((group) =>
    group.platform_default || group.admin_default ? { ...group, principalCount: `All${group.admin_default ? ' org admins' : ''}` } : group
  );
  const rows = createRows(isAdmin, data, selectedRows);
  const renderGroupsList = () => (
    <Stack className="rbac-c-groups">
      <StackItem>
        <TopToolbar paddingBottom>
          <TopToolbarTitle title={intl.formatMessage(messages.groups)} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id="tab-groups">
          <TableToolbarView
            data={groups}
            rows={rows}
            sortBy={sortByState}
            onSort={(e, index, direction) => {
              const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index - Number(isAdmin)].key}`;
              setSortByState({ index, direction });
              applyFiltersToUrl(location, navigate, { name: filterValue });
              fetchData({ ...pagination, orderBy, filters: { name: filterValue } });
            }}
            columns={columns}
            isSelectable={isAdmin}
            checkedRows={selectedRows}
            setCheckedItems={setCheckedItems}
            routes={routes}
            actionResolver={actionResolver}
            titlePlural={intl.formatMessage(messages.groups).toLowerCase()}
            titleSingular={intl.formatMessage(messages.group).toLowerCase()}
            ouiaId="groups-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={({ name, count, limit, offset, orderBy }) => {
              applyFiltersToUrl(location, navigate, { name });
              return fetchData({ count, limit, offset, orderBy, filters: { name } });
            }}
            setFilterValue={({ name = '' }) => setFilterValue(name)}
            toolbarButtons={toolbarButtons}
            isLoading={!isLoading && groups?.length === 0 && filterValue?.length === 0 ? true : isLoading}
            filterPlaceholder={intl.formatMessage(messages.name).toLowerCase()}
            rowWrapper={GroupRowWrapper}
            tableId="groups"
            textFilterRef={textFilterRef}
          />
        </Section>
      </StackItem>
    </Stack>
  );
  return (
    <Routes>
      <Route
        path={pathnames['group-detail-role-detail'].path}
        element={
          <PageActionRoute pageAction="role-detail">
            <Role />
          </PageActionRoute>
        }
      />
      <Route
        path={pathnames['group-detail'].path}
        element={
          <PageActionRoute pageAction="group-detail">
            <Group
              defaultUuid={systemGroup?.uuid}
              onDelete={(uuid) => {
                setFilterValue('');
                setSelectedRows(selectedRows.filter((row) => row.uuid != uuid));
              }}
            />
          </PageActionRoute>
        }
      />
      <Route path="/*" element={<PageActionRoute pageAction="group-list">{renderGroupsList()}</PageActionRoute>} />
    </Routes>
  );
};

export default Groups;
