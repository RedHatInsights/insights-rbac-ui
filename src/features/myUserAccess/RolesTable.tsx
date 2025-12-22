/**
 * RolesTable Component
 *
 * Displays roles with compound expandable permissions using TableView.
 */

import React, { Fragment, Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { TableVariant } from '@patternfly/react-table';
import { SkeletonTableBody } from '@patternfly/react-component-groups';

import { TableView, useTableState } from '../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../components/table-view/types';
import { fetchRoleForPrincipal, fetchRoles } from '../../redux/roles/actions';
import messages from '../../Messages';
import { ResourceDefinitionsLink } from './components/ResourceDefinitionsLink';
import type { ResourceDefinitionsConfig } from './types';

const ResourceDefinitionsModal = lazy(() =>
  import('./components/ResourceDefinitionsModal').then((module) => ({ default: module.ResourceDefinitionsModal })),
);

interface RolesTableProps {
  apps: string[];
  showResourceDefinitions?: boolean;
}

interface RoleData {
  uuid: string;
  display_name?: string;
  name: string;
  description: string;
  accessCount: number;
}

interface RoleAccess {
  permission: string;
  resourceDefinitions: any[];
}

// Column definitions
const columns = ['display_name', 'description', 'permissions'] as const;
type SortableColumnId = 'display_name';
type CompoundColumnId = 'permissions';

export const RolesTable: React.FC<RolesTableProps> = ({ apps, showResourceDefinitions = false }) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  // Redux selectors
  const { roles, isLoading, rolesWithAccess } = useSelector(
    ({ roleReducer: { roles, isLoading, rolesWithAccess } }: any) => ({
      roles,
      isLoading,
      rolesWithAccess,
    }),
    shallowEqual,
  );

  const totalCount = roles?.meta?.count || 0;
  const rolesData: RoleData[] = roles?.data || [];

  // Resource definitions modal state
  const [rdConfig, setRdConfig] = useState<ResourceDefinitionsConfig>({
    rdOpen: false,
    rdPermission: undefined,
    resourceDefinitions: undefined,
  });

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      display_name: { label: intl.formatMessage(messages.roles), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      permissions: { label: intl.formatMessage(messages.permissions), isCompound: true },
    }),
    [intl],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      { id: 'role', label: 'Role name', type: 'text', placeholder: 'Filter by role name...' },
      {
        id: 'application',
        label: 'Application',
        type: 'checkbox',
        placeholder: 'Filter by application...',
        options: apps.map((app) => ({ id: app, label: app })),
      },
    ],
    [apps],
  );

  // Handle data fetching via onStaleData
  const handleStaleData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      const roleFilter = params.filters.role as string | undefined;
      const applicationFilter = params.filters.application as string[] | undefined;
      const applicationParam = applicationFilter?.length ? applicationFilter.join(',') : apps.join(',');

      dispatch(
        fetchRoles({
          limit: params.limit,
          offset: params.offset,
          orderBy: params.orderBy,
          scope: 'principal',
          application: applicationParam,
          ...(roleFilter && roleFilter.trim() ? { name: roleFilter } : {}),
        }) as any,
      );
    },
    [dispatch, apps],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, RoleData, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns: ['display_name'] as const,
    compoundColumns: ['permissions'] as const,
    initialSort: { column: 'display_name', direction: 'asc' },
    initialPerPage: 20,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (role) => role.uuid,
    onStaleData: handleStaleData,
  });

  // Handle expansion to fetch role permissions
  const handleExpand = useCallback(
    (role: RoleData, columnId: CompoundColumnId) => {
      if (columnId === 'permissions' && !rolesWithAccess?.[role.uuid]) {
        dispatch(fetchRoleForPrincipal(role.uuid) as any);
      }
    },
    [dispatch, rolesWithAccess],
  );

  // Handle resource definitions click
  const handleRdClick = useCallback((permission: string, resourceDefinitions: any[]) => {
    setRdConfig({
      rdOpen: true,
      rdPermission: permission,
      resourceDefinitions,
    });
  }, []);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, RoleData> = useMemo(
    () => ({
      display_name: (role) => role.display_name || role.name,
      description: (role) => role.description || '—',
      permissions: (role) => role.accessCount,
    }),
    [],
  );

  // Permission table column headers
  const permissionColumns = useMemo(
    () => [
      intl.formatMessage(messages.application),
      intl.formatMessage(messages.resourceType),
      intl.formatMessage(messages.operation),
      ...(showResourceDefinitions ? [intl.formatMessage(messages.resourceDefinitions)] : []),
    ],
    [intl, showResourceDefinitions],
  );

  // Expansion renderers for compound expansion
  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, RoleData> = useMemo(
    () => ({
      permissions: (role) => {
        const rolePermissions = rolesWithAccess?.[role.uuid];

        // Show loading skeleton while permissions are being fetched
        if (!rolePermissions) {
          return (
            <Table ouiaId="permissions-in-role-nested-table" aria-label="Permissions Table" borders={false} variant={TableVariant.compact}>
              <Thead>
                <Tr>
                  {permissionColumns.map((cell, index) => (
                    <Th key={index}>{cell}</Th>
                  ))}
                </Tr>
              </Thead>
              <SkeletonTableBody rowsCount={role.accessCount || 3} columnsCount={permissionColumns.length} />
            </Table>
          );
        }

        return (
          <Table ouiaId="permissions-in-role-nested-table" aria-label="Permissions Table" borders={false} variant={TableVariant.compact}>
            <Thead>
              <Tr>
                {permissionColumns.map((cell, index) => (
                  <Th key={index}>{cell}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {rolePermissions.access.map((access: RoleAccess, index: number) => (
                <Tr key={`${role.uuid}-permission-${access.permission || index}`}>
                  {access.permission.split(':').map((part, partIndex) => (
                    <Td key={partIndex}>{part}</Td>
                  ))}
                  {showResourceDefinitions && (
                    <Td>
                      <ResourceDefinitionsLink onClick={() => handleRdClick(access.permission, access.resourceDefinitions)} access={access} />
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        );
      },
    }),
    [rolesWithAccess, permissionColumns, showResourceDefinitions, handleRdClick],
  );

  return (
    <Fragment>
      <TableView<typeof columns, RoleData, SortableColumnId, CompoundColumnId>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={['display_name'] as const}
        data={isLoading ? undefined : rolesData}
        totalCount={totalCount}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        expansionRenderers={expansionRenderers}
        filterConfig={filterConfig}
        ariaLabel={intl.formatMessage(messages.roles)}
        ouiaId="my-user-access-roles-table"
        onExpand={handleExpand}
        emptyStateNoData="Configure roles"
        emptyStateNoResults="No matching roles found"
        {...tableState}
      />
      <Suspense fallback={<Fragment />}>
        {rdConfig.rdOpen && (
          <ResourceDefinitionsModal
            resourceDefinitions={rdConfig.resourceDefinitions!}
            isOpen={rdConfig.rdOpen}
            handleClose={() => setRdConfig({ rdOpen: false })}
            permission={rdConfig.rdPermission!}
          />
        )}
      </Suspense>
    </Fragment>
  );
};
