import React, { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import { fetchGroups } from '../../../../../redux/groups/actions';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';

interface UserGroupsViewProps {
  userId: string;
  ouiaId: string;
}

const UserDetailsGroupsView: React.FunctionComponent<UserGroupsViewProps> = ({ userId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const columns: string[] = [intl.formatMessage(messages.userGroup), intl.formatMessage(messages.users)];

  const groups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);
  const isLoading = useSelector((state: RBACStore) => state.groupReducer?.isLoading || false);
  const error = useSelector((state: RBACStore) => state.groupReducer?.groups?.error);

  const fetchData = useCallback(() => {
    dispatch(fetchGroups({ ...mappedProps({ username: userId }), usesMetaInURL: true, system: false }));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
        <Spinner size="lg" aria-label="Loading user groups" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="Unable to load groups" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  // Show empty state when no groups
  if (groups.length === 0) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="No groups found" icon={<EmptyStateIcon icon={UsersIcon} />} headingLevel="h4" />
          <EmptyStateBody>This user is not a member of any groups.</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

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

// Component uses named export only
export { UserDetailsGroupsView };
