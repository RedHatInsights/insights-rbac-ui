import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Spinner } from '@patternfly/react-core';
import { ExclamationCircleIcon, UsersIcon } from '@patternfly/react-icons';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchMembersForGroup } from '../../../../../redux/groups/actions';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';

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

  const members = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.members?.data || []);
  const isLoading = useSelector((state: RBACStore) => (state.groupReducer?.selectedGroup?.members as any)?.isLoading || false);
  const error = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.members as any)?.error,
  );

  const fetchData = useCallback(() => {
    dispatch(fetchMembersForGroup(groupId, undefined, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
        <Spinner size="lg" aria-label="Loading group members" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="Unable to load users" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  // Show empty state when no users
  if (members.length === 0) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="No users found" icon={<EmptyStateIcon icon={UsersIcon} />} headingLevel="h4" />
          <EmptyStateBody>{intl.formatMessage(messages.groupNoUsersAssigned)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const rows = members.map((user: any) => ({
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

// Component uses named export only
export { GroupDetailsUsersView };
