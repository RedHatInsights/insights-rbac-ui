import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../../Messages';
// eslint-disable-next-line rbac-local/require-use-table-state -- display-only table from props, no server state
import { TableView } from '../../../../shared/components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../shared/components/table-view/types';

export interface GroupRow {
  uuid: string;
  name: string;
  workspaceAssignment: string;
}

interface AssignedUserGroupsTableProps {
  groups: GroupRow[] | undefined;
}

// Column definition
const columns = ['userGroup', 'workspaceAssignment'] as const;

export const AssignedUserGroupsTable: React.FunctionComponent<AssignedUserGroupsTableProps> = ({ groups }) => {
  const intl = useIntl();

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      userGroup: { label: intl.formatMessage(Messages.userGroup) },
      workspaceAssignment: { label: intl.formatMessage(Messages.workspaceAssignment) },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, GroupRow> = useMemo(
    () => ({
      userGroup: (row) => row.name,
      workspaceAssignment: (row) => row.workspaceAssignment,
    }),
    [],
  );

  return (
    <TableView<typeof columns, GroupRow>
      columns={columns}
      columnConfig={columnConfig}
      data={groups}
      totalCount={groups?.length ?? 0}
      getRowId={(row) => row.uuid}
      cellRenderers={cellRenderers}
      page={1}
      perPage={groups?.length || 10}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      ariaLabel="Assigned user groups table"
      ouiaId="assigned-usergroups-table"
    />
  );
};

export default AssignedUserGroupsTable;
