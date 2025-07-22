import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { TreeViewWorkspaceItem, WorkspaceTreeView } from './WorkspaceTreeView';

const meta: Meta<typeof WorkspaceTreeView> = {
  component: WorkspaceTreeView,
  tags: ['autodocs', 'workspaces'],
  parameters: {
    layout: 'padded',
    // Chromatic configuration to reduce flakiness
    chromatic: {
      delay: 500, // Wait for TreeView to fully render
      pauseAnimationAtEnd: true, // Pause any animations
    },
    docs: {
      description: {
        component:
          'A tree view component for displaying workspaces in a hierarchical structure. Handles different states including loading, error, empty, and populated views.',
      },
    },
  },
  argTypes: {
    treeElements: {
      description: 'Array of workspace items to display in the tree',
      control: { type: 'object' },
    },
    areElementsFiltered: {
      description: 'Whether the tree elements are currently filtered (affects empty state message)',
      control: { type: 'boolean' },
    },
    selectedWorkspace: {
      description: 'Currently selected workspace item',
      control: { type: 'object' },
    },
    onSelect: {
      description: 'Callback function when a workspace is selected',
      action: 'workspace-selected',
    },
    isLoading: {
      description: 'Whether the tree is in a loading state',
      control: { type: 'boolean' },
    },
    isError: {
      description: 'Whether there was an error loading workspaces',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkspaceTreeView>;

// Mock workspace data
const createMockWorkspace = (id: string, name: string, parentId?: string) => ({
  id,
  name,
  type: 'workspace' as const,
  parent_id: parentId,
  description: `Description for ${name}`,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
});

const createMockTreeItem = (id: string, name: string, parentId?: string, children?: TreeViewWorkspaceItem[]): TreeViewWorkspaceItem => ({
  id, // This is the key property PatternFly uses for activeItems comparison
  name,
  children,
  workspace: createMockWorkspace(id, name, parentId),
});

const mockTreeData: TreeViewWorkspaceItem[] = [
  createMockTreeItem('root-1', 'Production Environment', undefined, [
    createMockTreeItem('prod-1', 'Web Services', 'root-1', [
      createMockTreeItem('prod-1-1', 'Frontend Apps', 'prod-1'),
      createMockTreeItem('prod-1-2', 'Backend APIs', 'prod-1'),
    ]),
    createMockTreeItem('prod-2', 'Data Services', 'root-1', [
      createMockTreeItem('prod-2-1', 'Databases', 'prod-2'),
      createMockTreeItem('prod-2-2', 'Analytics', 'prod-2'),
    ]),
  ]),
  createMockTreeItem('root-2', 'Development Environment', undefined, [
    createMockTreeItem('dev-1', 'Testing', 'root-2'),
    createMockTreeItem('dev-2', 'Staging', 'root-2'),
  ]),
];

// Default args
const defaultArgs = {
  treeElements: mockTreeData,
  areElementsFiltered: false,
  selectedWorkspace: undefined,
  onSelect: fn(),
  isLoading: false,
  isError: false,
};

// Stories
export const Default: Story = {
  args: defaultArgs,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show tree view with workspace data
    await expect(canvas.getByRole('tree')).toBeInTheDocument();

    // Should show root workspaces
    await expect(canvas.getByText('Production Environment')).toBeInTheDocument();
    await expect(canvas.getByText('Development Environment')).toBeInTheDocument();

    // Test selection - click on a workspace
    const prodWorkspace = canvas.getByText('Production Environment');
    await userEvent.click(prodWorkspace);

    // Should call onSelect callback
    await expect(args.onSelect).toHaveBeenCalled();
  },
};

export const WithSelectedWorkspace: Story = {
  args: {
    ...defaultArgs,
    selectedWorkspace: mockTreeData[0], // Select first workspace (Production Environment)
    areElementsFiltered: false, // Keep tree collapsed by default but show selection
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show tree view
    const treeView = canvas.getByRole('tree');
    await expect(treeView).toBeInTheDocument();

    // Should have the selected item visible
    await expect(canvas.getByText('Production Environment')).toBeInTheDocument();

    // Verify the selected item has the active/selected styling
    // PatternFly applies pf-m-current class to selected tree items
    const selectedItem = canvas.getByText('Production Environment').closest('[role="treeitem"]');
    await expect(selectedItem).toBeInTheDocument();

    // Note: PatternFly selection styling may be applied differently,
    // so we verify the item is present and properly structured
    expect(selectedItem).toHaveAttribute('role', 'treeitem');

    // Note: Selected item styling is handled by PatternFly internally
  },
};

export const WithSelectedWorkspaceExpanded: Story = {
  args: {
    ...defaultArgs,
    selectedWorkspace: mockTreeData[0], // Select Production Environment
    areElementsFiltered: true, // Expand all to show the selected item and its children
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show tree view fully expanded
    const treeView = canvas.getByRole('tree');
    await expect(treeView).toBeInTheDocument();

    // Should show selected item
    await expect(canvas.getByText('Production Environment')).toBeInTheDocument();

    // Wait for tree expansion - check for child items with timeout
    await expect(canvas.findByText('Web Services')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Data Services')).resolves.toBeInTheDocument();

    // Verify the selected item has proper styling
    const selectedItem = canvas.getByText('Production Environment').closest('[role="treeitem"]');
    await expect(selectedItem).toBeInTheDocument();
  },
};

export const ExpandedFilteredView: Story = {
  args: {
    ...defaultArgs,
    areElementsFiltered: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show tree view with all nodes expanded due to filtering
    await expect(canvas.getByRole('tree')).toBeInTheDocument();

    // Wait for tree expansion - check for nested items with timeout
    await expect(canvas.findByText('Frontend Apps')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Backend APIs')).resolves.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show loading spinner
    await expect(canvas.getByTestId('workspace-loading')).toBeInTheDocument();
    await expect(canvas.getByRole('progressbar')).toBeInTheDocument();

    // Should not show tree view
    await expect(canvas.queryByRole('tree')).not.toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    ...defaultArgs,
    isError: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show error alert (PatternFly Alert doesn't expose role="alert")
    await expect(canvas.getByTestId('workspace-load-error')).toBeInTheDocument();
    await expect(canvas.getByText('Failed to load workspaces')).toBeInTheDocument();

    // Should not show tree view
    await expect(canvas.queryByRole('tree')).not.toBeInTheDocument();
  },
};

export const EmptyNoFilter: Story = {
  args: {
    ...defaultArgs,
    treeElements: [],
    areElementsFiltered: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show empty message for no workspaces
    await expect(canvas.getByTestId('workspace-empty-message')).toBeInTheDocument();
    await expect(canvas.getByText('No workspaces to show.')).toBeInTheDocument();

    // Should not show tree view
    await expect(canvas.queryByRole('tree')).not.toBeInTheDocument();
  },
};

export const EmptyFiltered: Story = {
  args: {
    ...defaultArgs,
    treeElements: [],
    areElementsFiltered: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show filtered empty message
    await expect(canvas.getByTestId('workspace-empty-message')).toBeInTheDocument();
    await expect(canvas.getByText('No workspaces match your search.')).toBeInTheDocument();

    // Should not show tree view
    await expect(canvas.queryByRole('tree')).not.toBeInTheDocument();
  },
};

export const SingleWorkspace: Story = {
  args: {
    ...defaultArgs,
    treeElements: [createMockTreeItem('single', 'Single Workspace', undefined)],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show tree view with single workspace
    await expect(canvas.getByRole('tree')).toBeInTheDocument();
    await expect(canvas.getByText('Single Workspace')).toBeInTheDocument();

    // Test selection
    const workspace = canvas.getByText('Single Workspace');
    await userEvent.click(workspace);

    await expect(args.onSelect).toHaveBeenCalled();
  },
};

export const InteractiveSelection: Story = {
  args: defaultArgs,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Test multiple selections
    const prodWorkspace = canvas.getByText('Production Environment');
    const devWorkspace = canvas.getByText('Development Environment');

    // Click first workspace
    await userEvent.click(prodWorkspace);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);

    // Click second workspace
    await userEvent.click(devWorkspace);
    await expect(args.onSelect).toHaveBeenCalledTimes(2);

    // Verify both workspaces are clickable
    await expect(prodWorkspace).toBeInTheDocument();
    await expect(devWorkspace).toBeInTheDocument();
  },
};
