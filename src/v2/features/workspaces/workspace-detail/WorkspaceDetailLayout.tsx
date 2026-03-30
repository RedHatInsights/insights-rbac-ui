import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Content, ContentVariants, Divider, PageSection, Tab, Tabs } from '@patternfly/react-core';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { TabTitleText } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import messages from '../../../../Messages';
import { WorkspaceHeader, type WorkspaceHierarchyItem } from '../components/WorkspaceHeader';
import type { WorkspaceActionCallbacks } from '../components/useWorkspaceActionItems';
import type { WorkspacePermissions, WorkspaceWithPermissions } from '../../../data/queries/workspaces';
import type { WorkspacesStatus } from '../hooks/useWorkspacesWithPermissions';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';

export type WorkspaceDetailTab = 'direct-roles' | 'inherited-roles' | 'assets';

const WORKSPACE_TABS = { roles: 0, assets: 1 } as const;
const ROLE_ASSIGNMENT_TABS = { direct: 0, inherited: 1 } as const;

export interface WorkspaceDetailLayoutProps {
  workspaceId: string;
  activeTab: WorkspaceDetailTab;
  workspace: WorkspaceWithPermissions | null;
  workspaceHierarchy: WorkspaceHierarchyItem[];
  permissions: WorkspacePermissions;
  isLoading: boolean;
  status: WorkspacesStatus;
  enableRoles: boolean;
  children: React.ReactNode;
}

export const WorkspaceDetailLayout: React.FC<WorkspaceDetailLayoutProps> = ({
  workspaceId,
  activeTab,
  workspace,
  workspaceHierarchy,
  permissions,
  isLoading,
  status,
  enableRoles,
  children,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();

  const isRolesContext = activeTab === 'direct-roles' || activeTab === 'inherited-roles';
  const topLevelTabKey = isRolesContext ? WORKSPACE_TABS.roles : WORKSPACE_TABS.assets;
  const roleSubTabKey = activeTab === 'inherited-roles' ? ROLE_ASSIGNMENT_TABS.inherited : ROLE_ASSIGNMENT_TABS.direct;

  const actionCallbacks = useMemo<WorkspaceActionCallbacks>(
    () => ({
      onEdit: () => navigate(pathnames['edit-workspace'].link(workspaceId)),
      onGrantAccess: () => navigate(pathnames['workspace-detail-grant-access'].link(workspaceId)),
      onMove: () => navigate(pathnames['move-workspace-detail'].link(workspaceId)),
      onDelete: () => navigate(pathnames['delete-workspace-detail'].link(workspaceId)),
    }),
    [navigate, workspaceId],
  );

  if (status === 'ready' && workspace && !permissions.view) {
    return <UnauthorizedAccess />;
  }

  const handleTopTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    if (key === WORKSPACE_TABS.assets && !isRolesContext) return;
    if (key === WORKSPACE_TABS.roles && isRolesContext) return;

    if (key === WORKSPACE_TABS.assets) {
      navigate(pathnames['workspace-detail-assets'].link(workspaceId));
    } else {
      navigate(pathnames['workspace-detail-direct-roles'].link(workspaceId));
    }
  };

  const handleRoleSubTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    if (key === ROLE_ASSIGNMENT_TABS.inherited) {
      navigate(pathnames['workspace-detail-inherited-roles'].link(workspaceId));
    } else {
      navigate(pathnames['workspace-detail-direct-roles'].link(workspaceId));
    }
  };

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        isLoading={isLoading}
        workspaceHierarchy={workspaceHierarchy}
        permissions={permissions}
        actionCallbacks={actionCallbacks}
      />
      <Divider />
      <Tabs
        className="pf-v6-u-background-color-100"
        activeKey={topLevelTabKey}
        onSelect={handleTopTabSelect}
        inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
        role="region"
      >
        {enableRoles && (
          <Tab
            eventKey={WORKSPACE_TABS.roles}
            title={intl.formatMessage(messages.roleAssignments)}
            tabContentId="rolesTab"
            ouiaId="roles-tab-button"
          />
        )}
        <Tab eventKey={WORKSPACE_TABS.assets} title={intl.formatMessage(messages.assets)} tabContentId="assetsTab" ouiaId="assets-tab-button" />
      </Tabs>
      <PageSection hasBodyWrapper={false} isFilled={activeTab !== 'assets'}>
        {isRolesContext && enableRoles && (
          <>
            <Tabs
              activeKey={roleSubTabKey}
              onSelect={handleRoleSubTabSelect}
              inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
              className="pf-v6-u-background-color-100"
            >
              <Tab
                eventKey={ROLE_ASSIGNMENT_TABS.direct}
                title={intl.formatMessage(messages.rolesAssignedInThisWorkspace)}
                tabContentId="rolesAssignedInWorkspaceTab"
              />
              <Tab
                eventKey={ROLE_ASSIGNMENT_TABS.inherited}
                title={
                  <TabTitleText>
                    {intl.formatMessage(messages.rolesAssignedInParentWorkspaces)}
                    <Popover
                      triggerAction="hover"
                      position="top-end"
                      headerContent={intl.formatMessage(messages.parentWorkspacesPopoverHeader)}
                      bodyContent={intl.formatMessage(messages.parentWorkspacesPopoverBody)}
                    >
                      <Icon className="pf-v6-u-pl-sm" isInline>
                        <OutlinedQuestionCircleIcon />
                      </Icon>
                    </Popover>
                  </TabTitleText>
                }
                tabContentId="rolesAssignedOutsideTab"
              />
            </Tabs>
            {activeTab === 'inherited-roles' && (
              <Content component={ContentVariants.p} className="pf-v6-u-py-md pf-v6-u-color-200">
                {intl.formatMessage(messages.parentWorkspacesInstructionalText, {
                  b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
                })}
              </Content>
            )}
          </>
        )}
        {children}
      </PageSection>
    </>
  );
};

export default WorkspaceDetailLayout;
