import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import ServiceIcon from '@patternfly/react-icons/dist/js/icons/service-icon';
import { useIntl } from 'react-intl';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';

interface GroupDetailsServiceAccountsViewProps {
  groupId: string;
  ouiaId: string;
}

const GroupDetailsServiceAccountsView: React.FunctionComponent<GroupDetailsServiceAccountsViewProps> = ({ groupId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const GROUP_SERVICE_ACCOUNTS_COLUMNS: string[] = [
    intl.formatMessage(messages.name),
    intl.formatMessage(messages.clientId),
    intl.formatMessage(messages.owner),
  ];

  const serviceAccounts = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.serviceAccounts?.data || []);
  const isLoading = useSelector((state: RBACStore) => (state.groupReducer?.selectedGroup?.serviceAccounts as any)?.isLoading || false);
  const error = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.serviceAccounts as any)?.error,
  );

  const fetchData = useCallback(() => {
    dispatch(fetchServiceAccountsForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
        <Spinner size="lg" aria-label="Loading service accounts" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="Unable to load service accounts" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  // Show empty state when no service accounts
  if (serviceAccounts.length === 0) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="No service accounts found" icon={<EmptyStateIcon icon={ServiceIcon} />} headingLevel="h4" />
          <EmptyStateBody>This group currently has no service accounts assigned to it.</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const rows = serviceAccounts.map((serviceAccount: any) => ({
    row: [serviceAccount.name, serviceAccount.clientId, serviceAccount.owner],
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <DataView ouiaId={ouiaId}>
        <DataViewTable
          variant="compact"
          aria-label="GroupServiceAccountsView"
          ouiaId={`${ouiaId}-table`}
          columns={GROUP_SERVICE_ACCOUNTS_COLUMNS}
          rows={rows}
        />
      </DataView>
    </div>
  );
};

// Component uses named export only
export { GroupDetailsServiceAccountsView };
