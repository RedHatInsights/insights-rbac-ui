import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import NotAuthorized from '@patternfly/react-component-groups/dist/dynamic/NotAuthorized';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { TableVariant } from '@patternfly/react-table';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import Section from '@redhat-cloud-services/frontend-components/Section';

import { TableView, useTableState } from '../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../components/table-view/types';
import { ActionDropdown } from '../../components/ActionDropdown';
import { AppLink } from '../../components/navigation/AppLink';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { useAppLink } from '../../hooks/useAppLink';
import { getBackRoute } from '../../helpers/navigation';
import { getDateFormat } from '../../helpers/stringUtilities';
import { defaultAdminSettings, defaultSettings } from '../../helpers/pagination';
import { mappedProps } from '../../helpers/dataUtilities';
import { fetchRolesWithPolicies } from '../../redux/roles/actions';
import { fetchAdminGroup } from '../../redux/groups/actions';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { RolesEmptyState } from './components/RolesEmptyState';
import type { Access, Role, RoleGroup } from '../../redux/roles/reducer';
import type { Group } from '../../redux/groups/reducer';
import type { RBACStore } from '../../redux/store';
import './roles.scss';

// Column definitions
const columns = ['name', 'description', 'groups', 'permissions', 'modified'] as const;
type SortableColumnId = 'name' | 'modified';
type CompoundColumnId = 'groups' | 'permissions';

