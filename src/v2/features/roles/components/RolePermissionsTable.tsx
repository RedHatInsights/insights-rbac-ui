import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../../Messages';
// eslint-disable-next-line rbac-local/require-use-table-state -- display-only table from props, no server state
import { TableView } from '../../../../shared/components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../shared/components/table-view/types';

export interface PermissionRow {
  permission: string;
  application: string;
  resource: string;
  operation: string;
}

interface RolePermissionsTableProps {
  permissions: PermissionRow[] | undefined;
}

const columns = ['application', 'resource', 'operation'] as const;

export const RolePermissionsTable: React.FunctionComponent<RolePermissionsTableProps> = ({ permissions }) => {
  const intl = useIntl();

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
      data={permissions}
      totalCount={permissions?.length ?? 0}
      getRowId={(row) => row.permission}
      cellRenderers={cellRenderers}
      page={1}
      perPage={permissions?.length || 10}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      ariaLabel="Role permissions table"
      ouiaId="role-permissions-table"
    />
  );
};

export default RolePermissionsTable;
