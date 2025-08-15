import { DataView, DataViewTable } from '@patternfly/react-data-view';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchMembersForGroup } from '../../../../../redux/actions/group-actions';

interface GroupDetailsUsersViewProps {
  groupId: string;
  ouiaId: string;
}

const GroupDetailsUsersView: React.FunctionComponent<GroupDetailsUsersViewProps> = ({ groupId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const GROUP_USERS_COLUMNS: string[] = [
    intl.formatMessage(messages.username),
    intl.formatMessage(messages.firstName),
    intl.formatMessage(messages.lastName),
  ];

  const serviceAccounts = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.members?.data || []);

  const fetchData = useCallback(() => {
    dispatch(fetchMembersForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = serviceAccounts.map((user: any) => ({
    row: [user.username, user.first_name, user.last_name], // TODO: Last name is not showing (fix this)
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <DataView ouiaId={ouiaId}>
        <DataViewTable variant="compact" aria-label="GroupDetailsUsersView" ouiaId={`${ouiaId}-table`} columns={GROUP_USERS_COLUMNS} rows={rows} />
      </DataView>
    </div>
  );
};

export default GroupDetailsUsersView;
