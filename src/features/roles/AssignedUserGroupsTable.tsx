import React, { useMemo } from 'react';
import { Role, RoleGroup } from '../../redux/roles/reducer';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { TableView } from '../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../components/table-view/types';

interface AssignedUserGroupsTableProps {
  viewedRole?: Role;
}

interface GroupRow {
  uuid: string;
  name: string;
  workspaceAssignment: string;
}

// Column definition
const columns = ['userGroup', 'workspaceAssignment'] as const;

export const AssignedUserGroupsTable: React.FunctionComponent<AssignedUserGroupsTableProps> = ({ viewedRole }) => {
  const intl = useIntl();

  // Transform groups to rows
  const rows: GroupRow[] = useMemo(
    () =>
      (viewedRole?.groups_in ?? []).map((group: RoleGroup) => ({
        uuid: group.uuid,
        name: group.name,
        workspaceAssignment: 'TBD',
      })),
    [viewedRole?.groups_in],
  );

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
      data={rows}
      totalCount={rows.length}
      getRowId={(row) => row.uuid}
      cellRenderers={cellRenderers}
      page={1}
      perPage={rows.length || 10}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      ariaLabel="Assigned user groups table"
      ouiaId="assigned-usergroups-table"
    />
  );
};

export default AssignedUserGroupsTable;
