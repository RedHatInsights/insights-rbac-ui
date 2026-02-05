import React, { Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
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
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppLink } from '../../hooks/useAppLink';
import { getBackRoute } from '../../helpers/navigation';
import { getDateFormat } from '../../helpers/stringUtilities';
import { defaultAdminSettings, defaultSettings } from '../../helpers/pagination';
import { type ListRolesParams, useRolesQuery } from '../../data/queries/roles';
import { useAdminGroupQuery } from '../../data/queries/groups';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import { shouldShowAddRoleToGroupLink } from './utils/roleVisibility';
import pathnames from '../../utilities/pathnames';
import { RolesEmptyState } from './components/RolesEmptyState';
import type { Access, RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';

// Extended role type for the list view (includes groups_in from addFields)
interface RoleGroup {
  uuid: string;
  name: string;
  description?: string;
}

interface RoleListItem extends RoleOutDynamic {
  groups_in?: RoleGroup[];
  access?: Access[];
}

// Column definitions
const columns = ['name', 'description', 'groups', 'permissions', 'modified'] as const;
type SortableColumnId = 'name' | 'modified';
type CompoundColumnId = 'groups' | 'permissions';

// Admin group type from the query
interface AdminGroup {
  uuid: string;
  name?: string;
  admin_default?: boolean;
}

// Nested table for groups
const GroupsTable: React.FC<{ role: RoleListItem; adminGroup: AdminGroup | null | undefined }> = ({ role, adminGroup }) => {
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
                <AppLink to={pathnames['group-detail'].link(group.uuid)}>{group.name}</AppLink>
              </Td>
              <Td dataLabel={groupColumns[1]}>{group.description}</Td>
              <Td dataLabel={groupColumns[2]} className="pf-v6-u-text-align-right">
                {shouldShowAddRoleToGroupLink(adminGroup, group) && (
                  <AppLink to={pathnames['roles-add-group-roles'].link(role.uuid, group.uuid)} state={{ name: group.name }}>
                    {intl.formatMessage(messages.addRoleToThisGroup)}
                  </AppLink>
                )}
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={groupColumns.length}>
              <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
                {intl.formatMessage(messages.noGroups)}
              </Content>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Nested table for permissions
const PermissionsTable: React.FC<{ role: RoleListItem }> = ({ role }) => {
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
              <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
                {intl.formatMessage(messages.noPermissions)}
              </Content>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};

// Row actions dropdown
const RoleRowActions: React.FC<{
  role: RoleListItem;
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
  const chrome = useChrome();

  // Permissions
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  const paginationDefaults = orgAdmin ? defaultAdminSettings : defaultSettings;

  // Local state for remove roles modal
  const [removeRolesList, setRemoveRolesList] = useState<Array<{ uuid: string; label: string }>>([]);

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

  // useTableState for all state management with URL sync
  const tableState = useTableState<typeof columns, RoleListItem, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns: ['name', 'modified'] as const,
    compoundColumns: ['groups', 'permissions'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: paginationDefaults.limit,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (role) => role.uuid,
    isRowSelectable: (role) => !(role.platform_default || role.admin_default || role.system),
    syncWithUrl: true,
  });

  // Build query params from table state
  const queryParams: ListRolesParams = useMemo(() => {
    // Map column IDs to API sort parameters ('name' -> 'display_name')
    let orderBy = tableState.sort ? `${tableState.sort.direction === 'desc' ? '-' : ''}${tableState.sort.column}` : undefined;
    if (orderBy) {
      orderBy = orderBy.replace(/^(-?)name$/, '$1display_name');
    }

    return {
      limit: tableState.perPage,
      offset: (tableState.page - 1) * tableState.perPage,
      orderBy: orderBy as ListRolesParams['orderBy'],
      displayName: (tableState.filters.display_name as string) || undefined,
      nameMatch: 'partial',
      scope: 'org_id',
      addFields: ['groups_in_count', 'groups_in', 'access'],
    };
  }, [tableState.perPage, tableState.page, tableState.sort, tableState.filters]);

  // TanStack Query for roles data
  const { data: rolesData, isLoading, refetch } = useRolesQuery(queryParams);

  const roles = (rolesData?.data as RoleListItem[] | undefined) ?? [];
  const totalCount = rolesData?.meta?.count ?? 0;

  // TanStack Query for admin group - only fetch if user is admin
  const { data: adminGroup } = useAdminGroupQuery({ enabled: isAdmin });

  // Initialize nav on mount
  useEffect(() => {
    chrome.appNavClick?.({ id: 'roles', secondaryNav: true });
  }, [chrome]);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, RoleListItem> = useMemo(
    () => ({
      name: (role) => <AppLink to={pathnames['role-detail'].link(role.uuid)}>{role.display_name || role.name}</AppLink>,
      description: (role) => role.description || '—',
      groups: (role) => role.groups_in_count,
      permissions: (role) => role.accessCount,
      modified: (role) => <DateFormat date={role.modified} type={getDateFormat(role.modified)} />,
    }),
    [],
  );

  // Expansion renderers for compound expansion
  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, RoleListItem> = useMemo(
    () => ({
      groups: (role) => <GroupsTable role={role} adminGroup={adminGroup} />,
      permissions: (role) => <PermissionsTable role={role} />,
    }),
    [adminGroup],
  );

  // Navigation handlers
  const handleEditRole = useCallback(
    (roleId: string) => {
      navigate(toAppLink(pathnames['edit-role'].link(roleId)));
    },
    [navigate, toAppLink],
  );

  const handleDeleteRole = useCallback(
    (roleIds: string[]) => {
      const rolesToDelete = roles.filter((role) => roleIds.includes(role.uuid)).map((role) => ({ uuid: role.uuid, label: role.name }));
      setRemoveRolesList(rolesToDelete);
      navigate(toAppLink(pathnames['remove-role'].link(roleIds.join(','))));
    },
    [roles, navigate, toAppLink],
  );

  // Row actions renderer
  const renderActions = useCallback(
    (role: RoleListItem) => {
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
    <PageLayout title={{ title: intl.formatMessage(messages.roles) }}>
      <Section type="content" id="tab-roles">
        <TableView<typeof columns, RoleListItem, SortableColumnId, CompoundColumnId>
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
              <AppLink to={pathnames['add-role'].link()}>
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
                cancelRoute: pathnames.roles.link(),
              },
              [pathnames['remove-role'].path]: {
                isLoading,
                cancelRoute: getBackRoute(
                  pathnames.roles.link(),
                  { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage },
                  { display_name: (tableState.filters.display_name as string) || '' },
                ),
                submitRoute: getBackRoute(
                  pathnames.roles.link(),
                  { limit: tableState.perPage, offset: 0 },
                  removingAllRows ? {} : { display_name: (tableState.filters.display_name as string) || '' },
                ),
                afterSubmit: () => {
                  refetch();
                  tableState.clearSelection();
                },
                setFilterValue: (value: string) => tableState.onFiltersChange({ display_name: value }),
              },
              [pathnames['edit-role'].path]: {
                isLoading,
                cancelRoute: getBackRoute(
                  pathnames.roles.link(),
                  { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage },
                  { display_name: (tableState.filters.display_name as string) || '' },
                ),
                afterSubmit: () => {
                  refetch();
                  tableState.clearSelection();
                },
              },
              [pathnames['roles-add-group-roles'].path]: {
                closeUrl: getBackRoute(
                  pathnames.roles.link(),
                  { limit: tableState.perPage, offset: (tableState.page - 1) * tableState.perPage },
                  { display_name: (tableState.filters.display_name as string) || '' },
                ),
                afterSubmit: () => {
                  refetch();
                },
              },
            }}
          />
        </Suspense>
      </Section>
    </PageLayout>
  );
};

// Feature container - both named AND default export
export default Roles;
