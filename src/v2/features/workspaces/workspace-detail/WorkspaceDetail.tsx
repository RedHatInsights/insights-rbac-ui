import React, { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Content, ContentVariants, Divider, PageSection, Tab, Tabs } from '@patternfly/react-core';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { TabTitleText } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import messages from '../../../../Messages';
import AssetsCards from './components/AssetsCards';
import { BaseGroupAssignmentsTable } from './components/BaseGroupAssignmentsTable';
import { InheritedGroupAssignmentsTable } from './components/InheritedGroupAssignmentsTable';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import { EMPTY_PERMISSIONS, type WorkspaceWithPermissions, type WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { useWorkspacesWithPermissions } from '../hooks/useWorkspacesWithPermissions';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { useWorkspaceGroups, useWorkspaceInheritedGroups } from '../../../data/queries/groupAssignments';

interface WorkspaceData {
  name: string;
  id: string;
}

const WORKSPACE_TABS = {
  roles: 0,
  assets: 1,
} as const;

const ROLE_ASSIGNMENT_TABS = {
  'roles-assigned-in-workspace': 0,
  'roles-assigned-in-parent-workspaces': 1,
} as const;

export const WorkspaceDetail = () => {
  const intl = useIntl();
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const enableRoles = useWorkspacesFlag('m3');
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);
  const activeTabString = (() => {
    const raw = searchParams.get('activeTab');
    if (!raw) return enableRoles ? 'roles' : 'assets';
    if (!enableRoles && raw !== 'assets') return 'assets';
    return raw;
  })();
  const activeRoleAssignmentTabString = searchParams.get('roleAssignmentTab') || 'roles-assigned-in-workspace';

  const rolesRef = React.createRef<HTMLElement>();
  const assetsRef = React.createRef<HTMLElement>();

  // Single composite hook: workspaces enriched with per-workspace Kessel permissions
  const { workspaces, status } = useWorkspacesWithPermissions();

  // Find the current workspace from the enriched list
  const selectedWorkspace = useMemo<WorkspaceWithPermissions | undefined>(
    () => workspaces.find((ws) => ws.id === workspaceId),
    [workspaces, workspaceId],
  );

  const isLoading = status === 'loading';

  const shouldFetchRoleBindings = activeTabString === 'roles' && enableRoles && activeRoleAssignmentTabString === 'roles-assigned-in-workspace';
  const { data: roleBindings, isLoading: roleBindingsIsLoading } = useWorkspaceGroups(workspaceId!, {
    enabled: shouldFetchRoleBindings && !!workspaceId,
  });

  const shouldFetchParentBindings =
    activeTabString === 'roles' &&
    enableRoles &&
    activeRoleAssignmentTabString === 'roles-assigned-in-parent-workspaces' &&
    !!selectedWorkspace?.parent_id;
  const { data: parentGroups, isLoading: parentGroupsIsLoading } = useWorkspaceInheritedGroups(workspaceId ?? '', {
    enabled: shouldFetchParentBindings && !!workspaceId,
  });

  const buildWorkspacesHierarchy = (allWorkspaces: WorkspacesWorkspace[], targetWorkspaceId: string): WorkspaceData[] => {
    let currentWorkspace = allWorkspaces.find((ws) => ws.id === targetWorkspaceId);

    const hierarchy: WorkspaceData[] = currentWorkspace ? [{ name: currentWorkspace.name ?? '', id: currentWorkspace.id ?? '' }] : [];
    while (currentWorkspace?.parent_id?.length && currentWorkspace?.parent_id?.length > 0) {
      currentWorkspace = allWorkspaces.find((ws) => ws.id === currentWorkspace?.parent_id);
      if (!currentWorkspace) break;
      hierarchy.unshift({ name: currentWorkspace.name ?? '', id: currentWorkspace.id ?? '' });
    }
    return hierarchy;
  };

  const workspaceHierarchy = useMemo(
    () => (workspaces.length > 0 && workspaceId ? buildWorkspacesHierarchy(workspaces, workspaceId) : []),
    [workspaces, workspaceId],
  );

  const hasAssets = useMemo(() => {
    return workspaces.filter((ws) => ws.parent_id === workspaceId).length > 0;
  }, [workspaces, workspaceId]);

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    const selectedTabKey = Object.keys(WORKSPACE_TABS).find(
      (tab): tab is keyof typeof WORKSPACE_TABS => WORKSPACE_TABS[tab as keyof typeof WORKSPACE_TABS] === key,
    );
    if (selectedTabKey && selectedTabKey !== activeTabString) {
      setSearchParams({ activeTab: selectedTabKey });
    }
  };

  const handleRoleAssignmentTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    const selectedTabKey = Object.keys(ROLE_ASSIGNMENT_TABS).find(
      (tab): tab is keyof typeof ROLE_ASSIGNMENT_TABS => ROLE_ASSIGNMENT_TABS[tab as keyof typeof ROLE_ASSIGNMENT_TABS] === key,
    );
    if (selectedTabKey && selectedTabKey !== activeRoleAssignmentTabString) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('roleAssignmentTab', selectedTabKey);
      setSearchParams(newParams);
    }
  };

  const currentWorkspace = selectedWorkspace ? { id: selectedWorkspace.id ?? '', name: selectedWorkspace.name ?? '' } : undefined;

  // Kessel view-permission guard — deny only once permissions are fully resolved.
  // During 'settling', permissions default to all-false; redirecting then would be
  // a false positive for users who actually have view access.
  const currentPermissions = selectedWorkspace?.permissions ?? EMPTY_PERMISSIONS;
  if (status === 'ready' && selectedWorkspace && !currentPermissions.view) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <WorkspaceHeader
        workspace={selectedWorkspace ?? null}
        isLoading={isLoading}
        workspaceHierarchy={workspaceHierarchy}
        hasAssets={hasAssets}
        permissions={currentPermissions}
        onGrantAccess={() => {
          setSearchParams({ activeTab: 'roles', roleAssignmentTab: 'roles-assigned-in-workspace' });
          setIsGrantAccessOpen(true);
        }}
      />
      <Divider />
      <Tabs
        className="pf-v6-u-background-color-100"
        activeKey={WORKSPACE_TABS[activeTabString as keyof typeof WORKSPACE_TABS]}
        onSelect={handleTabSelect}
        inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
        role="region"
      >
        {enableRoles && (
          <Tab
            eventKey={WORKSPACE_TABS.roles}
            title={intl.formatMessage(messages.roleAssignments)}
            tabContentId="rolesTab"
            tabContentRef={rolesRef}
            ouiaId="roles-tab-button"
          />
        )}
        <Tab
          eventKey={WORKSPACE_TABS.assets}
          title={intl.formatMessage(messages.assets)}
          tabContentId="assetsTab"
          tabContentRef={assetsRef}
          ouiaId="assets-tab-button"
        />
      </Tabs>
      <PageSection hasBodyWrapper={false} isFilled={activeTabString !== 'assets'}>
        {activeTabString === 'assets' ? (
          <AssetsCards workspaceName={selectedWorkspace?.name || ''} />
        ) : (
          enableRoles && (
            <>
              <Tabs
                activeKey={ROLE_ASSIGNMENT_TABS[activeRoleAssignmentTabString as keyof typeof ROLE_ASSIGNMENT_TABS]}
                onSelect={handleRoleAssignmentTabSelect}
                inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
                className="pf-v6-u-background-color-100"
              >
                <Tab
                  eventKey={ROLE_ASSIGNMENT_TABS['roles-assigned-in-workspace']}
                  title={intl.formatMessage(messages.rolesAssignedInThisWorkspace)}
                  tabContentId="rolesAssignedInWorkspaceTab"
                />
                <Tab
                  eventKey={ROLE_ASSIGNMENT_TABS['roles-assigned-in-parent-workspaces']}
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
              {activeRoleAssignmentTabString === 'roles-assigned-in-workspace' ? (
                <BaseGroupAssignmentsTable
                  key="current-workspace-roles"
                  groups={roleBindings}
                  isLoading={roleBindingsIsLoading}
                  workspaceName={selectedWorkspace?.name || ''}
                  currentWorkspace={currentWorkspace}
                  ouiaId="current-role-assignments-table"
                  isGrantAccessWizardOpen={isGrantAccessOpen}
                  onGrantAccessWizardToggle={setIsGrantAccessOpen}
                />
              ) : (
                <>
                  <Content component={ContentVariants.p} className="pf-v6-u-py-md pf-v6-u-color-200">
                    {intl.formatMessage(messages.parentWorkspacesInstructionalText, {
                      b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
                    })}
                  </Content>
                  <InheritedGroupAssignmentsTable
                    key="parent-workspace-roles"
                    groups={parentGroups}
                    isLoading={parentGroupsIsLoading}
                    currentWorkspace={currentWorkspace}
                    ouiaId="parent-role-assignments-table"
                  />
                </>
              )}
            </>
          )
        )}
      </PageSection>
      <Outlet />
    </>
  );
};

export default WorkspaceDetail;
