import React from 'react';
import { Access, Role } from '../../redux/reducers/role-reducer';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';

interface RolePermissionsTableProps {
  viewedRole?: Role;
}

export const RolePermissionsTable: React.FunctionComponent<RolePermissionsTableProps> = ({ viewedRole }) => {
  const COLUMNS: string[] = ['Application', 'Resource type', 'Operation'];

  const transformRow = (access: Access) => {
    const [application, resource, operation] = access.permission.split(':');
    console.log(application, resource, operation);
    return [application, resource, operation];
  };

  const rows = viewedRole?.access ? viewedRole.access.map((access: Access) => transformRow(access)) : [];

  return (
    <React.Fragment>
      <DataView>
        <DataViewTable columns={COLUMNS} rows={rows} />
      </DataView>
    </React.Fragment>
  );
};

export default RolePermissionsTable;
