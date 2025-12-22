import React, { useCallback, useEffect } from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { fetchRoles } from '../../../../../redux/roles/actions';
import { selectIsRolesLoading, selectRoles, selectRolesErrorState } from '../../../../../redux/roles/selectors';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import { TableView } from '../../../../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface UserRolesViewProps {
  userId: string;
  ouiaId: string;
}

interface RoleData {
  uuid: string;
  name: string;
  userGroup?: string;
  workspace?: string;
}

const columns = ['name', 'userGroup', 'workspace'] as const;

const UserDetailsRolesView: React.FunctionComponent<UserRolesViewProps> = ({ userId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = {
    name: { label: intl.formatMessage(messages.roles) },
    userGroup: { label: intl.formatMessage(messages.userGroup) },
    workspace: { label: intl.formatMessage(messages.workspace) },
  };

  const cellRenderers: CellRendererMap<typeof columns, RoleData> = {
    name: (role) => role.name,
    userGroup: () => '?', // TODO: Update once API provides user group data
    workspace: () => '?', // TODO: Update once API provides workspace data
  };

  const roles = useSelector(selectRoles);
  const isLoading = useSelector(selectIsRolesLoading);
  const error = useSelector(selectRolesErrorState);

  const fetchData = useCallback(() => {
    dispatch(fetchRoles({ ...mappedProps({ username: userId }), usesMetaInURL: true, system: false }));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const emptyState = (
    <EmptyState variant="sm">
      <EmptyStateHeader titleText="No roles found" icon={<EmptyStateIcon icon={KeyIcon} />} headingLevel="h4" />
      <EmptyStateBody>This user has no roles assigned.</EmptyStateBody>
    </EmptyState>
  );

  const roleData: RoleData[] = roles.map((role: any) => ({
    uuid: role.uuid,
    name: role.name,
  }));

  return (
    <div className="pf-v5-u-pt-md">
      <TableView<typeof columns, RoleData>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : roleData}
        totalCount={roleData.length}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        page={1}
        perPage={roleData.length || 10}
        onPageChange={() => {}}
        onPerPageChange={() => {}}
        ariaLabel="UserRolesView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

// Component uses named export only
export { UserDetailsRolesView };
