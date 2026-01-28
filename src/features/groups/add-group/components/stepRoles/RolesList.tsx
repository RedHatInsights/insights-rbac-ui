import React, { Fragment, useEffect, useMemo } from 'react';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../components/table-view/types';
import { defaultSettings } from '../../../../../helpers/pagination';
import { useAvailableRolesListQuery } from '../../../../../data/queries/groups';
import { useRolesQuery } from '../../../../../data/queries/roles';
import { RolesListEmptyState } from './RolesListEmptyState';

// Types
interface Role {
  uuid: string;
  display_name?: string;
  name: string;
  description?: string;
}

interface RolesListProps {
  initialSelectedRoles: Role[];
  onSelect: (selectedRoles: Role[]) => void;
  rolesExcluded?: boolean;
  groupId?: string;
}

// Column definitions
const columns = ['name', 'description'] as const;

export const RolesList: React.FC<RolesListProps> = ({ initialSelectedRoles, onSelect, rolesExcluded = false, groupId }) => {
  const chrome = useChrome();

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: 'Name' },
      description: { label: 'Description' },
    }),
    [],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(() => [{ id: 'name', label: 'Role name', type: 'text', placeholder: 'Filter by role name' }], []);

  // useTableState for all state management
  const tableState = useTableState<typeof columns, Role>({
    columns,
    initialPerPage: defaultSettings.limit || 20,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (role) => role.uuid,
    initialSelectedRows: initialSelectedRoles,
  });

  const nameFilter = (tableState.filters.name as string) || undefined;

  // Fetch roles via React Query - use different queries based on rolesExcluded flag
  const { data: availableRolesData, isLoading: isAvailableLoading } = useAvailableRolesListQuery(
    groupId ?? '',
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      name: nameFilter,
    },
    { enabled: rolesExcluded && !!groupId },
  );

  const { data: allRolesData, isLoading: isAllRolesLoading } = useRolesQuery(
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      name: nameFilter, // Use 'name' param which searches both name and display_name
    },
    { enabled: !rolesExcluded || !groupId },
  );

  // Select correct data source based on rolesExcluded flag
  const roles: Role[] = useMemo(() => {
    if (rolesExcluded && groupId) {
      return (availableRolesData?.roles ?? []) as Role[];
    }
    return (
      allRolesData?.data?.map((r) => ({
        uuid: r.uuid,
        name: r.name,
        display_name: r.display_name,
        description: r.description,
      })) ?? []
    );
  }, [rolesExcluded, groupId, availableRolesData, allRolesData]);

  const isLoading = rolesExcluded && groupId ? isAvailableLoading : isAllRolesLoading;
  const totalCount = rolesExcluded && groupId ? (availableRolesData?.totalCount ?? 0) : (allRolesData?.meta?.count ?? 0);

  // Propagate selection changes to parent
  useEffect(() => {
    onSelect(tableState.selectedRows);
  }, [tableState.selectedRows, onSelect]);

  // Chrome global filter setup
  useEffect(() => {
    chrome?.hideGlobalFilter?.(true);
    return () => chrome?.hideGlobalFilter?.(false);
  }, [chrome]);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => role.display_name || role.name,
      description: (role) => role.description || '—',
    }),
    [],
  );

  return (
    <Fragment>
      <TableView<typeof columns, Role>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : roles}
        totalCount={totalCount}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        selectable
        emptyStateNoData={<RolesListEmptyState hasActiveFilters={false} />}
        emptyStateNoResults={<RolesListEmptyState hasActiveFilters={true} />}
        variant="compact"
        ariaLabel="Roles list table"
        ouiaId="roles-list-table"
        {...tableState}
      />
    </Fragment>
  );
};
