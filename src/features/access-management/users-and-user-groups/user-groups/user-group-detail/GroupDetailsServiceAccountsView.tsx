import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import ServiceIcon from '@patternfly/react-icons/dist/js/icons/service-icon';
import { useIntl } from 'react-intl';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import messages from '../../../../../Messages';
import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import {
  selectGroupServiceAccounts,
  selectGroupServiceAccountsError,
  selectIsGroupServiceAccountsLoading,
} from '../../../../../redux/groups/selectors';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView } from '../../../../../components/table-view/TableView';
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
  const dispatch = useDispatch();
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = {
    name: { label: intl.formatMessage(messages.name) },
    clientId: { label: intl.formatMessage(messages.clientId) },
    owner: { label: intl.formatMessage(messages.owner) },
  };

  const cellRenderers: CellRendererMap<typeof columns, ServiceAccountData> = {
    name: (account) => account.name,
    clientId: (account) => account.clientId || '',
    owner: (account) => account.owner || '',
  };

  const serviceAccounts = useSelector(selectGroupServiceAccounts);
  const isLoading = useSelector(selectIsGroupServiceAccountsLoading);
  const error = useSelector(selectGroupServiceAccountsError);

  const fetchData = useCallback(() => {
    dispatch(fetchServiceAccountsForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const serviceAccountData: ServiceAccountData[] = serviceAccounts.map((account: any) => ({
    uuid: account.uuid,
    name: account.name,
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
        page={1}
        perPage={serviceAccountData.length || 10}
        onPageChange={() => {}}
        onPerPageChange={() => {}}
        ariaLabel="GroupServiceAccountsView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

// Component uses named export only
export { GroupDetailsServiceAccountsView };
