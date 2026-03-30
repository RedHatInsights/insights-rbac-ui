import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { getSkeletonCount } from '../../../../test-utils/interactionHelpers';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceHeader } from './WorkspaceHeader';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { WorkspacesWorkspace } from '../../../data/queries/workspaces';
import type { WorkspaceActionCallbacks } from './useWorkspaceActionItems';
import messages from '../../../../locales/data.json';
import { locale } from '../../../../locales/locale';

const NOOP_CALLBACKS: WorkspaceActionCallbacks = {
  onEdit: () => {},
  onGrantAccess: () => {},
  onMove: () => {},
  onDelete: () => {},
};

// Mock workspace data
const mockWorkspace: WorkspacesWorkspace = {
  id: 'workspace-1',
  name: 'Production Environment',
  description: 'Main production workspace for critical services and applications',
  type: 'root',
  parent_id: '',
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
};

const mockChildWorkspace: WorkspacesWorkspace = {
  id: 'workspace-2',
  name: 'Web Services',
  description: 'Frontend web applications and API services',
  type: 'standard',
  parent_id: 'workspace-1',
  created: '2024-01-02T00:00:00Z',
  modified: '2024-01-02T00:00:00Z',
};

// Mock hierarchy data (from root to current)
const mockHierarchy = [
  { name: 'Production Environment', id: 'workspace-1', canView: true },
  { name: 'Web Services', id: 'workspace-2', canView: true },
];

const mockSingleWorkspaceHierarchy = [{ name: 'Production Environment', id: 'workspace-1', canView: true }];

// Story decorator to provide necessary context
const withProviders = (Story: React.ComponentType, context: { parameters?: { route?: string } }) => {
  const route = context.parameters?.route || '/iam/access-management/workspaces/detail/workspace-1';
  return (
    <MemoryRouter initialEntries={[route]}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        <div style={{ minHeight: '300px', padding: '16px' }}>
          <Routes>
            <Route path="/iam/access-management/workspaces/detail/:workspaceId" element={<Story />} />
            <Route path="*" element={<Story />} />
          </Routes>
        </div>
      </IntlProvider>
    </MemoryRouter>
  );
};

const meta: Meta<typeof WorkspaceHeader> = {
  component: WorkspaceHeader,
  tags: ['autodocs'],
  decorators: [withProviders],
  parameters: {
    docs: {
      description: {
        component: `
**WorkspaceHeader** is a presentational component that displays workspace information in a consistent header format.

This component demonstrates:
- **Separation of Concerns**: Pure UI component with no business logic
- **Loading States**: Skeleton placeholders during data fetching
- **Conditional Rendering**: Actions menu only shown when workspace is available
- **Hierarchy Display**: Breadcrumb navigation showing workspace parent chain
- **Responsive Design**: Adapts to different screen sizes using PatternFly

### Key Features
- **Title & Description**: Displays workspace name and description with loading skeletons
- **Breadcrumb Navigation**: Shows hierarchy path from root to current workspace
- **Action Menu**: Workspace-specific actions (edit, move, delete) when available
- **Loading States**: Graceful skeleton loading indicators
        `,
      },
    },
  },
  argTypes: {
    workspace: {
      description: 'The workspace object to display',
      control: { type: 'object' },
    },
    isLoading: {
      description: 'Whether workspace data is currently loading',
      control: { type: 'boolean' },
    },
    workspaceHierarchy: {
      description: 'Array of workspace objects representing the breadcrumb path',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    workspace: mockWorkspace,
    isLoading: false,
    workspaceHierarchy: mockSingleWorkspaceHierarchy,
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default workspace header showing a root workspace with actions menu.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default header', async () => {
      const titleElements = canvas.getAllByText('Production Environment');
      await expect(titleElements.length).toBe(3);

      await expect(canvas.findByText('Main production workspace for critical services and applications')).resolves.toBeInTheDocument();

      const actionButton = await canvas.findByRole('button', { name: /workspace actions|actions|menu/i });
      await expect(actionButton).toBeInTheDocument();
    });
  },
};

