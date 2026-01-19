import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import ServiceIcon from '@patternfly/react-icons/dist/js/icons/service-icon';
import { useIntl } from 'react-intl';
import React, { useMemo } from 'react';
import messages from '../../../../../Messages';
import { type ServiceAccount, useGroupServiceAccountsQuery } from '../../../../../data/queries/groups';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface GroupDetailsServiceAccountsViewProps {
  groupId: string;
  ouiaId: string;
}

interface ServiceAccountData {
  uuid: string;
  name: string;
  clientId?: string;
  owner?: string;
}

const columns = ['name', 'clientId', 'owner'] as const;

const GroupDetailsServiceAccountsView: React.FunctionComponent<GroupDetailsServiceAccountsViewProps> = ({ groupId, ouiaId }) => {
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name) },
      clientId: { label: intl.formatMessage(messages.clientId) },
      owner: { label: intl.formatMessage(messages.owner) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, ServiceAccountData> = useMemo(
    () => ({
      name: (account) => account.name,
      clientId: (account) => account.clientId || '',
      owner: (account) => account.owner || '',
    }),
    [],
  );

  // Use useTableState for table state management
  const tableState = useTableState<typeof columns, ServiceAccountData>({
    columns,
    getRowId: (account) => account.uuid,
    initialPerPage: 100, // Show all items in detail views
    syncWithUrl: false, // Drawer tables shouldn't sync with URL
  });

  // Use React Query for data fetching
  // Pass apiParams from tableState for pagination
  const { data, isLoading, error } = useGroupServiceAccountsQuery(groupId, {
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
  });

  // Extract service accounts from typed response
  const serviceAccounts: ServiceAccount[] = data?.data ?? [];

  // Show error state
  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load service accounts" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const emptyState = (
    <EmptyState headingLevel="h4" icon={ServiceIcon} titleText="No service accounts found" variant="sm">
      <EmptyStateBody>This group currently has no service accounts assigned to it.</EmptyStateBody>
    </EmptyState>
  );

  const serviceAccountData: ServiceAccountData[] = serviceAccounts.map((account) => ({
    uuid: account.uuid || account.clientId,
    name: account.name || account.clientId,
    clientId: account.clientId,
    owner: account.owner,
  }));

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof columns, ServiceAccountData>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : serviceAccountData}
        totalCount={serviceAccountData.length}
        getRowId={(account) => account.uuid}
        cellRenderers={cellRenderers}
        ariaLabel="GroupServiceAccountsView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
        {...tableState}
      />
    </div>
  );
};

// Component uses named export only
export { GroupDetailsServiceAccountsView };
