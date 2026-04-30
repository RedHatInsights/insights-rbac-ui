import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { queryByOuiaId, queryTreeViewToggle } from '../../../../test-utils/interactionHelpers';
import { WorkspaceListTable } from './WorkspaceListTable';
import { BrowserRouter } from 'react-router-dom';
// Import shared test functions and mock data from helper file
import { type WorkspaceRelation } from '../../../data/queries/workspaces';
import { canCreateInType, canDeleteType, canEditType, canMoveType } from '../workspaceTypes';
import {
  mockWorkspaces,
  testDefaultWorkspaceDisplay,
  testEmptyState,
  testErrorState,
  testLoadingState,
  waitForSkeletonToDisappear,
} from '../workspaceTestHelpers';
import { workspacesHandlers } from '../../../data/mocks/workspaces.handlers';

const defaultProps = {
  workspaces: mockWorkspaces,
  isLoading: false,
  error: null as string | null,
  hasPermission: () => true,
  canCreateAny: true,
};

const meta: Meta<typeof WorkspaceListTable> = {
  component: WorkspaceListTable,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        ...workspacesHandlers(
          mockWorkspaces.map(({ permissions: _p, ...ws }) => ws),
          { networkDelay: 0 },
        ),
      ],
    },
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
  play: async ({ canvasElement, step }) => {
    await step('Verify default workspace display', async () => {
      await testDefaultWorkspaceDisplay(canvasElement);
    });
  },
};

