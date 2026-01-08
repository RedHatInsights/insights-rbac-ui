import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

import { TableView, useTableState } from '../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';
import { ActionDropdown } from '../../../../components/ActionDropdown';
import { getBackRoute } from '../../../../helpers/navigation';
import { fetchGroup, fetchGroups, fetchMembersForGroup, removeMembersFromGroup } from '../../../../redux/groups/actions';
import { Group } from '../../../../redux/groups/reducer';
import {
  selectGroupMembers,
  selectGroupMembersMeta,
  selectGroupsFilters,
  selectGroupsPagination,
  selectIsAdminDefaultGroup,
  selectIsChangedDefaultGroup,
  selectIsGroupMembersLoading,
  selectIsPlatformDefaultGroup,
  selectSelectedGroup,
  selectSystemGroupUUID,
} from '../../../../redux/groups/selectors';
import PermissionsContext from '../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { useGroupRemoveModal } from '../../hooks/useGroupRemoveModal';
import pathnames from '../../../../utilities/pathnames';
import messages from '../../../../Messages';
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

const GroupMembers: React.FC<GroupMembersProps> = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const addNotification = useAddNotification();

  // Permissions
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Redux selectors
  const members = useSelector(selectGroupMembers);
  const meta = useSelector(selectGroupMembersMeta);
  const totalCount = meta.count || 0;
  const isLoading = useSelector(selectIsGroupMembersLoading);
  const group = useSelector(selectSelectedGroup) as Group | undefined;
  const adminDefault = useSelector(selectIsAdminDefaultGroup);
  const platformDefault = useSelector(selectIsPlatformDefaultGroup);
  const isChanged = useSelector(selectIsChangedDefaultGroup);
  const systemGroupUuid = useSelector(selectSystemGroupUUID);
  const groupsPagination = useSelector(selectGroupsPagination);
  const groupsFilters = useSelector(selectGroupsFilters);

  // Show default cards for default groups
  const showDefaultCard = (adminDefault || platformDefault) && group?.system;

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

  // Handle data fetching via onStaleData
  const handleStaleData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      if (!groupId) return;

      const usernameFilter = params.filters.name as string | undefined;
      dispatch(
        fetchMembersForGroup(groupId, usernameFilter, {
          limit: params.limit,
          offset: params.offset,
        }),
      );
    },
    [dispatch, groupId],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, Member>({
    columns,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (member) => member.username,
    onStaleData: handleStaleData,
  });

  // Track members to remove (needed for the confirm callback)
  const membersToRemoveRef = useRef<Member[]>([]);

  // Remove modal with simple API
  const removeModal = useGroupRemoveModal({
    itemType: 'member',
    groupName: group?.name || '',
    onConfirm: async () => {
      if (!groupId) return;

      const usernames = membersToRemoveRef.current.map((m) => m.username);
      await dispatch(removeMembersFromGroup(groupId, usernames));
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeGroupMembersSuccessTitle),
        description: intl.formatMessage(messages.removeGroupMembersSuccessDescription),
        dismissable: true,
      });
      tableState.clearSelection();
      handleStaleData({
        offset: 0,
        limit: tableState.perPage,
        filters: tableState.filters,
      });
      dispatch(fetchGroups({ usesMetaInURL: true }));
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

  // Fetch group details on mount
  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [groupId, dispatch]);

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
          data={isLoading ? undefined : members}
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
                postMethod: () => dispatch(fetchGroups({ ...groupsPagination, offset: 0, filters: groupsFilters, usesMetaInURL: true })),
                cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
                submitRoute: getBackRoute(
                  pathnames.groups.link,
                  { ...groupsPagination, offset: 0, limit: (groupsPagination as any)?.limit || 20 },
                  groupsFilters,
                ),
                groupsUuid: [group],
              },
              [pathnames['group-add-members'].path]: {
                isDefault: platformDefault || adminDefault,
                isChanged: isChanged,
                onDefaultGroupChanged: props.onDefaultGroupChanged,
                fetchUuid: systemGroupUuid,
                groupName: group?.name,
                cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
                afterSubmit: () =>
                  handleStaleData({
                    offset: 0,
                    limit: tableState.perPage,
                    filters: tableState.filters,
                  }),
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
