import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import React, { useMemo } from 'react';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { useGroupRolesQuery } from '../../../../../data/queries/groups';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface GroupRolesViewProps {
  groupId: string;
  ouiaId: string;
}

interface RoleData {
  uuid: string;
  display_name: string;
  workspace?: string;
}

const columns = ['name', 'workspace'] as const;

/**
 * GroupDetailsRolesView - Shows assigned roles for a user group
 *
 * NOTE: The V2 role bindings API requires resourceId/resourceType as required params,
 * making it unsuitable for fetching all role bindings for a group across all resources.
 * Currently using V1 API with "?" placeholders for workspace column.
 *
 * TODO: When a proper V2 API endpoint is available that supports querying by group
 * across all resources, update this component to display actual workspace data.
 */
const GroupDetailsRolesView: React.FunctionComponent<GroupRolesViewProps> = ({ groupId, ouiaId }) => {
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.roles) },
      workspace: { label: intl.formatMessage(messages.workspace) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, RoleData> = useMemo(
    () => ({
      name: (role) => role.display_name,
      // TODO: V2 API needed to populate workspace column - currently shows "?" as placeholder
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
  const { data, isLoading, error } = useGroupRolesQuery(groupId, {
    limit: tableState.apiParams.limit,
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
      <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
    </EmptyState>
  );

  const roleData: RoleData[] = roles.map((role: any) => ({
    uuid: role.uuid,
    display_name: role.display_name,
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
        ariaLabel="GroupRolesView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
        {...tableState}
      />
    </div>
  );
};

// Component uses named export only
export { GroupDetailsRolesView };