// Nested table for groups
const GroupsTable: React.FC<{ role: Role; adminGroup: Group | undefined }> = ({ role, adminGroup }) => {
  const intl = useIntl();

  const groupColumns = [intl.formatMessage(messages.groupName), intl.formatMessage(messages.description), ''];

  return (
    <Table aria-label={`Groups for role ${role.display_name}`} variant={TableVariant.compact} ouiaId={`compound-groups-${role.uuid}`}>
      <Thead>
        <Tr>
          {groupColumns.map((col, index) => (
            <Th key={index}>{col}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {role.groups_in && role.groups_in.length > 0 ? (
          role.groups_in.map((group: RoleGroup, index: number) => (
            <Tr key={`${role.uuid}-group-${group.uuid || index}`}>
              <Td dataLabel={groupColumns[0]}>
                <AppLink to={pathnames['group-detail'].link.replace(':groupId', group.uuid)}>{group.name}</AppLink>
              </Td>
              <Td dataLabel={groupColumns[1]}>{group.description}</Td>
              <Td dataLabel={groupColumns[2]} className="pf-v5-u-text-align-right">
                {adminGroup?.uuid !== group.uuid && (
                  <AppLink
                    to={pathnames['roles-add-group-roles'].link.replace(':roleId', role.uuid).replace(':groupId', group.uuid)}
                    state={{ name: group.name }}
                  >
                    {intl.formatMessage(messages.addRoleToThisGroup)}
                  </AppLink>
                )}
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={groupColumns.length}>
              <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroups)}</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Nested table for permissions
const PermissionsTable: React.FC<{ role: Role }> = ({ role }) => {
  const intl = useIntl();

  const permissionColumns = [
    intl.formatMessage(messages.application),
    intl.formatMessage(messages.resourceType),
    intl.formatMessage(messages.operation),
    intl.formatMessage(messages.lastModified),
  ];

  return (
    <Table aria-label={`Permissions for role ${role.display_name}`} variant={TableVariant.compact} ouiaId={`compound-permissions-${role.uuid}`}>
      <Thead>
        <Tr>
          {permissionColumns.map((col, index) => (
            <Th key={index}>{col}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {role.access && role.access.length > 0 ? (
          role.access.map((access: Access, index: number) => {
            const [appName, type, operation] = access.permission.split(':');
            return (
              <Tr key={`${role.uuid}-permission-${index}`}>
                <Td dataLabel={permissionColumns[0]}>{appName}</Td>
                <Td dataLabel={permissionColumns[1]}>{type}</Td>
                <Td dataLabel={permissionColumns[2]}>{operation}</Td>
                <Td dataLabel={permissionColumns[3]}>
                  <DateFormat date={role.modified} type={getDateFormat(role.modified)} />
                </Td>
              </Tr>
            );
          })
        ) : (
          <Tr>
            <Td colSpan={permissionColumns.length}>
              <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noPermissions)}</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Row actions dropdown
const RoleRowActions: React.FC<{
  role: Role;
  onEditRole: (roleId: string) => void;
  onDeleteRole: (roleIds: string[]) => void;
}> = ({ role, onEditRole, onDeleteRole }) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} aria-label={`Actions for role ${role.display_name}`} variant="plain" onClick={() => setIsOpen(!isOpen)}>
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem onClick={() => onEditRole(role.uuid)}>{intl.formatMessage(messages.edit)}</DropdownItem>
        <DropdownItem onClick={() => onDeleteRole([role.uuid])}>{intl.formatMessage(messages.delete)}</DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

/**
 * Roles list component with compound expandable rows using TableView.
 */
export const Roles: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const toAppLink = useAppLink();
  const dispatch = useDispatch();
  const chrome = useChrome();

  // Permissions
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Redux selectors
  const {
    roles,
    pagination: rawPagination,
    isLoading,
    adminGroup,
  } = useSelector(
    (state: RBACStore) => ({
      adminGroup: state.groupReducer?.adminGroup,
      roles: state.roleReducer?.roles?.data || [],
      pagination: state.roleReducer?.roles?.pagination || {},
      isLoading: state.roleReducer?.isLoading || false,
    }),
    shallowEqual,
  );

  const paginationDefaults = orgAdmin ? defaultAdminSettings : defaultSettings;
  const totalCount = rawPagination.count || 0;

  // Local state for remove roles modal
  const [removeRolesList, setRemoveRolesList] = useState<Array<{ uuid: string; label: string }>>([]);

  // Show NotAuthorized component for users without proper permissions
  if (!isAdmin) {
    return (
      <NotAuthorized
        serviceName="User Access Administration"
        description="You need User Access Administrator or Organization Administrator permissions to view roles."
      />
    );
  }

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      groups: { label: intl.formatMessage(messages.groups), isCompound: true },
      permissions: { label: intl.formatMessage(messages.permissions), isCompound: true },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(() => [{ id: 'display_name', label: 'Name', type: 'text', placeholder: 'Filter by name' }], []);

  // Handle data fetching via onStaleData
  const handleStaleData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      const nameFilter = params.filters.display_name as string | undefined;

      // Map column IDs to API sort parameters
      // The column ID is 'name' but API expects 'display_name'
      let apiOrderBy = params.orderBy;
      if (apiOrderBy) {
        apiOrderBy = apiOrderBy.replace(/^(-?)name$/, '$1display_name');
      }

      const apiParams = {
        limit: params.limit,
        offset: params.offset,
        orderBy: apiOrderBy,
        ...(nameFilter && nameFilter.trim() ? { filters: { display_name: nameFilter } } : {}),
      };

      dispatch(fetchRolesWithPolicies({ ...mappedProps(apiParams as Record<string, unknown>), usesMetaInURL: true, chrome }));
    },
    [dispatch, chrome],
  );

  // useTableState for all state management with URL sync
  const tableState = useTableState<typeof columns, Role, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns: ['name', 'modified'] as const,
    compoundColumns: ['groups', 'permissions'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: paginationDefaults.limit,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (role) => role.uuid,
    isRowSelectable: (role) => !(role.platform_default || role.admin_default || role.system),
    syncWithUrl: true,
    onStaleData: handleStaleData,
  });

  // Initialize permissions check and fetch admin group on mount
  useEffect(() => {
    chrome.appNavClick?.({ id: 'roles', secondaryNav: true });
    if (orgAdmin || userAccessAdministrator) {
      dispatch(fetchAdminGroup({ chrome }));
    }
  }, []);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => <AppLink to={pathnames['role-detail'].link.replace(':roleId', role.uuid)}>{role.display_name || role.name}</AppLink>,
      description: (role) => role.description || '—',
      groups: (role) => role.groups_in_count,
      permissions: (role) => role.accessCount,
      modified: (role) => <DateFormat date={role.modified} type={getDateFormat(role.modified)} />,
    }),
    [],
  );

  // Expansion renderers for compound expansion
  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, Role> = useMemo(
    () => ({
      groups: (role) => <GroupsTable role={role} adminGroup={adminGroup} />,
      permissions: (role) => <PermissionsTable role={role} />,
    }),
    [adminGroup],
  );

  // Navigation handlers
  const handleEditRole = useCallback(
    (roleId: string) => {
      navigate(toAppLink(pathnames['edit-role'].link.replace(':roleId', roleId)));
    },
    [navigate, toAppLink],
  );

  const handleDeleteRole = useCallback(
    (roleIds: string[]) => {
      const rolesToDelete = roles.filter((role) => roleIds.includes(role.uuid)).map((role) => ({ uuid: role.uuid, label: role.name }));
      setRemoveRolesList(rolesToDelete);
      navigate(toAppLink(pathnames['remove-role'].link.replace(':roleId', roleIds.join(','))));
    },
    [roles, navigate, toAppLink],
  );

  // Row actions renderer
  const renderActions = useCallback(
    (role: Role) => {
      if (role.platform_default || role.admin_default || role.system) {
        return null;
      }
      return <RoleRowActions role={role} onEditRole={handleEditRole} onDeleteRole={handleDeleteRole} />;
    },
    [handleEditRole, handleDeleteRole],
  );

  // Computed values
  const removingAllRows = totalCount === removeRolesList.length;

  return (
    <Fragment>
      <Stack className="rbac-c-roles">
        <StackItem>
          <PageLayout>
            <PageTitle title={intl.formatMessage(messages.roles)} />
          </PageLayout>
        </StackItem>
        <StackItem>
          <Section type="content" id="tab-roles">
            <TableView<typeof columns, Role, SortableColumnId, CompoundColumnId>
              columns={columns}
              columnConfig={columnConfig}
              sortableColumns={['name', 'modified'] as const}
              data={isLoading ? undefined : roles}
              totalCount={totalCount}
              getRowId={(role) => role.uuid}
              cellRenderers={cellRenderers}
              expansionRenderers={expansionRenderers}
              filterConfig={filterConfig}
              selectable={isAdmin}
              isRowSelectable={(role) => !(role.platform_default || role.admin_default || role.system)}
              renderActions={isAdmin ? renderActions : undefined}
              toolbarActions={
                isAdmin ? (
                  <AppLink to={pathnames['add-role'].link}>
                    <Button ouiaId="create-role-button" variant="primary" aria-label="Create role">
                      {intl.formatMessage(messages.createRole)}
                    </Button>
                  </AppLink>
                ) : undefined
              }
              bulkActions={
                isAdmin && tableState.selectedRows.length > 0 ? (
                  <ActionDropdown
                    ariaLabel="bulk actions"
                    ouiaId="roles-bulk-actions"
                    items={[
                      {
                        key: 'edit',
                        label: intl.formatMessage(messages.edit),
                        onClick: () => handleEditRole(tableState.selectedRows[0].uuid),
                        isDisabled: tableState.selectedRows.length !== 1,
                      },
                      {
                        key: 'delete',
                        label: intl.formatMessage(messages.delete),
                        onClick: () => handleDeleteRole(tableState.selectedRows.map((row) => row.uuid)),
                      },
                    ]}
                  />
                ) : undefined
              }
              emptyStateNoData={<RolesEmptyState hasActiveFilters={false} isAdmin={isAdmin} onClearFilters={() => {}} />}
              emptyStateNoResults={<RolesEmptyState hasActiveFilters={true} isAdmin={isAdmin} onClearFilters={tableState.clearAllFilters} />}
              ariaLabel="Roles table"
              ouiaId="roles-table"
              {...tableState}
            />

            <Suspense>
              <Outlet
                context={{
                  [pathnames['add-role'].path]: {
                    pagination: { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage, count: totalCount },
                    filters: { display_name: (tableState.filters.display_name as string) || '' },
                  },
                  [pathnames['remove-role'].path]: {
                    isLoading,
                    cancelRoute: getBackRoute(
                      pathnames.roles.link,
                      { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage },
                      { display_name: (tableState.filters.display_name as string) || '' },
                    ),
                    submitRoute: getBackRoute(
                      pathnames.roles.link,
                      { limit: tableState.perPage, offset: 0 },
                      removingAllRows ? {} : { display_name: (tableState.filters.display_name as string) || '' },
                    ),
                    afterSubmit: () => {
                      handleStaleData({
                        limit: tableState.perPage,
                        offset: 0,
                        orderBy: tableState.sort ? `${tableState.sort.direction === 'desc' ? '-' : ''}${tableState.sort.column}` : undefined,
                        filters: removingAllRows ? {} : tableState.filters,
                      });
                      tableState.clearSelection();
                    },
                    setFilterValue: (value: string) => tableState.onFiltersChange({ display_name: value }),
                  },
                  [pathnames['edit-role'].path]: {
                    isLoading,
                    cancelRoute: getBackRoute(
                      pathnames.roles.link,
                      { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage },
                      { display_name: (tableState.filters.display_name as string) || '' },
                    ),
                    afterSubmit: () => {
                      handleStaleData({
                        offset: 0,
                        limit: tableState.perPage,
                        orderBy: tableState.sort ? `${tableState.sort.direction === 'desc' ? '-' : ''}${tableState.sort.column}` : undefined,
                        filters: tableState.filters,
                      });
                      tableState.clearSelection();
                    },
                  },
                  [pathnames['roles-add-group-roles'].path]: {
                    closeUrl: getBackRoute(
                      pathnames.roles.link,
                      { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage },
                      { display_name: (tableState.filters.display_name as string) || '' },
                    ),
                    afterSubmit: () => {
                      handleStaleData({
                        offset: 0,
                        limit: tableState.perPage,
                        orderBy: tableState.sort ? `${tableState.sort.direction === 'desc' ? '-' : ''}${tableState.sort.column}` : undefined,
                        filters: tableState.filters,
                      });
                    },
                  },
                }}
              />
            </Suspense>
          </Section>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

// Feature container - both named AND default export
export default Roles;
