import React, { useMemo } from 'react';
import { Access, Role } from '../../redux/reducers/role-reducer';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';

interface RolePermissionsTableProps {
  viewedRole?: Role;
}

const transformRow = (access: Access) => {
  const [application, resource, operation] = access.permission.split(':');
  return [application, resource, operation];
};

export const RolePermissionsTable: React.FunctionComponent<RolePermissionsTableProps> = ({ viewedRole }) => {
  const COLUMNS: string[] = ['Application', 'Resource type', 'Operation'];

  const rows = useMemo(() => (viewedRole?.access ?? []).map((access: Access) => transformRow(access)), [viewedRole?.access]);

  return (
    <DataView ouiaId="role-permissions-table">
      <DataViewTable columns={COLUMNS} rows={rows} />
    </DataView>
  );
};

export default RolePermissionsTable;
