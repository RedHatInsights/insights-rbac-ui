import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceDetail } from './WorkspaceDetail';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { waitForSkeletonToDisappear } from '../workspaceTestHelpers';

// Mock workspace data with hierarchy
const mockWorkspaces = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace for critical services',
    type: 'root',
    parent_id: '',
  },
  {
    id: 'workspace-2',
    name: 'Web Services',
    description: 'Frontend web applications and services',
    type: 'standard',
    parent_id: 'workspace-1',
  },
  {
    id: 'workspace-3',
    name: 'API Services',
    description: 'Backend API and microservices',
    type: 'standard',
    parent_id: 'workspace-1',
  },
  {
    id: 'workspace-4',
    name: 'Development Environment',
    description: 'Development and testing workspace',
    type: 'root',
    parent_id: '',
  },
];

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
const withRouter = (Story: any, context: any) => {
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
  http.get('/api/rbac/v2/workspaces/', () => {
    return HttpResponse.json({
      data: mockWorkspaces,
      meta: {
        count: mockWorkspaces.length,
        limit: 9007199254740991,
        offset: 0,
      },
    });
  }),
  http.get('/api/rbac/v2/workspaces/:workspaceId/', ({ params }) => {
    const workspace = mockWorkspaces.find((ws) => ws.id === params.workspaceId);
    if (workspace) {
      return HttpResponse.json(workspace);
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.get('/api/rbac/v2/groups/', () => {
    return HttpResponse.json({
      data: mockGroups,
      meta: {
        count: mockGroups.length,
        limit: 20,
        offset: 0,
      },
    });
  }),
  // Add v1 groups endpoint that the component is calling
  http.get('/api/rbac/v1/groups/', () => {
    return HttpResponse.json({
      data: mockGroups,
      meta: {
        count: mockGroups.length,
        limit: 20,
        offset: 0,
      },
    });
  }),
  // Add handlers for static assets
  http.get('/apps/frontend-assets/technology-icons/insights.svg', () => {
    return HttpResponse.text('<svg></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }),
  http.get('/apps/frontend-assets/technology-icons/openshift.svg', () => {
    return HttpResponse.text('<svg></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }),
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
    docs: {
      description: {
        component: `
**WorkspaceDetail** is a feature component that provides a comprehensive interface for viewing and managing workspace details.

This component demonstrates:
- **Feature Composition**: Combines header, tabs, and conditional content based on feature flags
- **Redux Integration**: Manages workspace and groups data from multiple reducers
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
**Default View**: Complete workspace detail container with Redux integration. Shows Assets tab with feature flags coordination and full workspace management interface.

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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Additional wait for async content to load after skeletons disappear
    // Ensure the hierarchy and workspace names are fully loaded
    await expect(canvas.findByText('Workspace hierarchy:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Container-specific: Verify tabs are rendered based on feature flags
    await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Role assignments')).not.toBeInTheDocument();

    // Handle multiple "Web Services" - get the one in the breadcrumb
    const webServicesElements = canvas.getAllByText('Web Services');
    await expect(webServicesElements.length).toBeGreaterThanOrEqual(1);
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Container-specific: Verify both tabs are present when feature flag is enabled
    await expect(canvas.findByText('Role assignments')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();

    // Container-specific: Verify hierarchy breadcrumb is built correctly
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Handle multiple "Web Services" - verify at least one exists
    const webServicesElements = canvas.getAllByText('Web Services');
    await expect(webServicesElements.length).toBeGreaterThanOrEqual(1);
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Container-specific: Test tab switching functionality
    const assetsTab = await canvas.findByText('Assets');
    const rolesTab = await canvas.findByText('Role assignments');

    await expect(assetsTab).toBeInTheDocument();
    await expect(rolesTab).toBeInTheDocument();

    // Click on Role assignments tab
    await userEvent.click(rolesTab);

    // Click back to Assets tab
    await userEvent.click(assetsTab);
  },
};

export const LoadingState: Story = {
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-2',
    featureFlags: {
      'platform.rbac.workspaces-role-bindings': true,
    },
    msw: {
      handlers: [
        // Simulate slow API responses to see loading states
        http.get('/api/rbac/v2/workspaces/', async () => {
          // Short delay (150 ms) keeps loading UI visible but speeds up tests
          await delay('infinite');
          return HttpResponse.json({
            data: mockWorkspaces,
            meta: {
              count: mockWorkspaces.length,
              limit: 9007199254740991,
              offset: 0,
            },
          });
        }),
        http.get('/api/rbac/v2/workspaces/:workspaceId/', async () => {
          await delay('infinite');
          return HttpResponse.json(mockWorkspaces[1]); // Web Services workspace
        }),
        http.get('/api/rbac/v1/groups/', async () => {
          await delay('infinite');
          return HttpResponse.json({
            data: mockGroups,
            meta: {
              count: mockGroups.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Loading state while workspace and groups data is being fetched from slow APIs. Shows skeleton loading indicators while preserving page structure.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Container-specific: Verify loading state shows skeleton elements (using CSS class since PatternFly doesn't use progressbar role)
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Container-specific: Tabs should still render during loading (structural consistency)
    await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();

    // Container-specific: Verify the component handles slow API responses gracefully
    // The workspace name/description should show skeletons instead of actual content
    await expect(canvas.queryByText('Web Services')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Frontend web applications and services')).not.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for skeletons to disappear to ensure data loaded
    await waitForSkeletonToDisappear(canvasElement);

    // Additional wait for content
    await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();

    // Container-specific: Root workspace should only show Assets tab
    await expect(canvas.queryByText('Role assignments')).not.toBeInTheDocument();

    // Container-specific: Root workspace breadcrumb should only show itself
    const prodElements = await canvas.findAllByText('Production Environment');
    await expect(prodElements).toHaveLength(2); // breadcrumb link and page title
    await expect(canvas.queryByText('Web Services')).not.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Container-specific: Verify both tabs present with feature flag enabled
    await expect(canvas.findByText('Role assignments')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Assets')).resolves.toBeInTheDocument();
  },
};
