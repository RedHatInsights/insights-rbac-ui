import React, { Fragment, Suspense, useCallback, useMemo, useState } from 'react';
import { defaultSettings } from '../../helpers/pagination';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

import { TableView } from '../../components/table-view/TableView';
import { useTableState } from '../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../components/table-view/types';
import { ResourceDefinitionsModal } from './components/ResourceDefinitionsModal';
import { ResourceDefinitionsLink } from './components/ResourceDefinitionsLink';
import { usePrincipalAccessQuery } from '../../data/queries/access';

import type { ResourceDefinition, ResourceDefinitionsConfig } from './types';

// Local interface for permission items from API
interface PermissionAccess {
  permission: string;
  resourceDefinitions: ResourceDefinition[];
}

// Component props (minimal, as per usage in MyUserAccess.tsx)
interface AccessTableProps {
  apps: string[];
  showResourceDefinitions?: boolean;
}

// Column definitions
const baseColumns = ['application', 'resourceType', 'operation'] as const;
const columnsWithRd = ['application', 'resourceType', 'operation', 'resourceDefinitions'] as const;

type SortableColumn = 'application' | 'resourceType' | 'operation';

// Map UI sort column to API orderBy field
const sortColumnToApiField: Record<SortableColumn, string> = {
  application: 'application',
  resourceType: 'resource_type',
  operation: 'verb',
};

export const AccessTable: React.FC<AccessTableProps> = ({ apps, showResourceDefinitions }) => {
  const intl = useIntl();
  const [{ rdOpen, rdPermission, resourceDefinitions }, setRdConfig] = useState<ResourceDefinitionsConfig>({ rdOpen: false });

  // Query params state for React Query
  const [queryParams, setQueryParams] = useState({
    limit: defaultSettings.limit,
    offset: 0,
    application: apps.join(','),
    orderBy: 'application',
  });

  // React Query for principal access
  const { data: permissions, isLoading } = usePrincipalAccessQuery(queryParams);

  // Choose columns based on showResourceDefinitions prop
  const columns = showResourceDefinitions ? columnsWithRd : baseColumns;

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () =>
      ({
        application: { label: intl.formatMessage(messages.application), sortable: true },
        resourceType: { label: intl.formatMessage(messages.resourceType), sortable: true },
        operation: { label: intl.formatMessage(messages.operation), sortable: true },
        ...(showResourceDefinitions ? { resourceDefinitions: { label: intl.formatMessage(messages.resourceDefinitions) } } : {}),
      }) as ColumnConfigMap<typeof columns>,
    [intl, showResourceDefinitions],
  );

  const sortableColumns: readonly SortableColumn[] = ['application', 'resourceType', 'operation'];

  const filteredRows: PermissionAccess[] = (permissions?.data ?? []) as PermissionAccess[];

  // useTableState handles ALL state + triggers onStaleData when params change
  const tableState = useTableState<typeof columns, PermissionAccess, SortableColumn>({
    columns,
    sortableColumns,
    initialSort: { column: 'application', direction: 'asc' },
    initialPerPage: defaultSettings.limit,
    initialFilters: { application: [] },
    getRowId: (row) => row.permission,
    staleDataDebounceMs: 300,
    onStaleData: (params) => {
      const orderBy = params.orderBy
        ? `${params.orderBy.startsWith('-') ? '-' : ''}${sortColumnToApiField[params.orderBy.replace('-', '') as SortableColumn] || params.orderBy.replace('-', '')}`
        : 'application';
      const applicationFilter = (params.filters.application as string[]) || [];
      const applicationParam = applicationFilter.length > 0 ? applicationFilter.join(',') : apps.join(',');

      setQueryParams({
        limit: params.limit,
        offset: params.offset,
        application: applicationParam,
        orderBy,
      });
    },
  });

  const handleRdClick = useCallback(
    (index: number) => {
      const access = permissions?.data?.[index];
      if (access) {
        setRdConfig({
          rdOpen: true,
          rdPermission: access.permission,
          resourceDefinitions: access.resourceDefinitions,
        });
      }
    },
    [permissions],
  );

  // Filter config for checkbox filter
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'checkbox',
        id: 'application',
        label: intl.formatMessage(messages.application),
        options: apps.map((app: string) => ({ id: app, label: app })),
      },
    ],
    [intl, apps],
  );

  // Cell renderers
  const cellRenderers = useMemo(
    () =>
      ({
        application: (row: PermissionAccess) => row.permission.split(':')[0],
        resourceType: (row: PermissionAccess) => row.permission.split(':')[1],
        operation: (row: PermissionAccess) => row.permission.split(':')[2],
        ...(showResourceDefinitions
          ? {
              resourceDefinitions: (row: PermissionAccess) => {
                const rowIndex = filteredRows.findIndex((r) => r.permission === row.permission);
                return <ResourceDefinitionsLink onClick={() => handleRdClick(rowIndex)} access={row} />;
              },
            }
          : {}),
      }) as CellRendererMap<typeof columns, PermissionAccess>,
    [showResourceDefinitions, filteredRows, handleRdClick],
  );

  return (
    <Fragment>
      <TableView<typeof columns, PermissionAccess, SortableColumn>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        data={isLoading ? undefined : filteredRows}
        totalCount={permissions?.meta?.count || filteredRows.length}
        getRowId={(row) => row.permission}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        ariaLabel={intl.formatMessage(messages.permissions)}
        ouiaId="access-table"
        emptyStateNoData={<DefaultEmptyStateNoData title="Configure permissions" body="To configure user access, create at least one permission." />}
        emptyStateNoResults={<DefaultEmptyStateNoResults title="No permissions found" onClearFilters={tableState.clearAllFilters} />}
        {...tableState}
      />
      <Suspense fallback={<Fragment />}>
        {rdOpen && (
          <ResourceDefinitionsModal
            resourceDefinitions={resourceDefinitions!}
            isOpen={rdOpen}
            handleClose={() => setRdConfig({ rdOpen: false })}
            permission={rdPermission!}
          />
        )}
      </Suspense>
    </Fragment>
  );
};

export default AccessTable;
