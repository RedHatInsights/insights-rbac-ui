/**
 * RolesTable Component
 *
 * Displays roles with compound expandable permissions using TableView.
 */

import React, { Fragment, Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { TableVariant } from '@patternfly/react-table';
import { SkeletonTableBody } from '@patternfly/react-component-groups';

import { TableView, useTableState } from '../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../components/table-view/types';
import { useRoleForPrincipalQuery, useRolesQuery } from '../../data/queries/roles';
import type { ResourceDefinition, RoleOutDynamic, RoleWithAccess } from '../../data/api/roles';
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

// Column definitions
const columns = ['display_name', 'description', 'permissions'] as const;
type SortableColumnId = 'display_name';
type CompoundColumnId = 'permissions';

export const RolesTable: React.FC<RolesTableProps> = ({ apps, showResourceDefinitions = false }) => {
  const intl = useIntl();

  // Query params state for React Query
  const [queryParams, setQueryParams] = useState({
    limit: 20,
    offset: 0,
    orderBy: 'display_name' as const,
    scope: 'principal' as const,
    application: apps.join(','),
    name: undefined as string | undefined,
  });

  // Track which roles have been expanded to fetch their access data
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  // React Query for roles list
  const { data: rolesResponse, isLoading } = useRolesQuery(queryParams);
  const totalCount = rolesResponse?.meta?.count ?? 0;
  const rolesData = rolesResponse?.data ?? [];

  // React Query for expanded role access
  const { data: expandedRoleAccess, isLoading: isLoadingAccess } = useRoleForPrincipalQuery(expandedRoleId ?? '', {
    enabled: !!expandedRoleId,
  });

  // Build a map of fetched role access data
  const rolesWithAccess = useMemo<Record<string, RoleWithAccess>>(() => {
    if (expandedRoleId && expandedRoleAccess) {
      return { [expandedRoleId]: expandedRoleAccess };
    }
    return {};
  }, [expandedRoleId, expandedRoleAccess]);

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

      setQueryParams({
        limit: params.limit,
        offset: params.offset,
        orderBy: (params.orderBy as 'display_name') || 'display_name',
        scope: 'principal',
        application: applicationParam,
        name: roleFilter && roleFilter.trim() ? roleFilter : undefined,
      });
    },
    [apps],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, RoleOutDynamic, SortableColumnId, CompoundColumnId>({
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
  const handleExpand = useCallback((role: RoleOutDynamic, columnId: CompoundColumnId) => {
    if (columnId === 'permissions') {
      setExpandedRoleId(role.uuid);
    }
  }, []);

  // Handle resource definitions click
  const handleRdClick = useCallback((permission: string, resourceDefinitions: ResourceDefinition[]) => {
    setRdConfig({
      rdOpen: true,
      rdPermission: permission,
      resourceDefinitions,
    });
  }, []);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, RoleOutDynamic> = useMemo(
    () => ({
      display_name: (role) => role.display_name ?? role.name,
      description: (role) => role.description ?? '—',
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
  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, RoleOutDynamic> = useMemo(
    () => ({
      permissions: (role) => {
        const rolePermissions = rolesWithAccess[role.uuid];
        const isLoadingThisRole = expandedRoleId === role.uuid && isLoadingAccess;

        // Show loading skeleton while permissions are being fetched
        if (!rolePermissions || isLoadingThisRole) {
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
              {rolePermissions.access.map((access, index) => (
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
    [rolesWithAccess, permissionColumns, showResourceDefinitions, handleRdClick, expandedRoleId, isLoadingAccess],
  );

  return (
    <Fragment>
      <TableView<typeof columns, RoleOutDynamic, SortableColumnId, CompoundColumnId>
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