export const WithHierarchy: Story = {
  args: {
    workspace: mockChildWorkspace,
    isLoading: false,
    workspaceHierarchy: mockHierarchy,
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Workspace header showing a child workspace with multi-level breadcrumb hierarchy.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify child workspace information (title, page breadcrumb, hierarchy breadcrumb)
    const webServicesElements = canvas.getAllByText('Web Services');
    await expect(webServicesElements.length).toBe(3);

    await expect(canvas.findByText('Frontend web applications and API services')).resolves.toBeInTheDocument();

    // Verify hierarchical breadcrumb shows parent workspace
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  args: {
    workspace: null,
    isLoading: true,
    workspaceHierarchy: [],
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with skeleton placeholders for title and description.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify skeleton loading indicators are present
    await waitFor(
      () => {
        expect(getSkeletonCount(canvasElement)).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Verify actual content is not shown
    await expect(canvas.queryByText('Production Environment')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Main production workspace')).not.toBeInTheDocument();
  },
};

export const NoAssets: Story = {
  args: {
    workspace: {
      ...mockWorkspace,
      name: 'Empty Workspace',
      description: 'A workspace with no child assets or workspaces',
    },
    isLoading: false,
    workspaceHierarchy: [{ name: 'Empty Workspace', id: 'workspace-empty', canView: true }],
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Workspace header for a workspace without any child assets, affecting available actions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify workspace content (title, page breadcrumb, hierarchy breadcrumb)
    const emptyWorkspaceElements = canvas.getAllByText('Empty Workspace');
    await expect(emptyWorkspaceElements.length).toBe(3);

    await expect(canvas.findByText('A workspace with no child assets or workspaces')).resolves.toBeInTheDocument();

    // Actions menu should still be present but behavior may differ
    const actionButton = await canvas.findByRole('button', { name: /workspace actions|actions|menu/i });
    await expect(actionButton).toBeInTheDocument();
  },
};

export const LongContent: Story = {
  args: {
    workspace: {
      ...mockWorkspace,
      name: 'Very Long Workspace Name That Should Test Text Wrapping Behavior',
      description:
        'This is a very long description that should test how the component handles extended text content and whether it wraps properly or truncates in a user-friendly manner.',
    },
    isLoading: false,
    workspaceHierarchy: [
      { name: 'Root', id: 'root-1', canView: true },
      { name: 'Level 1 Parent', id: 'level-1', canView: true },
      { name: 'Level 2 Parent', id: 'level-2', canView: true },
      { name: 'Very Long Workspace Name That Should Test Text Wrapping Behavior', id: 'current', canView: true },
    ],
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests the header with long content to verify text wrapping and responsive behavior.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify long content is displayed (title, page breadcrumb, hierarchy breadcrumb)
    const longNameElements = canvas.getAllByText('Very Long Workspace Name That Should Test Text Wrapping Behavior');
    await expect(longNameElements.length).toBe(3);

    await expect(canvas.findByText(/This is a very long description/)).resolves.toBeInTheDocument();

    // Verify deep hierarchy breadcrumb
    await expect(canvas.findByText('Root')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Level 1 Parent')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Level 2 Parent')).resolves.toBeInTheDocument();
  },
};

export const ActionsInteraction: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests that the workspace actions button is present and clickable.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the workspace actions button
    const actionsButton = await canvas.findByRole('button', { name: /workspace actions|actions|menu/i });
    await expect(actionsButton).toBeInTheDocument();

    // Verify it's clickable (the actual dropdown functionality is tested in WorkspaceActions stories)
    await userEvent.click(actionsButton);

    // Verify button is still present after clicking
    await expect(actionsButton).toBeInTheDocument();
  },
};

export const WithChildContextAlert: Story = {
  args: {
    workspace: mockWorkspace,
    isLoading: false,
    workspaceHierarchy: mockSingleWorkspaceHierarchy,
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-1?fromChildId=workspace-2&fromChildName=Web%20Services',
    docs: {
      description: {
        story:
          'Workspace header showing context alert when navigated from a child workspace. Tests the URL parameter handling for fromChildId and fromChildName.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify child context alert', async () => {
      const titleElements = canvas.getAllByText('Production Environment');
      await expect(titleElements.length).toBeGreaterThanOrEqual(2);

      const alertMessage = await canvas.findByText(/You are viewing role bindings inherited by Web Services from Production Environment/i);
      await expect(alertMessage).toBeInTheDocument();

      const alert = alertMessage.closest('[role="alert"]');
      await expect(alert).toBeInTheDocument();
    });
  },
};

/**
 * Tests that breadcrumb items without `canView` permission render as plain text,
 * not as links. Root workspace (canView: false) should not be clickable.
 */
export const BreadcrumbPermissionGating: Story = {
  args: {
    workspace: mockChildWorkspace,
    isLoading: false,
    workspaceHierarchy: [
      { name: 'Production Environment', id: 'workspace-1', canView: false },
      { name: 'Web Services', id: 'workspace-2', canView: true },
    ],
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests that parent workspaces without view permission render as plain text instead of links in the hierarchy breadcrumb.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify non-viewable parent is plain text, not a link', async () => {
      const prodEnvElements = canvas.getAllByText('Production Environment');
      const hierarchyProdEnv = prodEnvElements.find((el) => el.closest('.pf-v6-c-breadcrumb__item'));
      await expect(hierarchyProdEnv).toBeTruthy();
      await expect(hierarchyProdEnv?.closest('a')).toBeNull();
    });
  },
};

export const WithoutChildContext: Story = {
  args: {
    workspace: mockWorkspace,
    isLoading: false,
    workspaceHierarchy: mockSingleWorkspaceHierarchy,
    actionCallbacks: NOOP_CALLBACKS,
  },
  parameters: {
    route: '/iam/access-management/workspaces/detail/workspace-1',
    docs: {
      description: {
        story: 'Workspace header without child context parameters - should not show the alert.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify workspace title is displayed (should appear multiple times: title and breadcrumb)
    const titleElements = canvas.getAllByText('Production Environment');
    await expect(titleElements.length).toBeGreaterThanOrEqual(2);

    // Verify workspace description is displayed
    await expect(canvas.findByText('Main production workspace for critical services and applications')).resolves.toBeInTheDocument();

    // Verify alert is NOT displayed when there are no child context parameters
    const alert = canvas.queryByRole('alert');
    await expect(alert).not.toBeInTheDocument();
  },
};
