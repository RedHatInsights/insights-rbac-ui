import React, { useContext, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import AddGroupWizard from './add-group/add-group-wizard';
import EditGroup from './edit-group-modal';
import RemoveGroup from './remove-group-modal';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import { fetchAdminGroup, fetchGroups, fetchSystemGroup } from '../../redux/actions/group-actions';
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

const columns = [
  { title: 'Name', key: 'name', transforms: [sortable] },
  { title: 'Roles' },
  { title: 'Members' },
  { title: 'Last modified', key: 'modified', transforms: [sortable] },
];

const Groups = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const fetchData = (options) => dispatch(fetchGroups({ ...options, inModal: false }));
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  const { groups, meta, filters, isLoading, systemGroup } = useSelector(
    ({ groupReducer: { groups, isLoading, adminGroup, systemGroup } }) => ({
      groups: [
        ...(adminGroup?.name?.match(new RegExp(groups.filters.name, 'i')) ? [adminGroup] : []),
        ...(systemGroup?.name?.match(new RegExp(groups.filters.name, 'i')) ? [systemGroup] : []),
        ...(groups?.data?.filter(({ platform_default, admin_default } = {}) => !(platform_default || admin_default)) || []),
      ],
      meta: groups?.pagination || groups?.meta,
      filters: groups?.filters,
      isLoading,
      systemGroup,
    }),
    shallowEqual
  );

  const [pagination, setPagination] = useState(meta);
  const [filterValue, setFilterValue] = useState(filters.name || '');
  const [selectedRows, setSelectedRows] = useState([]);
  const [removeGroupsList, setRemoveGroupsList] = useState([]);

  useEffect(() => {
    const syncedPagination = syncDefaultPaginationWithUrl(location, navigate, pagination);
    setPagination(syncedPagination);
    const { name } = syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
    setFilterValue(name);
    insights.chrome.appNavClick({ id: 'groups', secondaryNav: true });
    fetchData({ ...syncedPagination, filters: { name } });
    dispatch(fetchAdminGroup(name));
    dispatch(fetchSystemGroup(name));
  }, []);

  useEffect(() => {
    isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
    filterValue?.length > 0 &&
      !areFiltersPresentInUrl(location, ['name']) &&
      syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
  });

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault, admin_default: isAdminDefault }) => !(isPlatformDefault || isAdminDefault))
        .map(({ uuid, name }) => ({ uuid, label: name }))
    );
  };

  useEffect(() => {
    pagination.redirected && applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
  }, [pagination.redirected]);

  useEffect(() => {
    setFilterValue(filters.name);
    setPagination(meta);
  }, [filters, meta]);

  const routes = () => (
    <Routes>
      <Route
        path="add-group"
        element={
          <AddGroupWizard
            pagination={pagination}
            filters={filters}
            postMethod={(config) => {
              fetchData(config);
              setFilterValue('');
            }}
          />
        }
      />
      <Route
        path="edit/:id"
        element={
          <EditGroup
            pagination={pagination}
            filters={filters}
            postMethod={(config) => {
              fetchData(config);
            }}
            cancelRoute={getBackRoute('../', pagination, filters)}
            submitRoute={getBackRoute('../', { ...pagination, offset: 0 }, filters)}
          />
        }
      />
      <Route
        path="removegroups"
        element={
          <RemoveGroup
            pagination={pagination}
            filters={filters}
            postMethod={(ids, config) => {
              fetchData(config);
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
            title: 'Edit',
            onClick: (_event, _rowId, group) => {
              navigate(`edit/${group.uuid}`);
            },
          },
          {
            title: 'Delete',
            onClick: (_event, _rowId, group) => {
              setRemoveGroupsList([group]);
              navigate('removegroups');
            },
          },
        ];

  // TODO check this later
  const toolbarButtons = () => [
    ...(isAdmin
      ? [
          <Link to="add-group" key="add-group" className="rbac-m-hide-on-sm">
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
              navigate('add-group');
            },
          },
          {
            label: 'Edit',
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => navigate(`/groups/edit/${selectedRows[0].uuid}`),
          },
          {
            label: 'Delete',
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              setRemoveGroupsList(selectedRows);
              navigate(pathnames['remove-group'].path);
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
            data={groups.map((group) =>
              group.platform_default || group.admin_default ? { ...group, principalCount: `All${group.admin_default ? ' org admins' : ''}` } : group
            )}
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
              applyPaginationToUrl(location, navigate, limit, offset);
              applyFiltersToUrl(location, navigate, { name });
              return fetchData({ count, limit, offset, orderBy, filters: { name } });
            }}
            setFilterValue={({ name = '' }) => setFilterValue(name)}
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
    <Routes>
      <Route
        path="detail/:groupUuid/roles/detail/:uuid/*"
        element={
          <PageActionRoute pageAction="role-detail">
            <Role />
          </PageActionRoute>
        }
      />
      <Route
        path="detail/:uuid/*"
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
