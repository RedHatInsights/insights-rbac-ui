import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchRolesForGroup } from '../../../../../redux/groups/actions';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';

interface GroupRolesViewProps {
  groupId: string;
  ouiaId: string;
}

const GroupDetailsRolesView: React.FunctionComponent<GroupRolesViewProps> = ({ groupId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const GROUP_ROLES_COLUMNS: string[] = [intl.formatMessage(messages.roles), intl.formatMessage(messages.workspace)];

  const roles = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.data || []);
  const isLoading = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.isLoading || false);
  const error = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.roles as any)?.error,
  );

  const fetchData = useCallback(() => {
    dispatch(fetchRolesForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
        <Spinner size="lg" aria-label="Loading roles" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="Unable to load roles" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  // Show empty state when no roles
  if (roles.length === 0) {
    return (
      <div className="pf-v5-u-pt-md">
        <EmptyState variant="sm">
          <EmptyStateHeader titleText="No roles found" icon={<EmptyStateIcon icon={KeyIcon} />} headingLevel="h4" />
          <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

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

// Component uses named export only
export { GroupDetailsRolesView };
