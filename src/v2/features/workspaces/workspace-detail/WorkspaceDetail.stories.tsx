import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceDetail } from './WorkspaceDetail';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { waitForSkeletonToDisappear } from '../workspaceTestHelpers';
import { workspacesHandlers, workspacesLoadingHandlers } from '../../../data/mocks/workspaces.handlers';
import { groupsHandlers, groupsLoadingHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { roleBindingsBySubjectDynamicHandlers, roleBindingsLoadingHandlers } from '../../../data/mocks/roleBindings.handlers';
import { staticAssetsHandlers } from '../../../../shared/data/mocks/staticAssets.handlers';

// Mock workspace data for factory (WorkspacesWorkspace format)
const mockWorkspaces = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace for critical services',
    type: 'root' as const,
    parent_id: undefined,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Web Services',
    description: 'Frontend web applications and services',
    type: 'standard' as const,
    parent_id: 'workspace-1',
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'workspace-3',
    name: 'API Services',
    description: 'Backend API and microservices',
    type: 'standard' as const,
    parent_id: 'workspace-1',
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
  {
    id: 'workspace-4',
    name: 'Development Environment',
    description: 'Development and testing workspace',
    type: 'root' as const,
    parent_id: undefined,
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

// Role bindings by-subject response for workspace-2 (Web Services)
const mockRoleBindingsResponse = {
  data: [
    {
      last_modified: '2024-08-24T15:45:00Z',
      subject: {
        id: 'group-1',
        type: 'group',
        group: {
          name: 'Platform Team',
          description: 'Core platform development team',
          user_count: 8,
        },
      },
      roles: [{ id: 'role-1', name: 'Workspace Administrator' }],
      resource: {
        id: 'workspace-2',
        name: 'Web Services',
        type: 'workspace',
      },
    },
    {
      last_modified: '2024-08-23T10:00:00Z',
      subject: {
        id: 'group-2',
        type: 'group',
        group: {
          name: 'QE Team',
          description: 'Quality engineering and testing team',
          user_count: 5,
        },
      },
      roles: [{ id: 'role-2', name: 'Workspace Viewer' }],
      resource: {
        id: 'workspace-2',
        name: 'Web Services',
        type: 'workspace',
      },
    },
  ],
  meta: { count: 2, limit: 20, offset: 0 },
};

// Mock groups data for role assignments
const mockGroups = [
  {
    uuid: 'group-1',
    name: 'Platform Team',
    description: 'Core platform development team',
    principalCount: 8,
    roleCount: 3,
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-15T10:00:00.000Z',
    modified: '2024-01-20T14:30:00.000Z',
  },
  {
    uuid: 'group-2',
    name: 'QE Team',
    description: 'Quality engineering and testing team',
    principalCount: 5,
    roleCount: 2,
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-10T09:00:00.000Z',
    modified: '2024-01-18T16:45:00.000Z',
  },
];

// Simple router wrapper - all other providers come from global .storybook/preview.tsx
const withRouter = (Story: React.ComponentType, context: { parameters?: { route?: string } }) => {
  const route = context.parameters?.route || '/iam/access-management/workspaces/detail/workspace-2';

  return (
    <MemoryRouter initialEntries={[route]}>
      <div style={{ minHeight: '600px' }}>
        <Routes>
          <Route path="/iam/access-management/workspaces/detail/:workspaceId" element={<Story />} />
        </Routes>
      </div>
    </MemoryRouter>
  );
};

// MSW handlers for API mocking
const workspaceDetailHandlers = [
  ...workspacesHandlers(mockWorkspaces),
  ...groupsHandlers(mockGroups),
  ...roleBindingsBySubjectDynamicHandlers(({ resourceId, excludeSources }) => {
    const baseData = mockRoleBindingsResponse.data.map((item) => ({
      ...item,
      resource: { ...item.resource, id: resourceId || 'workspace-2' },
      ...(excludeSources === 'direct' ? { sources: [{ id: 'workspace-1', name: 'Production Environment', type: 'workspace' }] } : {}),
    }));
    return { data: baseData, meta: { limit: 20 }, links: { next: null, previous: null } };
  }),
  ...staticAssetsHandlers(),
];

const meta: Meta<typeof WorkspaceDetail> = {
  component: WorkspaceDetail,
  tags: ['ff:platform.rbac.workspaces-role-bindings'],
  decorators: [withRouter],
  parameters: {
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: workspaceDetailHandlers,
    },
    workspacePermissions: {
      view: ['workspace-1', 'workspace-2', 'workspace-3', 'workspace-4'],
      edit: ['workspace-1', 'workspace-2', 'workspace-3', 'workspace-4'],
      delete: ['workspace-2', 'workspace-3', 'workspace-4'],
      create: ['workspace-1', 'workspace-2', 'workspace-3', 'workspace-4'],
      move: ['workspace-2', 'workspace-3', 'workspace-4'],
    },
    docs: {
      description: {
        component: `
**WorkspaceDetail** is a feature component that provides a comprehensive interface for viewing and managing workspace details.

This component demonstrates:
- **Feature Composition**: Combines header, tabs, and conditional content based on feature flags
- **Data Integration**: Manages workspace and groups data from multiple queries
- **Routing Integration**: Handles URL parameters and navigation state
- **Feature Flag Logic**: Conditionally shows role assignments based on platform.rbac.workspaces-role-bindings
- **Data Loading**: Coordinates multiple async data fetching operations
- **Tab State Management**: Manages active tab state with URL synchronization

### Key Features
- **Workspace Header**: Shows workspace info, hierarchy breadcrumb, and actions
- **Tabbed Interface**: Switches between Assets and Role Assignments (if enabled)
- **Role Assignments**: Shows groups with role assignments (feature flag controlled)
- **Assets Management**: Displays workspace assets and sub-workspaces
- **URL State**: Maintains active tab state in URL parameters

### Design References

<img src="/mocks/workspaces/Workspace details.png" alt="Workspace detail page" width="400" />
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2?activeTab=assets',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': false,
    },
    docs: {
      description: {
        story: `
**Default View**: Complete workspace detail container with React Query integration. Shows Assets tab with feature flags coordination and full workspace management interface.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[WithRolesEnabled](?path=/story/features-workspaces-workspace-detail-workspacedetail--with-roles-enabled)**: Tests container with role assignments feature flag enabled
- **[TabSwitching](?path=/story/features-workspaces-workspace-detail-workspacedetail--tab-switching)**: Tests container tab navigation and state management  
- **[LoadingState](?path=/story/features-workspaces-workspace-detail-workspacedetail--loading-state)**: Tests container behavior during data loading
- **[RootWorkspace](?path=/story/features-workspaces-workspace-detail-workspacedetail--root-workspace)**: Tests container handling of root workspace scenarios
- **[EmptyGroupsState](?path=/story/features-workspaces-workspace-detail-workspacedetail--empty-groups-state)**: Tests container response to empty groups data
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default workspace detail', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await expect(canvas.findByText('Workspace hierarchy:')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
      await expect(canvas.queryByText('Role assignments')).not.toBeInTheDocument();

      const webServicesElements = canvas.getAllByText('Web Services');
      await expect(webServicesElements.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const WithRolesEnabled: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2?activeTab=roles',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    docs: {
      description: {
        story: 'View with role assignments feature enabled, showing both Assets and Role assignments tabs.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify with roles enabled', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await expect(canvas.findByText('Role assignments')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

      const webServicesElements = canvas.getAllByText('Web Services');
      await expect(webServicesElements.length).toBeGreaterThanOrEqual(1);
    });
  },
};

export const TabSwitching: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2?activeTab=assets',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    docs: {
      description: {
        story: 'Tests tab switching functionality between Assets and Role assignments.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify tab switching', async () => {
      const assetsTab = await canvas.findByText('Assets');
      const rolesTab = await canvas.findByText('Role assignments');

      await expect(assetsTab).toBeInTheDocument();
      await expect(rolesTab).toBeInTheDocument();

      await userEvent.click(rolesTab);

      await userEvent.click(assetsTab);
    });
  },
};

export const LoadingState: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    msw: {
      handlers: [...workspacesLoadingHandlers(), ...groupsLoadingHandlers(), ...roleBindingsLoadingHandlers(), ...staticAssetsHandlers()],
    },
    docs: {
      description: {
        story:
          'Loading state while workspace and groups data is being fetched from slow APIs. Shows skeleton loading indicators while preserving page structure.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify skeleton loading state', async () => {
      await waitFor(
        async () => {
          const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
          await expect(skeletonElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 },
      );
    });

    await step('Verify tabs render during loading', async () => {
      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
    });

    await step('Verify skeletons instead of content', async () => {
      await expect(canvas.queryByText('Web Services')).not.toBeInTheDocument();
      await expect(canvas.queryByText('Frontend web applications and services')).not.toBeInTheDocument();
    });
  },
};

export const RootWorkspace: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-1?activeTab=assets',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': false,
    },
    docs: {
      description: {
        story: 'Root workspace view with no parent hierarchy and child workspaces as assets.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify root workspace', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();

      await expect(canvas.queryByText('Role assignments')).not.toBeInTheDocument();

      const prodElements = await canvas.findAllByText('Production Environment');
      await expect(prodElements).toHaveLength(3);
      await expect(canvas.queryByText('Web Services')).not.toBeInTheDocument();
    });
  },
};

