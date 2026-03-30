import React, { useCallback } from 'react';
import { useWorkspaceGroups } from '../../../data/queries/groupAssignments';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import { WorkspaceDetailLayout } from './WorkspaceDetailLayout';
import { BaseGroupAssignmentsTable } from './components/BaseGroupAssignmentsTable';
import { useWorkspaceDetailData } from './useWorkspaceDetailData';

interface DirectRolesTabProps {
  groupId?: string;
}

export const DirectRolesTab: React.FC<DirectRolesTabProps> = ({ groupId }) => {
  const { workspaceId, workspace, workspaceHierarchy, permissions, isLoading, status } = useWorkspaceDetailData();
  const enableRoles = useWorkspacesFlag('m3');
  const navigate = useAppNavigate();

  const { data: roleBindings, isLoading: roleBindingsIsLoading } = useWorkspaceGroups(workspaceId, {
    enabled: !!workspaceId,
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
      <BaseGroupAssignmentsTable
        key="current-workspace-roles"
        groups={roleBindings}
        isLoading={roleBindingsIsLoading}
        currentWorkspace={currentWorkspace}
        canGrantAccess={permissions.create}
        canEditAccess={permissions.create}
        canRevokeAccess={permissions.delete}
        ouiaId="current-role-assignments-table"
        focusedGroupId={groupId}
        onGroupSelect={handleGroupSelect}
        onGroupDeselect={handleGroupDeselect}
        onGrantAccess={handleGrantAccess}
      />
    </WorkspaceDetailLayout>
  );
};

export default DirectRolesTab;
