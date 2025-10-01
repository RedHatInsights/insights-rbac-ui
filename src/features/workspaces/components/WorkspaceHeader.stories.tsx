import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceHeader } from './WorkspaceHeader';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import { Workspace } from '../../../redux/workspaces/reducer';

// Mock workspace data
const mockWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'Production Environment',
  description: 'Main production workspace for critical services and applications',
  type: 'root',
  parent_id: '',
};

const mockChildWorkspace: Workspace = {
  id: 'workspace-2',
  name: 'Web Services',
  description: 'Frontend web applications and API services',
  type: 'standard',
  parent_id: 'workspace-1',
};

// Mock hierarchy data (from root to current)
const mockHierarchy = [
  { name: 'Production Environment', id: 'workspace-1' },
  { name: 'Web Services', id: 'workspace-2' },
];

const mockSingleWorkspaceHierarchy = [{ name: 'Production Environment', id: 'workspace-1' }];

// Story decorator to provide necessary context
const withProviders = (Story: any) => {
  return (
    <BrowserRouter>
      <IntlProvider locale="en" messages={{}}>
        <div style={{ minHeight: '300px', padding: '16px' }}>
          <Story />
        </div>
      </IntlProvider>
    </BrowserRouter>
  );
};

const meta: Meta<typeof WorkspaceHeader> = {
  component: WorkspaceHeader,
  tags: ['autodocs', 'workspaces', 'workspace-header'],
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
    hasAssets: {
      description: 'Whether the workspace has child assets/workspaces',
      control: { type: 'boolean' },
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
    hasAssets: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default workspace header showing a root workspace with actions menu.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify workspace title is displayed (should appear in title and breadcrumb)
    const titleElements = canvas.getAllByText('Production Environment');
    await expect(titleElements.length).toBe(2); // Once in title, once in breadcrumb

    // Verify description is displayed
    await expect(canvas.findByText('Main production workspace for critical services and applications')).resolves.toBeInTheDocument();

    // Verify action menu is present (kebab menu button)
    const actionButton = await canvas.findByRole('button', { name: /workspace actions|actions|menu/i });
    await expect(actionButton).toBeInTheDocument();
  },
};

export const WithHierarchy: Story = {
  args: {
    workspace: mockChildWorkspace,
    isLoading: false,
    workspaceHierarchy: mockHierarchy,
    hasAssets: false,
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

    // Verify child workspace information (title and breadcrumb)
    const webServicesElements = canvas.getAllByText('Web Services');
    await expect(webServicesElements.length).toBe(2); // Once in title, once in breadcrumb

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
    hasAssets: false,
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
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
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
    workspaceHierarchy: [{ name: 'Empty Workspace', id: 'workspace-empty' }],
    hasAssets: false,
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

    // Verify workspace content (appears in title and breadcrumb)
    const emptyWorkspaceElements = canvas.getAllByText('Empty Workspace');
    await expect(emptyWorkspaceElements.length).toBe(2);

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
      { name: 'Root', id: 'root-1' },
      { name: 'Level 1 Parent', id: 'level-1' },
      { name: 'Level 2 Parent', id: 'level-2' },
      { name: 'Very Long Workspace Name That Should Test Text Wrapping Behavior', id: 'current' },
    ],
    hasAssets: true,
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

    // Verify long content is displayed (appears in title and breadcrumb)
    const longNameElements = canvas.getAllByText('Very Long Workspace Name That Should Test Text Wrapping Behavior');
    await expect(longNameElements.length).toBe(2);

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
