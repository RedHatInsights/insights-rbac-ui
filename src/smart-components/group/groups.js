import React, { Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { compoundExpand, nowrap, sortable } from '@patternfly/react-table';
import { Button, Stack, StackItem } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import Section from '@redhat-cloud-services/frontend-components/Section';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './group-table-helpers';
import {
  fetchAdminGroup,
  fetchGroups,
  fetchMembersForExpandedGroup,
  fetchRolesForExpandedGroup,
  fetchSystemGroup,
} from '../../redux/actions/group-actions';
import AppLink, { mergeToBasename } from '../../presentational-components/shared/AppLink';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupRowWrapper from './group-row-wrapper';
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

const Groups = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const chrome = useChrome();
  const fetchData = (options) => dispatch(fetchGroups({ ...options, usesMetaInURL: true, chrome, platformDefault: false, adminDefault: false }));
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;
  const textFilterRef = useRef(null);

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'name', transforms: [sortable] },
    { title: intl.formatMessage(messages.roles), cellTransforms: [compoundExpand], transforms: [nowrap] },
    { title: intl.formatMessage(messages.members), cellTransforms: [compoundExpand], transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [sortable] },
  ];

  // using 'isAdmin' (0 or 1) determines correct index for columns due to 'isSelectable' property on Table component
  const [sortByState, setSortByState] = useState({ index: Number(isAdmin), direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState([]);
  const [removeGroupsList, setRemoveGroupsList] = useState([]);
  const [expanded, setExpanded] = useState({});

  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index - Number(isAdmin)].key}`;

  const { groups, pagination, filters, isLoading } = useSelector(
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
    shallowEqual,
  );

  const [filterValue, setFilterValue] = useState(filters?.name || '');

  useEffect(() => {
    applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
  }, [pagination.offset, pagination.limit, pagination.count, pagination.redirected]);

  useEffect(() => {
    applyFiltersToUrl(location, navigate, { name: filterValue });
  }, [filterValue]);

  useEffect(() => {
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, pagination);
    const { name } = syncDefaultFiltersWithUrl(location, navigate, ['name'], { name: filterValue });
    setFilterValue(name);
    chrome.appNavClick({ id: 'groups', secondaryNav: true });
    fetchData({ limit, offset, orderBy, filters: { name } });
    dispatch(fetchAdminGroup({ filterValue: name, chrome }));
    dispatch(fetchSystemGroup({ filterValue: name, chrome }));
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
        .map(({ uuid, name }) => ({ uuid, name })),
    );
  };

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
              navigate(mergeToBasename(pathnames['remove-group'].link.replace(':groupId', group.uuid)));
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
              navigate(
                mergeToBasename(
                  pathnames['remove-group'].link.replace(
                    ':groupId',
                    selectedRows.map(({ uuid }) => uuid),
                  ),
                ),
              );
            },
          },
        ]
      : []),
  ];

  const data = groups.map((group) =>
    group.platform_default || group.admin_default ? { ...group, principalCount: `All${group.admin_default ? ' org admins' : ''}` } : group,
  );

  const fetchExpandedRoles = useCallback((uuid, flags) => dispatch(fetchRolesForExpandedGroup(uuid, { limit: 100 }, flags)), [dispatch]);
  const fetchExpandedMembers = useCallback((uuid) => dispatch(fetchMembersForExpandedGroup(uuid, undefined, { limit: 100 })), [dispatch]);
  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
    if (!isOpen) {
      setExpanded({ ...expanded, [rowData.uuid]: colIndex + Number(!isAdmin) });
      colIndex + Number(!isAdmin) === 2 &&
        fetchExpandedRoles(rowData.uuid, { isPlatformDefault: rowData.isPlatformDefault, isAdminDefault: rowData.isAdminDefault });
      colIndex + Number(!isAdmin) === 3 && fetchExpandedMembers(rowData.uuid);
    } else {
      setExpanded({ ...expanded, [rowData.uuid]: -1 });
    }
  };

  const rows = createRows(isAdmin, data, selectedRows, expanded);
  // used for (not) reseting the filters after submit
  const removingAllRows = pagination.count === removeGroupsList.length;

  return (
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
            isExpandable
            onExpand={onExpand}
            isSelectable={isAdmin}
            isRowSelectable={(row) => !(row.platform_default || row.admin_default || row.system)}
            checkedRows={selectedRows}
            setCheckedItems={setCheckedItems}
            actionResolver={actionResolver}
            titlePlural={intl.formatMessage(messages.groups).toLowerCase()}
            titleSingular={intl.formatMessage(messages.group).toLowerCase()}
            ouiaId="groups-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={({ name, count, limit, offset }) => {
              applyFiltersToUrl(location, navigate, { name });
              return fetchData({ count, limit, offset, orderBy, filters: { name } });
            }}
            setFilterValue={({ name = '' }) => setFilterValue(name)}
            toolbarButtons={toolbarButtons}
            isLoading={isLoading}
            filterPlaceholder={intl.formatMessage(messages.name).toLowerCase()}
            rowWrapper={GroupRowWrapper}
            tableId="groups"
            textFilterRef={textFilterRef}
          />
          <Suspense>
            <Outlet
              context={{
                pagination,
                filters,
                [pathnames['add-group'].path]: {
                  orderBy,
                  postMethod: (config) => {
                    setFilterValue('');
                    fetchData(config);
                  },
                },
                [pathnames['edit-group'].path]: {
                  postMethod: (config) => {
                    setFilterValue('');
                    fetchData({ ...config, orderBy });
                  },
                  cancelRoute: getBackRoute(pathnames['groups'].link, pagination, filters),
                  submitRoute: getBackRoute(pathnames['groups'].link, { ...pagination, offset: 0 }, filters),
                },
                [pathnames['remove-group'].path]: {
                  postMethod: (ids, config) => {
                    fetchData({ ...config, filters: { name: removingAllRows ? '' : filterValue }, orderBy });
                    removingAllRows && setFilterValue('');
                    setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
                  },
                  cancelRoute: getBackRoute(pathnames['groups'].link, pagination, filters),
                  submitRoute: getBackRoute(pathnames['groups'].link, { ...pagination, offset: 0 }, removingAllRows ? {} : filters),
                },
              }}
            />
          </Suspense>
        </Section>
      </StackItem>
    </Stack>
  );
};

export default Groups;
