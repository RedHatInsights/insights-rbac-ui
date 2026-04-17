import React, { useMemo } from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { type RoleBinding, useUserRoleBindingsQuery } from '../../../../../../v2/data/queries/roleBindings';
import { extractErrorMessage } from '../../../../../../shared/utilities/errorUtils';
import { TableView, useTableState } from '../../../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../../shared/components/table-view/types';

interface UserRolesViewProps {
  userId?: string;
  ouiaId: string;
}

const columns = ['name', 'userGroup', 'workspace'] as const;

const UserDetailsRolesView: React.FunctionComponent<UserRolesViewProps> = ({ userId, ouiaId }) => {
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: 'Roles' },
      userGroup: { label: 'User Group' },
      workspace: { label: 'Workspace' },
    }),
    [],
  );

  const cellRenderers: CellRendererMap<typeof columns, RoleBinding> = useMemo(
    () => ({
      name: (binding) => binding.role.name,
      userGroup: (binding) => binding.subject.groupName || '—',
      workspace: (binding) => binding.resource.name,
    }),
    [],
  );

  const tableState = useTableState<typeof columns, RoleBinding>({
    columns,
    getRowId: (binding) => `${binding.role.id}-${binding.subject.id}-${binding.resource.id}`,
    initialPerPage: 100,
    syncWithUrl: false,
  });

  // Permission gating is handled by the parent UserDetailsDrawer — this tab
  // is only rendered when the user has rbac_roles_read permission.
  const { data: bindings = [], isLoading, error } = useUserRoleBindingsQuery(userId);

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

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof columns, RoleBinding>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : bindings}
        totalCount={bindings.length}
        getRowId={(binding) => `${binding.role.id}-${binding.subject.id}-${binding.resource.id}`}
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

export { UserDetailsRolesView };
