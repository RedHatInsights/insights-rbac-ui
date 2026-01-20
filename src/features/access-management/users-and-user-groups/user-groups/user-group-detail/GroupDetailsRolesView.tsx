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
 * Displays roles with their workspace assignments.
 * Workspace data comes from V2-style role bindings API (gap:guessed-v2-api).
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

  // Use React Query - returns unwrapped, typed data
  const { data, isLoading, error } = useGroupRolesQuery(groupId, {
    limit: tableState.apiParams.limit,
  });
  const roles = data?.roles ?? [];

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

  const roleData: RoleData[] = roles.map((role) => ({
    uuid: role.uuid,
    display_name: role.display_name ?? role.name,
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
