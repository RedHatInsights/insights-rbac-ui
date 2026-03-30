import React from 'react';
import { useWorkspaceInheritedGroups } from '../../../data/queries/groupAssignments';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import { WorkspaceDetailLayout } from './WorkspaceDetailLayout';
import { InheritedGroupAssignmentsTable } from './components/InheritedGroupAssignmentsTable';
import { useWorkspaceDetailData } from './useWorkspaceDetailData';

export const InheritedRolesTab: React.FC = () => {
  const { workspaceId, workspace, workspaceHierarchy, permissions, isLoading, status } = useWorkspaceDetailData();
  const enableRoles = useWorkspacesFlag('m3');

  const { data: parentGroups, isLoading: parentGroupsIsLoading } = useWorkspaceInheritedGroups(workspaceId, {
    enabled: !!workspaceId && !!workspace?.parent_id,
  });

  const currentWorkspace = workspace ? { id: workspace.id ?? '', name: workspace.name ?? '' } : undefined;

  return (
    <WorkspaceDetailLayout
      workspaceId={workspaceId}
      activeTab="inherited-roles"
      workspace={workspace}
      workspaceHierarchy={workspaceHierarchy}
      permissions={permissions}
      isLoading={isLoading}
      status={status}
      enableRoles={enableRoles}
    >
      <InheritedGroupAssignmentsTable
        key="parent-workspace-roles"
        groups={parentGroups}
        isLoading={parentGroupsIsLoading}
        currentWorkspace={currentWorkspace}
        ouiaId="parent-role-assignments-table"
      />
    </WorkspaceDetailLayout>
  );
};

export default InheritedRolesTab;
