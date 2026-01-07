import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import messages from '../../../../../Messages';
import { useIntl } from 'react-intl';
import { fetchMembersForGroup } from '../../../../../redux/groups/actions';
import { selectGroupMembers, selectGroupMembersError, selectIsGroupMembersLoading } from '../../../../../redux/groups/selectors';
import { extractErrorMessage } from '../../../../../utilities/errorUtils';
import { TableView } from '../../../../../components/table-view/TableView';
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
  const dispatch = useDispatch();
  const intl = useIntl();

  const columnConfig: ColumnConfigMap<typeof columns> = {
    username: { label: intl.formatMessage(messages.username) },
    firstName: { label: intl.formatMessage(messages.firstName) },
    lastName: { label: intl.formatMessage(messages.lastName) },
  };

  const cellRenderers: CellRendererMap<typeof columns, MemberData> = {
    username: (member) => member.username,
    firstName: (member) => member.first_name || '',
    lastName: (member) => member.last_name || '', // TODO: Last name is not showing (fix this)
  };

  const members = useSelector(selectGroupMembers);
  const isLoading = useSelector(selectIsGroupMembersLoading);
  const error = useSelector(selectGroupMembersError);

  const fetchData = useCallback(() => {
    dispatch(fetchMembersForGroup(groupId, undefined, { limit: 1000 }));
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        page={1}
        perPage={memberData.length || 10}
        onPageChange={() => {}}
        onPerPageChange={() => {}}
        ariaLabel="GroupDetailsUsersView"
        ouiaId={ouiaId}
        emptyStateNoData={emptyState}
        emptyStateNoResults={emptyState}
      />
    </div>
  );
};

// Component uses named export only
export { GroupDetailsUsersView };
