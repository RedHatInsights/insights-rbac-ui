import React, { useMemo } from 'react';
import { Role, RoleGroup } from '../../redux/roles/reducer';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';

interface AssignedUserGroupsTableProps {
  viewedRole?: Role;
}

export const AssignedUserGroupsTable: React.FunctionComponent<AssignedUserGroupsTableProps> = ({ viewedRole }) => {
  const intl = useIntl();

  const COLUMNS: string[] = [intl.formatMessage(Messages.userGroup), intl.formatMessage(Messages.workspaceAssignment)];

  const rows = useMemo(() => (viewedRole?.groups_in ?? []).map((group: RoleGroup) => [group.name, 'TBD']), [viewedRole?.groups_in]);
  return (
    <DataView ouiaId="assigned-usergroups-table">
      <DataViewTable columns={COLUMNS} rows={rows} />
    </DataView>
  );
};

export default AssignedUserGroupsTable;
