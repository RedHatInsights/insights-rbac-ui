import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { type Group, useGroupsQuery } from '../../../../../data/queries/groups';
import messages from '../../../../../Messages';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView, useTableState } from '../../../../../components/table-view';
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
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroup) },
      users: { label: intl.formatMessage(messages.users) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, GroupData> = useMemo(
    () => ({
      name: (group) => group.name,
      users: (group) => group.principalCount ?? 0,
    }),
    [],
  );

  // Use useTableState for table state management
  const tableState = useTableState<typeof columns, GroupData>({
    columns,
    getRowId: (group) => group.uuid,
    initialPerPage: 100, // Show all items in detail views
    syncWithUrl: false, // Drawer tables shouldn't sync with URL
  });

  // Use React Query to fetch groups filtered by this user's username
  // The V1 API supports filtering groups by username parameter
  const { data, isLoading, error } = useGroupsQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    username: userId, // Filter to only groups this user belongs to
  });

  // Extract groups from typed response
  const groups: Group[] = data?.data ?? [];

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

  const groupData: GroupData[] = groups.map((group) => ({
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
        ariaLabel="UserGroupsView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
        {...tableState}
      />
    </div>
  );
};

// Component uses named export only
export { UserDetailsGroupsView };
