import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { useIntl } from 'react-intl';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { fetchServiceAccountsForGroup } from '../../../../../redux/actions/group-actions';

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

  const fetchData = useCallback(() => {
    dispatch(fetchServiceAccountsForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

export default GroupDetailsServiceAccountsView;