export const ExpandedByDefault: Story = {
  args: defaultProps,
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that the workspace tree is expanded by default on load. All child workspaces under the root should be visible immediately without requiring user interaction. This improves discoverability and reduces clicks needed to view the workspace hierarchy.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify expanded by default', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await expect(canvas.findByText('Root Workspace')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Development Environment')).resolves.toBeInTheDocument();

      const rootExpandButton = queryTreeViewToggle(canvasElement);
      if (rootExpandButton) {
        expect(rootExpandButton).toHaveAttribute('aria-expanded', 'true');
      }
    });
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
  play: async ({ canvasElement, step }) => {
    await step('Verify loading state', async () => {
      await testLoadingState(canvasElement);
    });
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
  play: async ({ canvasElement, step }) => {
    await step('Verify empty state', async () => {
      await testEmptyState(canvasElement);
    });
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
  play: async ({ canvasElement, step }) => {
    await step('Verify error state', async () => {
      await testErrorState(canvasElement);
    });
  },
};

export const NoPermissions: Story = {
  args: {
    ...defaultProps,
    hasPermission: () => false, // User cannot edit any workspace
    canCreateAny: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that users with read-only permissions see all action buttons disabled. Users should see workspace data normally, but when clicking kebab menus, all actions (Edit, Delete, Move) should be disabled/grayed out since they only have read access.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify no-permissions disabled actions', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

      const productionRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-1');
      await expect(productionRow).toBeInTheDocument();

      const productionRowScope = within(productionRow!);
      const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(productionKebab);

      const editButton = await within(document.body).findByText('Edit workspace');
      const deleteButton = await within(document.body).findByText('Delete workspace');
      const moveButton = await within(document.body).findByText('Move workspace');

      await expect(editButton.closest('button')).toHaveAttribute('disabled');
      await expect(deleteButton.closest('button')).toHaveAttribute('disabled');
      await expect(moveButton.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const RestrictedPermissions: Story = {
  args: {
    ...defaultProps,
    hasPermission: (workspaceId: string) => workspaceId === '1', // User can only edit workspace '1'
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests resource-scoped permissions where users can only modify specific workspaces. Users should see enabled actions for "Production Environment" (workspace ID 1) but disabled actions for "Development Environment" (workspace ID 2), demonstrating fine-grained access control.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify Production Environment has enabled actions', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      const productionRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-1');
      const productionRowScope = within(productionRow!);
      const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(productionKebab);

      const editButton = await within(document.body).findByText('Edit workspace');
      const deleteButton = await within(document.body).findByText('Delete workspace');
      const moveButton = await within(document.body).findByText('Move workspace');

      await expect(editButton.closest('button')).not.toHaveAttribute('disabled');
      await waitFor(
        async () => {
          await expect(deleteButton.closest('button')).not.toHaveAttribute('disabled');
        },
        { timeout: 5000 },
      );
      await expect(moveButton.closest('button')).not.toHaveAttribute('disabled');

      await userEvent.click(productionKebab);
    });
    await step('Verify Development Environment has disabled actions', async () => {
      const developmentRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-2');
      const developmentRowScope = within(developmentRow!);
      const developmentKebab = developmentRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(developmentKebab);

      const editButton2 = await within(document.body).findByText('Edit workspace');
      const deleteButton2 = await within(document.body).findByText('Delete workspace');
      const moveButton2 = await within(document.body).findByText('Move workspace');

      await expect(editButton2.closest('button')).toHaveAttribute('disabled');
      await expect(deleteButton2.closest('button')).toHaveAttribute('disabled');
      await expect(moveButton2.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const RootWorkspaceRestrictions: Story = {
  args: {
    ...defaultProps,
    hasPermission: (id: string, relation: WorkspaceRelation) => {
      if (relation === 'view') return true;
      const ws = mockWorkspaces.find((w) => w.id === id);
      const type = ws?.type;
      switch (relation) {
        case 'edit':
          return canEditType(type);
        case 'create':
          return canCreateInType(type);
        case 'move':
          return canMoveType(type);
        case 'delete':
          return canDeleteType(type);
        default:
          return true;
      }
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests workspace type restrictions where root workspaces cannot be modified regardless of user permissions. The `hasPermission` prop simulates post-hook behavior where `useWorkspacePermissions` has already applied type constraints — root workspace actions are denied despite the user having Kessel grants.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify root workspace actions disabled', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      const rootRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-0');
      const rootRowScope = within(rootRow!);
      const rootKebab = rootRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(rootKebab);

      const editButton = await within(document.body).findByText('Edit workspace');
      const deleteButton = await within(document.body).findByText('Delete workspace');
      const moveButton = await within(document.body).findByText('Move workspace');

      await expect(editButton.closest('button')).toHaveAttribute('disabled');
      await expect(deleteButton.closest('button')).toHaveAttribute('disabled');
      await expect(moveButton.closest('button')).toHaveAttribute('disabled');
    });
    await step('Verify Create sibling workspace is not rendered for root', async () => {
      await expect(within(document.body).queryByText('Create sibling workspace')).toBeNull();
    });
  },
};

export const PendingViewPermission: Story = {
  args: {
    ...defaultProps,
    hasPermission: (id: string, relation: WorkspaceRelation) => {
      if (id === '1' && relation === 'view') return false;
      return true;
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the Kessel latency gap UX: when the access SDK has not synced yet, the workspace name renders as a disabled link with a tooltip, and all kebab actions are disabled. Other workspaces with view permission render normally.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify pending workspace is a disabled inline link, active workspace is a normal link', async () => {
      await waitForSkeletonToDisappear(canvasElement);
      const canvas = within(canvasElement);

      const pendingText = await canvas.findByText('Production Environment');
      const pendingButton = pendingText.closest('button');
      await expect(pendingButton).not.toBeNull();
      await expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
      await expect(pendingText.closest('a')).toBeNull();

      const rootLink = await canvas.findByRole('link', { name: 'Root Workspace' });
      await expect(rootLink).toBeInTheDocument();
    });

    await step('Verify pending workspace has tooltip', async () => {
      const canvas = within(canvasElement);
      const pendingText = await canvas.findByText('Production Environment');
      await userEvent.hover(pendingText);
      const tooltip = await within(document.body).findByText('This workspace is being set up and is not available for inspection yet.');
      await expect(tooltip).toBeInTheDocument();
      await userEvent.unhover(pendingText);
    });

    await step('Verify pending workspace kebab actions are all disabled', async () => {
      const productionRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-1');
      const productionRowScope = within(productionRow!);
      const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(productionKebab);

      const editButton = await within(document.body).findByText('Edit workspace');
      const deleteButton = await within(document.body).findByText('Delete workspace');
      const moveButton = await within(document.body).findByText('Move workspace');

      await expect(editButton.closest('button')).toHaveAttribute('disabled');
      await expect(deleteButton.closest('button')).toHaveAttribute('disabled');
      await expect(moveButton.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const CorrectRelationsForRowActions: Story = {
  args: {
    ...defaultProps,
    // User has edit permission but NOT delete — proves canModify uses correct Kessel relation per action
    hasPermission: (_id: string, relation: WorkspaceRelation) => relation !== 'delete',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that row actions check the correct Kessel relation per action. Delete checks the "delete" relation, move checks "move". Each action maps to its specific Kessel relation via hasPermission().',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify correct relations per action', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      const productionRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-1');
      const productionRowScope = within(productionRow!);
      const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(productionKebab);

      const editButton = await within(document.body).findByText('Edit workspace');
      await expect(editButton.closest('button')).not.toHaveAttribute('disabled');

      const deleteButton = await within(document.body).findByText('Delete workspace');
      await expect(deleteButton.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const FullPermissions: Story = {
  args: {
    ...defaultProps,
    hasPermission: () => true, // User has full permissions
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests that users with full permissions can access all valid actions on standard workspaces. Users should see all actions (Edit, Delete, Move) enabled for "Production Environment" since it\'s a standard workspace type and the user has unrestricted permissions. This validates the happy path for workspace management.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify full permissions actions enabled', async () => {
      await waitForSkeletonToDisappear(canvasElement);

      const productionRow = queryByOuiaId(canvasElement, 'workspaces-list-tr-1');
      const productionRowScope = within(productionRow!);
      const productionKebab = productionRowScope.getByLabelText('Kebab toggle');

      await userEvent.click(productionKebab);

      const editButton = await within(document.body).findByText('Edit workspace');
      const deleteButton = await within(document.body).findByText('Delete workspace');
      const moveButton = await within(document.body).findByText('Move workspace');

      await expect(editButton.closest('button')).not.toHaveAttribute('disabled');
      await waitFor(
        async () => {
          await expect(deleteButton.closest('button')).not.toHaveAttribute('disabled');
        },
        { timeout: 5000 },
      );
      await expect(moveButton.closest('button')).not.toHaveAttribute('disabled');
    });
  },
};
