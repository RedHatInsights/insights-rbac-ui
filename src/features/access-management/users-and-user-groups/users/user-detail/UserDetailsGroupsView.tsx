import React, { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import { fetchGroups } from '../../../../../redux/groups/actions';
import { selectGroups, selectGroupsErrorState, selectIsGroupsLoading } from '../../../../../redux/groups/selectors';
import messages from '../../../../../Messages';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView } from '../../../../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface UserGroupsViewProps {
  userId: string;
  ouiaId: string;
}

interface GroupData {
  uuid: string;
  name: string;
  principalCount?: number;
}

const columns = ['name', 'users'] as const;

const UserDetailsGroupsView: React.FunctionComponent<UserGroupsViewProps> = ({ userId, ouiaId }) => {
  const dispatch = useDispatch();
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = {
    name: { label: intl.formatMessage(messages.userGroup) },
    users: { label: intl.formatMessage(messages.users) },
  };

  const cellRenderers: CellRendererMap<typeof columns, GroupData> = {
    name: (group) => group.name,
    users: (group) => group.principalCount || '?', // TODO: update once API provides principalCount [RHCLOUD-35963]
  };

  const groups = useSelector(selectGroups);
  const isLoading = useSelector(selectIsGroupsLoading);
  const error = useSelector(selectGroupsErrorState);

  const fetchData = useCallback(() => {
    dispatch(fetchGroups({ ...mappedProps({ username: userId }), usesMetaInURL: true, system: false }));
  }, [dispatch, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show error state
  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load groups" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const emptyState = (
    <EmptyState headingLevel="h4" icon={UsersIcon} titleText="No groups found" variant="sm">
      <EmptyStateBody>This user is not a member of any groups.</EmptyStateBody>
    </EmptyState>
  );

  const groupData: GroupData[] = groups.map((group: any) => ({
    uuid: group.uuid,
    name: group.name,
    principalCount: group.principalCount,
  }));

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof columns, GroupData>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : groupData}
        totalCount={groupData.length}
        getRowId={(group) => group.uuid}
        cellRenderers={cellRenderers}
        page={1}
        perPage={groupData.length || 10}
        onPageChange={() => {}}
        onPerPageChange={() => {}}
        ariaLabel="UserGroupsView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

// Component uses named export only
export { UserDetailsGroupsView };
