import React, { useCallback, useEffect } from 'react';
import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { fetchRoles } from '../../../../../redux/actions/role-actions';
import { mappedProps } from '../../../../../helpers/shared/helpers';

interface UserRolesViewProps {
  userId: string;
  ouiaId: string;
}

const UserDetailsRolesView: React.FunctionComponent<UserRolesViewProps> = ({ userId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const USER_ROLES_COLUMNS: string[] = [
    intl.formatMessage(messages.roles),
    intl.formatMessage(messages.userGroup),
    intl.formatMessage(messages.workspace),
  ];

  const roles = useSelector((state: RBACStore) => state.roleReducer?.roles?.data || []);

  const fetchData = useCallback(() => {
    dispatch(fetchRoles({ ...mappedProps({ username: userId }), usesMetaInURL: true, system: false }));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = roles.map((role: any) => ({
    row: [role.name, role.display_name, '?'], // TODO: Update once API provides workspace data
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <DataView ouiaId={ouiaId}>
        <DataViewTable variant="compact" aria-label="UserRolesView" ouiaId={`${ouiaId}-table`} columns={USER_ROLES_COLUMNS} rows={rows} />
      </DataView>
    </div>
  );
};

export default UserDetailsRolesView;
