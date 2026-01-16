import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import React, { useMemo } from 'react';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { useGroupMembersQuery } from '../../../../../data/queries/groups';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';

interface GroupDetailsUsersViewProps {
  groupId: string;
  ouiaId: string;
}

interface MemberData {
  username: string;
  first_name?: string;
  last_name?: string;
}

const columns = ['username', 'firstName', 'lastName'] as const;

const GroupDetailsUsersView: React.FunctionComponent<GroupDetailsUsersViewProps> = ({ groupId, ouiaId }) => {
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      username: { label: intl.formatMessage(messages.username) },
      firstName: { label: intl.formatMessage(messages.firstName) },
      lastName: { label: intl.formatMessage(messages.lastName) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, MemberData> = useMemo(
    () => ({
      username: (member) => member.username,
      firstName: (member) => member.first_name || '',
      lastName: (member) => member.last_name || '',
    }),
    [],
  );

  // Use useTableState for table state management
  const tableState = useTableState<typeof columns, MemberData>({
    columns,
    getRowId: (member) => member.username,
    initialPerPage: 100, // Show all items in detail views
    syncWithUrl: false, // Drawer tables shouldn't sync with URL
  });

  // Use React Query instead of Redux
  const { data, isLoading, error } = useGroupMembersQuery(groupId);

  // Extract members from response - API returns { data: [...] } for pagination
  const members = (data as any)?.data || [];

  // Show error state
  if (error) {
    return (
      <div className="pf-v6-u-pt-md">
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load users" variant="sm">
          <EmptyStateBody>{extractErrorMessage(error)}</EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  const emptyState = (
    <EmptyState headingLevel="h4" icon={UsersIcon} titleText="No users found" variant="sm">
      <EmptyStateBody>{intl.formatMessage(messages.groupNoUsersAssigned)}</EmptyStateBody>
    </EmptyState>
  );

  const memberData: MemberData[] = members.map((user: any) => ({
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
  }));

  return (
    <div className="pf-v6-u-pt-md">
      <TableView<typeof columns, MemberData>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : memberData}
        totalCount={memberData.length}
        getRowId={(member) => member.username}
        cellRenderers={cellRenderers}
        ariaLabel="GroupDetailsUsersView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
        {...tableState}
      />
    </div>
  );
};

// Component uses named export only
export { GroupDetailsUsersView };
