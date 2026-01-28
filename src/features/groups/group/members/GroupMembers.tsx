import React, { Fragment, Suspense, useCallback, useContext, useMemo, useRef } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

import { TableView, useTableState } from '../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';
import { ActionDropdown } from '../../../../components/ActionDropdown';
import { getBackRoute } from '../../../../helpers/navigation';
import { useGroupMembersQuery, useGroupQuery, useGroupsQuery, useRemoveMembersFromGroupMutation } from '../../../../data/queries/groups';
import PermissionsContext from '../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { useGroupRemoveModal } from '../../hooks/useGroupRemoveModal';
import pathnames from '../../../../utilities/pathnames';
import messages from '../../../../Messages';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import { DefaultMembersCard } from '../../components/DefaultMembersCard';
import { RemoveGroupMembers } from './RemoveGroupMembers';
import { GroupMembersEmptyState } from './components/GroupMembersEmptyState';
import { MemberActionsMenu } from './components/MemberActionsMenu';
import type { Member, MemberTableRow } from './types';

interface GroupMembersProps {
  onDefaultGroupChanged?: (group: { uuid: string; name: string }) => void;
}

// Column definitions
const columns = ['status', 'username', 'email', 'lastName', 'firstName'] as const;

/**
 * GroupMembers - fetches its own data via React Query.
 *
 * Component is self-contained with React Query data fetching.
 */
