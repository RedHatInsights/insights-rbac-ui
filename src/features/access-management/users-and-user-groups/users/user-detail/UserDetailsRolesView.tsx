import React, { useMemo } from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { useRolesQuery } from '../../../../../data/queries/roles';
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
 * NOTE: The V2 role bindings API requires resourceId/resourceType as required params,
 * making it unsuitable for fetching all role bindings for a user across all resources.
 * Currently using V1 API with "?" placeholders for userGroup and workspace columns.
 *
 * TODO: When a proper V2 API endpoint is available that supports querying by user
 * across all resources, update this component to display actual userGroup and workspace data.
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
      // TODO: V2 API needed to populate these columns - currently shows "?" as placeholder
      userGroup: () => '?',
      workspace: () => '?',
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

  // Use React Query instead of Redux
  // Note: The V1 roles API supports filtering by username
  const { data, isLoading, error } = useRolesQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    // username filter to get roles for this user
    username: userId,
    system: false,
  });

  // Extract roles from response
  const roles = (data as any)?.data || [];

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

  const roleData: RoleData[] = roles.map((role: any) => ({
    uuid: role.uuid,
    name: role.name || role.display_name,
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
