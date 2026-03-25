import React from 'react';
import { useIntl } from 'react-intl';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { useWorkspaceInheritedGroups } from '../../../data/queries/groupAssignments';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import { useRoleBindingsAccess } from '../../../hooks/useRbacAccess';
import { WorkspaceDetailLayout } from './WorkspaceDetailLayout';
import { InheritedGroupAssignmentsTable } from './components/InheritedGroupAssignmentsTable';
import { useWorkspaceDetailData } from './useWorkspaceDetailData';
import messages from '../../../../Messages';

export const InheritedRolesTab: React.FC = () => {
  const intl = useIntl();
  const { workspaceId, workspace, workspaceHierarchy, permissions, isLoading, status } = useWorkspaceDetailData();
  const rbAccess = useRoleBindingsAccess(workspaceId);
  const enableRoles = useWorkspacesFlag('m3');

  const { data: parentGroups, isLoading: parentGroupsIsLoading } = useWorkspaceInheritedGroups(workspaceId, {
    enabled: !!workspaceId && !!workspace?.parent_id && rbAccess.canView,
  });

  const currentWorkspace = workspace ? { id: workspace.id ?? '', name: workspace.name ?? '' } : undefined;

  const roleBindingDenied = !rbAccess.isLoading && !rbAccess.canView;

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
      {roleBindingDenied ? (
        <UnauthorizedAccess
          serviceName={intl.formatMessage(messages.unauthorizedAccessServiceName)}
          bodyText={intl.formatMessage(messages.unauthorizedAccessBodyText)}
        />
      ) : (
        <InheritedGroupAssignmentsTable
          key="parent-workspace-roles"
          groups={parentGroups}
          isLoading={parentGroupsIsLoading || rbAccess.isLoading}
          currentWorkspace={currentWorkspace}
          ouiaId="parent-role-assignments"
        />
      )}
    </WorkspaceDetailLayout>
  );
};

export default InheritedRolesTab;
