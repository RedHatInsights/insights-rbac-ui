import React, { Suspense, useContext, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cellWidth } from '@patternfly/react-table';
import { compoundExpand } from '@patternfly/react-table';
import { nowrap } from '@patternfly/react-table';
import { sortable } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { isSmallScreen, useScreenSize } from '@redhat-cloud-services/frontend-components/useScreenSize';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import Section from '@redhat-cloud-services/frontend-components/Section';
import { createRows } from './role-table-helpers';
import { mappedProps } from '../../helpers/dataUtilities';
import { getBackRoute, removeQueryParams } from '../../helpers/navigation';
import { fetchRolesWithPolicies } from '../../redux/roles/actions';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { TableToolbarView } from '../../components/tables/TableToolbarView';
import PermissionsContext from '../../utilities/permissionsContext';
import {
  applyPaginationToUrl,
  defaultAdminSettings,
  defaultSettings,
  isPaginationPresentInUrl,
  syncDefaultPaginationWithUrl,
} from '../../helpers/pagination';
import { applyFiltersToUrl, areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../helpers/urlFilters';
import RoleRowWrapper from './role-row-wrapper';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import messages from '../../Messages';
import paths from '../../utilities/pathnames';
import './roles.scss';
import pathnames from '../../utilities/pathnames';
import { addRolesToGroup, fetchAdminGroup } from '../../redux/groups/actions';

const Roles = () => {
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const [selectedRows, setSelectedRows] = useState([]);
  const intl = useIntl();
  const dispatch = useDispatch();
  const textFilterRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const screenSize = useScreenSize();
  const chrome = useChrome();
  const toAppLink = useAppLink();

  const { roles, filters, pagination, isLoading, adminGroup } = useSelector(
    ({
      roleReducer: {
        roles: { data, filters, pagination },
        isLoading,
      },
      groupReducer: { adminGroup },
    }) => ({
      adminGroup,
      roles: data,
      filters,
      pagination: {
        limit: pagination.limit ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
        offset: pagination.offset ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
        count: pagination.count,
        redirected: pagination.redirected,
      },
      isLoading,
    }),
    shallowEqual,
  );

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'display_name', transforms: [cellWidth(20), sortable] },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.groups), cellTransforms: [compoundExpand], transforms: [nowrap] },
    { title: intl.formatMessage(messages.permissions), cellTransforms: [compoundExpand], transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastModified), key: 'modified', transforms: [nowrap, sortable] },
  ];
  const fetchData = (options) => dispatch(fetchRolesWithPolicies({ ...options, usesMetaInURL: true, chrome }));

  const isSelectable = orgAdmin || userAccessAdministrator;
  const [filterValue, setFilterValue] = useState(filters.display_name || '');
  const [sortByState, setSortByState] = useState({ index: Number(isSelectable), direction: 'asc' });
  const [expanded, setExpanded] = useState({});
  const [removeRolesList, setRemoveRolesList] = useState([]);
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);

  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index - Number(isSelectable)].key}`;

  useEffect(() => {
    applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
  }, [pagination.offset, pagination.limit, pagination.count, pagination.redirected]);

  useEffect(() => {
    applyFiltersToUrl(location, navigate, { display_name: filterValue });
  }, [filterValue]);

  useEffect(() => {
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, pagination);
    const { display_name } = syncDefaultFiltersWithUrl(location, navigate, ['display_name'], { display_name: filterValue });
    setFilterValue(display_name);
    chrome.appNavClick({ id: 'roles', secondaryNav: true });
    dispatch(fetchAdminGroup({ chrome }));
    fetchData({ limit, offset, orderBy, filters: { display_name } });
  }, []);

  useEffect(() => {
    if (!location.pathname.includes('detail')) {
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      filterValue?.length > 0 &&
        !areFiltersPresentInUrl(location, ['display_name']) &&
        syncDefaultFiltersWithUrl(location, navigate, ['display_name'], { display_name: filterValue });
    } else {
      removeQueryParams(location, navigate);
    }
  }, [location.pathname]);

  const actionResolver = (row) =>
    row.compoundParent
      ? []
      : [
          {
            title: intl.formatMessage(messages.edit),
            onClick: (_event, _rowId, role) => navigate(toAppLink(paths['edit-role'].link.replace(':roleId', role.uuid))),
          },
          {
            title: intl.formatMessage(messages.delete),
            onClick: (_event, _rowId, role) => {
              setRemoveRolesList([role]);
              navigate(toAppLink(paths['remove-role'].link.replace(':roleId', role.uuid)));
            },
          },
        ];

  const toolbarButtons = () =>
    orgAdmin || userAccessAdministrator
      ? [
          <AppLink to={paths['add-role'].link} key="add-role" className="rbac-m-hide-on-sm">
            <Button ouiaId="create-role-button" variant="primary" aria-label="Create role">
              {intl.formatMessage(messages.createRole)}
            </Button>
          </AppLink>,
          ...(isSmallScreen(screenSize)
            ? [
                {
                  label: intl.formatMessage(messages.createRole),
                  onClick: () => navigate(toAppLink(paths['add-role'].link)),
                },
              ]
            : []),
          {
            label: intl.formatMessage(messages.edit),
            props: {
              isDisabled: !(selectedRows.length === 1),
            },
            onClick: () => navigate(toAppLink(paths['edit-role'].link.replace(':roleId', selectedRows[0].uuid))),
          },
          {
            label: intl.formatMessage(messages.delete),
            props: {
              isDisabled: !selectedRows.length > 0,
            },
            onClick: () => {
              setRemoveRolesList(selectedRows);
              navigate(
                toAppLink(
                  paths['remove-role'].link.replace(
                    ':roleId',
                    selectedRows.map(({ uuid }) => uuid),
                  ),
                ),
              );
            },
          },
        ]
      : [];

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) =>
      newSelection(rows)
        .filter(({ platform_default: isPlatformDefault, admin_default: isAdminDefault, system }) => !(isPlatformDefault || isAdminDefault || system))
        .map(({ uuid, name }) => ({ uuid, label: name })),
    );
  };

  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) =>
    setExpanded({ ...expanded, [rowData.uuid]: isOpen ? -1 : colIndex + Number(!isSelectable) });

  const rows = createRows(roles, selectedRows, intl, expanded, adminGroup);
  // used for (not) reseting the filters after submit
  const removingAllRows = pagination.count === removeRolesList.length;

  return (
    <Stack className="rbac-c-roles">
      <StackItem>
        <PageLayout>
          <PageTitle title={intl.formatMessage(messages.roles)} />
        </PageLayout>
      </StackItem>
      <StackItem>
        <Section type="content" id="tab-roles">
          <TableToolbarView
            isSelectable={isSelectable}
            isRowSelectable={(row) => !(row.platform_default || row.admin_default || row.system)}
            checkedRows={selectedRows}
            textFilterRef={textFilterRef}
            setCheckedItems={setCheckedItems}
            actionResolver={actionResolver}
            columns={columns}
            areActionsDisabled={({ system }) => !!system}
            rowWrapper={RoleRowWrapper}
            rows={rows}
            data={roles}
            filterValue={filterValue}
            fetchData={({ name, limit, offset }) => {
              applyFiltersToUrl(location, navigate, { display_name: name });
              return fetchData(mappedProps({ limit, offset, orderBy, filters: { display_name: name } }));
            }}
            setFilterValue={({ name = '' }) => setFilterValue(name)}
            isExpandable
            onExpand={onExpand}
            isLoading={!isLoading && roles?.length === 0 && filterValue?.length === 0 ? true : isLoading}
            pagination={pagination}
            ouiaId="roles-table"
            titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
            titleSingular={intl.formatMessage(messages.role).toLowerCase()}
            toolbarButtons={toolbarButtons}
            filterPlaceholder={intl.formatMessage(messages.name).toLowerCase()}
            tableId="roles"
            sortBy={sortByState}
            onSort={(e, index, direction) => {
              const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index - Number(isSelectable)].key}`;
              setSortByState({ index, direction });
              fetchData(
                mappedProps({
                  limit: pagination.limit,
                  offset: 0,
                  orderBy,
                  filters: { display_name: filterValue },
                }),
              );
            }}
          />
          <Suspense>
            <Outlet
              context={{
                [pathnames['add-role'].path]: {
                  pagination,
                  filters: { display_name: filterValue },
                },
                [pathnames['remove-role'].path]: {
                  isLoading,
                  cancelRoute: getBackRoute(paths.roles.link, pagination, filters),
                  submitRoute: getBackRoute(paths.roles.link, { ...pagination, offset: 0 }, removingAllRows ? {} : filters),
                  afterSubmit: () => {
                    fetchData({ ...pagination, filters: removingAllRows ? {} : { display_name: filterValue }, offset: 0 }, true);
                    removingAllRows && setFilterValue('');
                    setSelectedRows([]);
                  },
                  setFilterValue,
                },
                [pathnames['edit-role'].path]: {
                  isLoading,
                  cancelRoute: getBackRoute(paths.roles.link, pagination, filters),
                  afterSubmit: () => {
                    fetchData({ ...pagination, offset: 0, filters: { display_name: filterValue } }, true);
                    setSelectedRows([]);
                  },
                },
                [pathnames['roles-add-group-roles'].path]: {
                  selectedRoles: selectedAddRoles,
                  setSelectedRoles: setSelectedAddRoles,
                  closeUrl: getBackRoute(paths.roles.link, pagination, filters),
                  addRolesToGroup: (groupId, roles) => dispatch(addRolesToGroup(groupId, roles)),
                  afterSubmit: () => {
                    fetchData({ ...pagination, offset: 0, filters: { display_name: filterValue } }, true);
                    setSelectedAddRoles([]);
                  },
                },
              }}
            />
          </Suspense>
        </Section>
      </StackItem>
    </Stack>
  );
};

export default Roles;
