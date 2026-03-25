import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import React, { useMemo } from 'react';
import messages from '../../../../../../Messages';
import { useIntl } from 'react-intl';
import { type GroupRoleRow, useGroupRoleBindingsQuery } from '../../../../../../v2/data/queries/groupRoleBindings';
import { extractErrorMessage } from '../../../../../../shared/utilities/errorUtils';
import { TableView, useTableState } from '../../../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../../shared/components/table-view/types';

interface GroupRolesViewProps {
  groupId: string;
  ouiaId: string;
}

const columns = ['name', 'workspace'] as const;

const GroupDetailsRolesView: React.FunctionComponent<GroupRolesViewProps> = ({ groupId, ouiaId }) => {
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.roles) },
      workspace: { label: intl.formatMessage(messages.workspace) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, GroupRoleRow> = useMemo(
    () => ({
      name: (role) => role.display_name,
      workspace: (role) => role.workspace || '—',
    }),
    [],
  );

  const tableState = useTableState<typeof columns, GroupRoleRow>({
    columns,
    getRowId: (role) => role.uuid,
    initialPerPage: 100,
    syncWithUrl: false,
  });

  const { data: roleData, isLoading, error } = useGroupRoleBindingsQuery(groupId);

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

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof columns, GroupRoleRow>
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
