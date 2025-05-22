import { DataView, DataViewTable } from '@patternfly/react-data-view';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import React, { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { mappedProps } from '../../../../../helpers/shared/helpers';
import messages from '../../../../../Messages';
import { fetchGroups } from '../../../../../redux/actions/group-actions';

interface UserGroupsViewProps {
  userId: string;
  ouiaId: string;
}

const UserDetailsGroupsView: React.FunctionComponent<UserGroupsViewProps> = ({ userId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const columns: string[] = [intl.formatMessage(messages.userGroup), intl.formatMessage(messages.users)];
  const chrome = useChrome();

  const groups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);

  const fetchData = useCallback(() => {
    dispatch(fetchGroups({ ...mappedProps({ username: userId }), usesMetaInURL: true, system: false, chrome }));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = groups.map((group: any) => ({
    row: [group.name, group.principalCount || '?'], // TODO: update once API provides principalCount [RHCLOUD-35963]
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <DataView ouiaId={ouiaId}>
        <DataViewTable variant="compact" aria-label="UserGroupsView" ouiaId={`${ouiaId}-table`} columns={columns} rows={rows} />
      </DataView>
    </div>
  );
};

export default UserDetailsGroupsView;
