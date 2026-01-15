import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchRolesForGroup } from '../../../../../redux/groups/actions';
import { selectGroupRoles, selectGroupRolesError, selectIsGroupRolesLoading } from '../../../../../redux/groups/selectors';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView } from '../../../../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface GroupRolesViewProps {
  groupId: string;
  ouiaId: string;
}

interface RoleData {
  uuid: string;
  display_name: string;
  workspace?: string;
}

const columns = ['name', 'workspace'] as const;

const GroupDetailsRolesView: React.FunctionComponent<GroupRolesViewProps> = ({ groupId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = {
    name: { label: intl.formatMessage(messages.roles) },
    workspace: { label: intl.formatMessage(messages.workspace) },
  };

  const cellRenderers: CellRendererMap<typeof columns, RoleData> = {
    name: (role) => role.display_name,
    workspace: () => '?', // TODO: Update once API provides workspace data
  };

  const roles = useSelector(selectGroupRoles);
  const isLoading = useSelector(selectIsGroupRolesLoading);
  const error = useSelector(selectGroupRolesError);

  const fetchData = useCallback(() => {
    dispatch(fetchRolesForGroup(groupId, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show error state
  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load roles" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const emptyState = (
    <EmptyState headingLevel="h4" icon={KeyIcon} titleText="No roles found" variant="sm">
      <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
    </EmptyState>
  );

  const roleData: RoleData[] = roles.map((role: any) => ({
    uuid: role.uuid,
    display_name: role.display_name,
  }));

  return (
    <div className="pf-v6-u-pt-md">
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
        ariaLabel="GroupRolesView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

// Component uses named export only
export { GroupDetailsRolesView };
