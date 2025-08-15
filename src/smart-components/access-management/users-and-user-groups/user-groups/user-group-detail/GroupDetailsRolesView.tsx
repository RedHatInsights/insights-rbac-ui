import { DataView, DataViewTable } from '@patternfly/react-data-view';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchRolesForGroup } from '../../../../../redux/actions/group-actions';

interface GroupRolesViewProps {
  groupId: string;
  ouiaId: string;
}

const GroupDetailsRolesView: React.FunctionComponent<GroupRolesViewProps> = ({ groupId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const GROUP_ROLES_COLUMNS: string[] = [intl.formatMessage(messages.roles), intl.formatMessage(messages.workspace)];

  const roles = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.data || []);

  const fetchData = useCallback(() => {
    dispatch(fetchRolesForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = roles.map((role: any) => ({
    row: [role.display_name, '?'], // TODO: Update once API provides workspace data
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <DataView ouiaId={ouiaId}>
        <DataViewTable variant="compact" aria-label="GroupRolesView" ouiaId={`${ouiaId}-table`} columns={GROUP_ROLES_COLUMNS} rows={rows} />
      </DataView>
    </div>
  );
};

export default GroupDetailsRolesView;
