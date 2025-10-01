import React, { useCallback, useEffect } from 'react';
import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { RBACStore } from '../../../../../redux/store';
import messages from '../../../../../Messages';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { fetchRoles } from '../../../../../redux/roles/actions';
import { mappedProps } from '../../../../../helpers/dataUtilities';

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
  const isLoading = useSelector((state: RBACStore) => state.roleReducer?.isLoading || false);
  const error = useSelector((state: RBACStore) => state.roleReducer?.roles?.error);

  const fetchData = useCallback(() => {
    dispatch(fetchRoles({ ...mappedProps({ username: userId }), usesMetaInURL: true, system: false }));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
        <Spinner size="lg" aria-label="Loading user roles" />
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
          <EmptyStateBody>This user has no roles assigned.</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const rows = roles.map((role: any) => ({
    row: [role.name, '?', '?'], // TODO: Update once API provides user group and workspace data
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <DataView ouiaId={ouiaId}>
        <DataViewTable variant="compact" aria-label="UserRolesView" ouiaId={`${ouiaId}-table`} columns={USER_ROLES_COLUMNS} rows={rows} />
      </DataView>
    </div>
  );
};

// Component uses named export only
export { UserDetailsRolesView };