const GroupMembers: React.FC<GroupMembersProps> = (props) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Permissions
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // For default access groups, we need to first get the system group UUID
  const isPlatformDefaultRoute = groupId === DEFAULT_ACCESS_GROUP_ID;

  // Fetch system group UUID when viewing default access group
  const { data: systemGroupData } = useGroupsQuery({ platformDefault: true, limit: 1 }, { enabled: isPlatformDefaultRoute });
  const systemGroupUuid = systemGroupData?.data?.[0]?.uuid;

  // Resolve actual group ID (handle default access group)
  const actualGroupId = useMemo(() => (isPlatformDefaultRoute ? systemGroupUuid : groupId), [isPlatformDefaultRoute, systemGroupUuid, groupId]);

  // Fetch group data
  const { data: groupData } = useGroupQuery(actualGroupId ?? '', {
    enabled: !!actualGroupId,
  });

  // Derive group flags from the group data
  const platformDefault = groupData?.platform_default === true;
  const adminDefault = groupData?.admin_default === true;
  const isSystemGroup = groupData?.system === true;
  const isChanged = platformDefault && !isSystemGroup;
  const group = groupData;

  // Show default cards for default groups that haven't been modified
  const showDefaultCard = (adminDefault || platformDefault) && isSystemGroup;

  // useTableState for all state management - provides apiParams for queries
  const tableState = useTableState<typeof columns, Member>({
    columns,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (member) => member.username,
  });

  // Fetch members using apiParams from tableState
  const { data: membersData, isLoading: isMembersLoading } = useGroupMembersQuery(
    actualGroupId ?? '',
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      orderBy: tableState.apiParams.orderBy,
      username: (tableState.apiParams.filters.name as string) || undefined,
    },
    { enabled: !!actualGroupId && !showDefaultCard },
  );

  const members = membersData?.members ?? [];
  const totalCount = membersData?.totalCount ?? 0;

  // Remove members mutation
  const removeMembersMutation = useRemoveMembersFromGroupMutation();

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      status: { label: intl.formatMessage(messages.status) },
      username: { label: intl.formatMessage(messages.username) },
      email: { label: intl.formatMessage(messages.email) },
      lastName: { label: intl.formatMessage(messages.lastName) },
      firstName: { label: intl.formatMessage(messages.firstName) },
    }),
    [intl],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        id: 'name',
        label: intl.formatMessage(messages.username),
        type: 'text',
        placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.username).toLowerCase() }),
      },
    ],
    [intl],
  );

  // Track members to remove (needed for the confirm callback)
  const membersToRemoveRef = useRef<Member[]>([]);

  // Remove modal with simple API
  const removeModal = useGroupRemoveModal({
    itemType: 'member',
    groupName: group?.name || '',
    onConfirm: async () => {
      if (!actualGroupId) return;

      const usernames = membersToRemoveRef.current.map((m) => m.username);
      await removeMembersMutation.mutateAsync({
        groupId: actualGroupId,
        usernames,
      });
      tableState.clearSelection();
    },
  });

  // Helper to open modal with members
  const handleOpenRemoveModal = useCallback(
    (members: Member[]) => {
      membersToRemoveRef.current = members;
      removeModal.openModal(members.map((m) => m.username));
    },
    [removeModal],
  );

  const removeModalState = removeModal.modalState;

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, Member> = useMemo(
    () => ({
      status: (member) => (
        <Label color={member.is_active ? 'green' : 'grey'}>{intl.formatMessage(member.is_active ? messages.active : messages.inactive)}</Label>
      ),
      username: (member) => member.username,
      email: (member) => member.email || '—',
      lastName: (member) => member.last_name || '—',
      firstName: (member) => member.first_name || '—',
    }),
    [intl],
  );

  // Row actions renderer
  const renderActions = useCallback(
    (member: Member) => {
      if (!isAdmin || adminDefault || platformDefault) {
        return null;
      }

      return (
        <ActionDropdown
          ariaLabel={`Actions for ${member.username}`}
          ouiaId={`member-actions-${member.username}`}
          items={[
            {
              key: 'remove',
              label: intl.formatMessage(messages.remove),
              onClick: () => handleOpenRemoveModal([member]),
              ouiaId: `member-actions-${member.username}-remove`,
            },
          ]}
        />
      );
    },
    [isAdmin, adminDefault, platformDefault, intl, handleOpenRemoveModal],
  );

  // Handle add members
  const handleAddMembers = useCallback(() => {
    if (groupId) {
      navigate(pathnames['group-add-members'].link.replace(':groupId', groupId));
    }
  }, [navigate, groupId]);

  if (!groupId) {
    return null;
  }

  return (
    <Fragment>
      {showDefaultCard ? (
        <DefaultMembersCard isAdminDefault={adminDefault || false} />
      ) : (
        <TableView<typeof columns, Member>
          columns={columns}
          columnConfig={columnConfig}
          data={isMembersLoading ? undefined : members}
          totalCount={totalCount}
          getRowId={(member) => member.username}
          cellRenderers={cellRenderers}
          filterConfig={filterConfig}
          selectable={isAdmin}
          renderActions={isAdmin && !adminDefault && !platformDefault ? renderActions : undefined}
          toolbarActions={
            isAdmin ? (
              <Button variant="primary" onClick={handleAddMembers}>
                {intl.formatMessage(messages.addMember)}
              </Button>
            ) : undefined
          }
          bulkActions={
            isAdmin ? (
              <MemberActionsMenu
                selectedRows={tableState.selectedRows.map((m) => ({ member: m }) as MemberTableRow)}
                onRemoveMembers={(members) => handleOpenRemoveModal(members)}
              />
            ) : undefined
          }
          emptyStateNoData={<GroupMembersEmptyState hasActiveFilters={false} />}
          emptyStateNoResults={<GroupMembersEmptyState hasActiveFilters={true} />}
          variant="compact"
          ariaLabel="Group members table"
          ouiaId="group-members-table"
          {...tableState}
        />
      )}

      <RemoveGroupMembers
        title={removeModalState.title}
        text={removeModalState.text}
        isOpen={removeModalState.isOpen}
        confirmButtonLabel={removeModalState.confirmButtonLabel}
        onClose={removeModalState.onClose}
        onSubmit={removeModalState.onConfirm}
        isDefault={platformDefault}
        isChanged={isChanged}
      />

      {!showDefaultCard && (
        <Suspense>
          <Outlet
            context={{
              [pathnames['group-members-edit-group'].path]: {
                group,
                cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
                submitRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
              },
              [pathnames['group-members-remove-group'].path]: {
                postMethod: () => {
                  // With React Query, cache invalidation happens automatically
                },
                cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
                submitRoute: getBackRoute(pathnames.groups.link, { offset: 0, limit: 20 }, {}),
                groupsUuid: [group],
              },
              [pathnames['group-add-members'].path]: {
                isDefault: platformDefault || adminDefault,
                isChanged: isChanged,
                onDefaultGroupChanged: props.onDefaultGroupChanged,
                fetchUuid: systemGroupUuid,
                groupName: group?.name,
                cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
                // No afterSubmit needed - mutations invalidate the cache automatically
              },
            }}
          />
        </Suspense>
      )}
    </Fragment>
  );
};

// Named export for stories and tests
export { GroupMembers };

// Default export for routing
export default GroupMembers;
