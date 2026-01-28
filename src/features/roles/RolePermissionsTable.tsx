import React, { useMemo } from 'react';
import type { Access, RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { TableView } from '../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../components/table-view/types';

interface RolePermissionsTableProps {
  viewedRole?: RoleOutDynamic;
}

interface PermissionRow {
  permission: string;
  application: string;
  resource: string;
  operation: string;
}

// Column definition
const columns = ['application', 'resource', 'operation'] as const;

export const RolePermissionsTable: React.FunctionComponent<RolePermissionsTableProps> = ({ viewedRole }) => {
  const intl = useIntl();

  // Transform access to permission rows
  const rows: PermissionRow[] = useMemo(
    () =>
      (viewedRole?.access ?? []).map((access: Access) => {
        const [application, resource, operation] = access.permission.split(':');
        return {
          permission: access.permission,
          application,
          resource,
          operation,
        };
      }),
    [viewedRole?.access],
  );

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      application: { label: intl.formatMessage(Messages.application) },
      resource: { label: intl.formatMessage(Messages.resourceType) },
      operation: { label: intl.formatMessage(Messages.operation) },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, PermissionRow> = useMemo(
    () => ({
      application: (row) => row.application,
      resource: (row) => row.resource,
      operation: (row) => row.operation,
    }),
    [],
  );

  return (
    <TableView<typeof columns, PermissionRow>
      columns={columns}
      columnConfig={columnConfig}
      data={rows}
      totalCount={rows.length}
      getRowId={(row) => row.permission}
      cellRenderers={cellRenderers}
      page={1}
      perPage={rows.length || 10}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      ariaLabel="Role permissions table"
      ouiaId="role-permissions-table"
    />
  );
};

export default RolePermissionsTable;
