import React, { useMemo } from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { type Role, useRolesQuery } from '../../../../../data/queries/roles';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface UserRolesViewProps {
  userId: string;
  ouiaId: string;
}

interface RoleData {
  uuid: string;
  name: string;
  userGroup?: string;
  workspace?: string;
}

const columns = ['name', 'userGroup', 'workspace'] as const;

/**
 * UserDetailsRolesView - Shows assigned roles for a user
 *
 * Displays roles with their user group and workspace assignments.
 * This data comes from V2-style role bindings API (gap:guessed-v2-api).
 */
const UserDetailsRolesView: React.FunctionComponent<UserRolesViewProps> = ({ userId, ouiaId }) => {
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: 'Roles' },
      userGroup: { label: 'User Group' },
      workspace: { label: 'Workspace' },
    }),
    [],
  );

  const cellRenderers: CellRendererMap<typeof columns, RoleData> = useMemo(
    () => ({
      name: (role) => role.name,
      userGroup: (role) => role.userGroup || '—',
      workspace: (role) => role.workspace || '—',
    }),
    [],
  );

  // Use useTableState for table state management
  const tableState = useTableState<typeof columns, RoleData>({
    columns,
    getRowId: (role) => role.uuid,
    initialPerPage: 100, // Show all items in detail views
    syncWithUrl: false, // Drawer tables shouldn't sync with URL
  });

  // Use React Query for data fetching
  // Note: The V1 roles API supports filtering by username
  const { data, isLoading, error } = useRolesQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    // username filter to get roles for this user
    username: userId,
    system: false,
  });

  // Extract roles from typed response
  const roles: Role[] = data?.data ?? [];

  // Show error state
  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load roles" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const emptyState = (
    <EmptyState headingLevel="h4" icon={KeyIcon} titleText="No roles found" variant="sm">
      <EmptyStateBody>This user has no roles assigned.</EmptyStateBody>
    </EmptyState>
  );

  const roleData: RoleData[] = roles.map((role) => ({
    uuid: role.uuid,
    name: role.name ?? role.display_name ?? 'Unknown',
    userGroup: role.userGroup,
    workspace: role.workspace,
  }));

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof columns, RoleData>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : roleData}
        totalCount={roleData.length}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        ariaLabel="UserRolesView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
        {...tableState}
      />
    </div>
  );
};

// Component uses named export only
export { UserDetailsRolesView };
