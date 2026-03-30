import React from 'react';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import { WorkspaceDetailLayout } from './WorkspaceDetailLayout';
import AssetsCards from './components/AssetsCards';
import { useWorkspaceDetailData } from './useWorkspaceDetailData';

export const AssetsTab: React.FC = () => {
  const { workspaceId, workspace, workspaceHierarchy, permissions, isLoading, status } = useWorkspaceDetailData();
  const enableRoles = useWorkspacesFlag('m3');

  return (
    <WorkspaceDetailLayout
      workspaceId={workspaceId}
      activeTab="assets"
      workspace={workspace}
      workspaceHierarchy={workspaceHierarchy}
      permissions={permissions}
      isLoading={isLoading}
      status={status}
      enableRoles={enableRoles}
    >
      <AssetsCards workspaceName={workspace?.name || ''} />
    </WorkspaceDetailLayout>
  );
};

export default AssetsTab;