export const EmptyGroupsState: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2?activeTab=roles',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    docs: {
      description: {
        story: 'Role assignments tab with no groups assigned to the workspace.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty groups state', async () => {
      await expect(canvas.findByText('Role assignments')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
    });
  },
};

export const RoleAssignmentTabSwitching: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2?activeTab=roles&roleAssignmentTab=roles-assigned-in-workspace',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    docs: {
      description: {
        story: 'Tests switching between "Roles assigned in this workspace" and "Roles assigned in parent workspaces" tabs.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify role assignment tab switching', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      const thisWorkspaceTab = await canvas.findByText('Roles assigned in this workspace');
      const parentWorkspacesTab = await canvas.findByText('Roles assigned in parent workspaces');

      await expect(thisWorkspaceTab).toBeInTheDocument();
      await expect(parentWorkspacesTab).toBeInTheDocument();

      await userEvent.click(parentWorkspacesTab);

      await userEvent.click(thisWorkspaceTab);

      await expect(canvas.findByText('Platform Team')).resolves.toBeInTheDocument();
    });
  },
};

export const ParentRoleBindingsWithInheritance: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2?activeTab=roles&roleAssignmentTab=roles-assigned-in-parent-workspaces',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    docs: {
      description: {
        story:
          'Tests the "Roles assigned in parent workspaces" tab showing inherited role bindings with instructional text, info popover, and inheritance information.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify parent role bindings with inheritance', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await expect(canvas.findByText('Roles assigned in parent workspaces')).resolves.toBeInTheDocument();

      await expect(canvas.findByText(/click the workspace name/i)).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Platform Team')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('QE Team')).resolves.toBeInTheDocument();

      await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();

      await waitFor(async () => {
        const table = canvas.getByRole('grid');
        expect(table).toBeInTheDocument();
      });

      const productionEnvElements = canvas.getAllByText('Production Environment');
      expect(productionEnvElements.length).toBeGreaterThan(1);
    });
  },
};

/**
 * When the user has no `view` permission for a workspace, the detail page should
 * render an "Access denied" / "Unauthorized" state instead of the workspace content.
 *
 * PASSES: WorkspaceDetail.tsx renders UnauthorizedAccess when permissions.view is false.
 */
export const AccessDeniedWhenNoViewPermission: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2',
    workspacePermissions: {
      view: [],
      edit: [],
      delete: [],
      create: [],
      move: [],
    },
    msw: {
      handlers: workspaceDetailHandlers,
    },
    docs: {
      description: {
        story:
          'Tests that a user without `view` permission for a workspace sees an access-denied state. The view-permission guard in WorkspaceDetail renders UnauthorizedAccess when permissions.view is false.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify access denied', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await waitFor(async () => {
        const deniedHeading = canvas.queryByText(/do not have access/i);
        await expect(deniedHeading).toBeInTheDocument();
      });

      const wsName = canvas.queryByText('Web Services');
      await expect(wsName).not.toBeInTheDocument();
    });
  },
};
