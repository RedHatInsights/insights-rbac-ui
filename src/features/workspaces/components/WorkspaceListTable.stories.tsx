import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { WorkspaceListTable } from './WorkspaceListTable';
import { BrowserRouter } from 'react-router-dom';
// Import shared test functions and mock data from helper file
import {
  mockWorkspaces,
  testDefaultWorkspaceDisplay,
  testEmptyState,
  testErrorState,
  testLoadingState,
  waitForSkeletonToDisappear,
} from '../workspaceTestHelpers';

const defaultProps = {
  workspaces: mockWorkspaces,
  isLoading: false,
  error: '',
  onDeleteWorkspaces: fn(),
  onMoveWorkspace: fn(),
  // Default: user can edit and create workspaces
  canEdit: () => true,
  canCreateIn: () => true,
  canEditAny: true,
  canCreateTopLevel: true,
};

const meta: Meta<typeof WorkspaceListTable> = {
  component: WorkspaceListTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
WorkspaceListTable is a presentational component that displays workspace data in a hierarchical table format.
It receives all data as props and delegates actions to callback functions.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ minHeight: '600px' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof WorkspaceListTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultProps,
  parameters: {
    docs: {
      description: {
        story:
          'Displays the workspace table with hierarchical data. Shows root workspace as expandable with child workspaces nested underneath. Each workspace row includes name, description, and kebab menu with actions. Users should see all workspace data rendered correctly with functional action menus.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await testDefaultWorkspaceDisplay(canvasElement);
  },
};

export const LoadingState: Story = {
  args: {
    ...defaultProps,
    isLoading: true,
    workspaces: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows skeleton loading state while workspace data is being fetched. Users should see animated skeleton placeholders in place of workspace rows, indicating data is loading. The page header and toolbar remain visible.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await testLoadingState(canvasElement);
  },
};

export const EmptyState: Story = {
  args: {
    ...defaultProps,
    workspaces: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays empty state when no workspaces exist. Users should see a "No workspaces found" message with a prominent "Create workspace" button to encourage creating their first workspace. The page header remains visible but no table rows are shown.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await testEmptyState(canvasElement);
  },
};

export const ErrorState: Story = {
  args: {
    ...defaultProps,
    error: 'Failed to load workspaces',
    workspaces: [],
  },
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        story:
          'Shows error state when workspace data fails to load. Users should see an error message "Failed to load workspaces" instead of the normal page content. The error replaces the entire page layout to clearly indicate the problem.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await testErrorState(canvasElement);
  },
};

export const NoPermissions: Story = {
  args: {
    ...defaultProps,
    canEdit: () => false, // User cannot edit any workspace
    canCreateIn: () => false,
    canEditAny: false,
    canCreateTopLevel: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that users with read-only permissions see all action buttons disabled. Users should see workspace data normally, but when clicking kebab menus, all actions (Edit, Delete, Move) should be disabled/grayed out since they only have read access.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Verify workspaces are rendered first
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Target specific workspace row using data-ouia-component-id
    const productionRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-1"]') as HTMLElement;
    await expect(productionRow).toBeInTheDocument();

    const productionRowScope = within(productionRow);
    const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

    await userEvent.click(productionKebab);

    // Wait for menu to open and then check for disabled state
    const editButton = await within(document.body).findByText('Edit workspace');
    const deleteButton = await within(document.body).findByText('Delete workspace');
    const moveButton = await within(document.body).findByText('Move workspace');

    // All actions should be disabled due to insufficient permissions
    await expect(editButton.closest('button')).toHaveAttribute('disabled');
    await expect(deleteButton.closest('button')).toHaveAttribute('disabled');
    await expect(moveButton.closest('button')).toHaveAttribute('disabled');
  },
};

export const RestrictedPermissions: Story = {
  args: {
    ...defaultProps,
    canEdit: (workspaceId: string) => workspaceId === '1', // User can only edit workspace '1'
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests resource-scoped permissions where users can only modify specific workspaces. Users should see enabled actions for "Production Environment" (workspace ID 1) but disabled actions for "Development Environment" (workspace ID 2), demonstrating fine-grained access control.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Test workspace '1' (Production Environment) - should have enabled actions
    const productionRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-1"]') as HTMLElement;
    const productionRowScope = within(productionRow);
    const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

    await userEvent.click(productionKebab);

    const editButton = await within(document.body).findByText('Edit workspace');
    const deleteButton = await within(document.body).findByText('Delete workspace');
    const moveButton = await within(document.body).findByText('Move workspace');

    // Should be enabled for workspace '1' (standard type + has permission)
    await expect(editButton.closest('button')).not.toHaveAttribute('disabled');
    await expect(deleteButton.closest('button')).not.toHaveAttribute('disabled');
    await expect(moveButton.closest('button')).not.toHaveAttribute('disabled');

    // Close this menu and test workspace '2' (Development Environment)
    await userEvent.click(productionKebab); // Close menu

    const developmentRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-2"]') as HTMLElement;
    const developmentRowScope = within(developmentRow);
    const developmentKebab = developmentRowScope.getByLabelText('Kebab toggle');

    await userEvent.click(developmentKebab);

    const editButton2 = await within(document.body).findByText('Edit workspace');
    const deleteButton2 = await within(document.body).findByText('Delete workspace');
    const moveButton2 = await within(document.body).findByText('Move workspace');

    // Should be disabled for workspace '2' (no permission for this workspace)
    await expect(editButton2.closest('button')).toHaveAttribute('disabled');
    await expect(deleteButton2.closest('button')).toHaveAttribute('disabled');
    await expect(moveButton2.closest('button')).toHaveAttribute('disabled');
  },
};

export const RootWorkspaceRestrictions: Story = {
  args: {
    ...defaultProps,
    canEdit: () => true, // User has full permissions
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests workspace type restrictions where root workspaces cannot be modified regardless of user permissions. Users should see all actions disabled for the "Root Workspace" even with full permissions, demonstrating that business rules based on workspace type override user permissions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Test root workspace - should have limited actions regardless of permissions
    const rootRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-0"]') as HTMLElement;
    const rootRowScope = within(rootRow);
    const rootKebab = rootRowScope.getByLabelText('Kebab toggle');

    await userEvent.click(rootKebab);

    const editButton = await within(document.body).findByText('Edit workspace');
    const deleteButton = await within(document.body).findByText('Delete workspace');
    const moveButton = await within(document.body).findByText('Move workspace');

    // All actions should be disabled for root workspace (type 'root' not in allowed types)
    await expect(editButton.closest('button')).toHaveAttribute('disabled');
    await expect(deleteButton.closest('button')).toHaveAttribute('disabled');
    await expect(moveButton.closest('button')).toHaveAttribute('disabled');
  },
};

export const FullPermissions: Story = {
  args: {
    ...defaultProps,
    canEdit: () => true, // User has full permissions
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that users with full permissions can access all valid actions on standard workspaces. Users should see all actions (Edit, Delete, Move) enabled for "Production Environment" since it\'s a standard workspace type and the user has unrestricted permissions. This validates the happy path for workspace management.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Test standard workspace with full permissions
    const productionRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-1"]') as HTMLElement;
    const productionRowScope = within(productionRow);
    const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

    await userEvent.click(productionKebab);

    const editButton = await within(document.body).findByText('Edit workspace');
    const deleteButton = await within(document.body).findByText('Delete workspace');
    const moveButton = await within(document.body).findByText('Move workspace');

    // All actions should be enabled for standard workspace with full permissions
    await expect(editButton.closest('button')).not.toHaveAttribute('disabled');
    await expect(deleteButton.closest('button')).not.toHaveAttribute('disabled');
    await expect(moveButton.closest('button')).not.toHaveAttribute('disabled');

    // Actions are enabled - the business logic test is complete
    // (Full workflow testing can be done in integration tests)
  },
};
