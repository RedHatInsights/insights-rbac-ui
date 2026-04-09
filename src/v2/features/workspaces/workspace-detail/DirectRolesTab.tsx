import React, { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { useWorkspaceGroups } from '../../../data/queries/groupAssignments';
import type { WorkspaceGroupRow } from '../../../data/queries/groupAssignments';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import { useRoleBindingsAccess } from '../../../hooks/useRbacAccess';
import { WorkspaceDetailLayout } from './WorkspaceDetailLayout';
import { BaseGroupAssignmentsTable } from './components/BaseGroupAssignmentsTable';
import { RemoveGroupFromWorkspaceModal } from './components/RemoveGroupFromWorkspaceModal';
import { useWorkspaceDetailData } from './useWorkspaceDetailData';
import messages from '../../../../Messages';

interface DirectRolesTabProps {
  groupId?: string;
}

export const DirectRolesTab: React.FC<DirectRolesTabProps> = ({ groupId }) => {
  const intl = useIntl();
  const { workspaceId, workspace, workspaceHierarchy, permissions, isLoading, status } = useWorkspaceDetailData();
  const rbAccess = useRoleBindingsAccess(workspaceId);
  const enableRoles = useWorkspacesFlag('m3');
  const navigate = useAppNavigate();

  const [groupToRemove, setGroupToRemove] = useState<WorkspaceGroupRow | undefined>();

  const { data: roleBindings, isLoading: roleBindingsIsLoading } = useWorkspaceGroups(workspaceId, {
    enabled: !!workspaceId && rbAccess.canView,
  });

  const currentWorkspace = workspace ? { id: workspace.id ?? '', name: workspace.name ?? '', type: 'workspace' as const } : undefined;

  const handleGroupSelect = useCallback(
    (group: { id: string }) => {
      navigate(pathnames['workspace-detail-direct-roles-group'].link(workspaceId, group.id));
    },
    [navigate, workspaceId],
  );

  const handleGroupDeselect = useCallback(() => {
    navigate(pathnames['workspace-detail-direct-roles'].link(workspaceId));
  }, [navigate, workspaceId]);

  const handleGrantAccess = useCallback(() => {
    navigate(pathnames['workspace-detail-grant-access'].link(workspaceId));
  }, [navigate, workspaceId]);

  const handleEditAccess = useCallback(
    (group: WorkspaceGroupRow) => {
      navigate(pathnames['workspace-detail-edit-access'].link(workspaceId, group.id));
    },
    [navigate, workspaceId],
  );

  const roleBindingDenied = !rbAccess.isLoading && !rbAccess.canView;

  return (
    <WorkspaceDetailLayout
      workspaceId={workspaceId}
      activeTab="direct-roles"
      workspace={workspace}
      workspaceHierarchy={workspaceHierarchy}
      permissions={permissions}
      isLoading={isLoading}
      status={status}
      enableRoles={enableRoles}
    >
      {roleBindingDenied ? (
        <UnauthorizedAccess
          serviceName={intl.formatMessage(messages.unauthorizedAccessServiceName)}
          bodyText={intl.formatMessage(messages.unauthorizedAccessBodyText)}
        />
      ) : (
        <>
          <BaseGroupAssignmentsTable
            key="current-workspace-roles"
            groups={roleBindings}
            isLoading={roleBindingsIsLoading || rbAccess.isLoading}
            currentWorkspace={currentWorkspace}
            canGrantAccess={rbAccess.canCreate}
            canEditAccess={rbAccess.canCreate}
            canRevokeAccess={rbAccess.canRevoke}
            ouiaId="current-role-assignments"
            focusedGroupId={groupId}
            onGroupSelect={handleGroupSelect}
            onGroupDeselect={handleGroupDeselect}
            onGrantAccess={handleGrantAccess}
            onEditAccess={handleEditAccess}
            onRemoveAccess={setGroupToRemove}
          />
          {groupToRemove && currentWorkspace && (
            <RemoveGroupFromWorkspaceModal
              isOpen
              groupId={groupToRemove.id}
              groupName={groupToRemove.name}
              workspaceId={currentWorkspace.id}
              workspaceName={currentWorkspace.name}
              onClose={() => setGroupToRemove(undefined)}
            />
          )}
        </>
      )}
    </WorkspaceDetailLayout>
  );
};

export default DirectRolesTab;
