import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchMembersForGroup } from '../../../../../redux/groups/actions';
import { selectGroupMembers, selectGroupMembersError, selectIsGroupMembersLoading } from '../../../../../redux/groups/selectors';
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

  const members = useSelector(selectGroupMembers);
  const isLoading = useSelector(selectIsGroupMembersLoading);
  const error = useSelector(selectGroupMembersError);

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
