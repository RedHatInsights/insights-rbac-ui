import React from 'react';
import { Role, RoleGroup } from '../../redux/reducers/role-reducer';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';

interface AssignedUserGroupsTableProps {
  viewedRole?: Role;
}

export const AssignedUserGroupsTable: React.FunctionComponent<AssignedUserGroupsTableProps> = ({ viewedRole }) => {
  const COLUMNS: string[] = ['User group', 'Workspace assignment (TBD)'];

  const rows = viewedRole?.groups_in ? viewedRole.groups_in.map((group: RoleGroup) => [group.name, 'TBD']) : [];

  return (
    <React.Fragment>
      <DataView ouiaId="assigned-usergroups-table">
        <DataViewTable columns={COLUMNS} rows={rows} />
      </DataView>
    </React.Fragment>
  );
};

export default AssignedUserGroupsTable;
