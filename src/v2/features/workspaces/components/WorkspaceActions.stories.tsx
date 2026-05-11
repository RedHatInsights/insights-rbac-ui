import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceActions } from './WorkspaceActions';
import { type WorkspaceActionCallbacks, useWorkspaceActionItems } from './useWorkspaceActionItems';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import type { WorkspacePermissions, WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { workspacesHandlers } from '../../../data/mocks/workspaces.handlers';

const mockWorkspace: WorkspacesWorkspace = {
  id: 'workspace-1',
  name: 'Production Environment',
  description: 'Main production workspace for critical services',
  type: 'root',
  parent_id: '',
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
};

const mockSubWorkspace: WorkspacesWorkspace = {
  id: 'workspace-2',
  name: 'Web Services',
  description: 'Frontend web applications and services',
  type: 'standard',
  parent_id: 'workspace-1',
  created: '2024-01-02T00:00:00Z',
  modified: '2024-01-02T00:00:00Z',
};

const ALL_PERMS: WorkspacePermissions = { view: true, edit: true, delete: true, create: true, move: true };
const NO_PERMS: WorkspacePermissions = { view: true, edit: false, delete: false, create: false, move: false };
const NOOP_CALLBACKS: WorkspaceActionCallbacks = {
  onEdit: () => {},
  onGrantAccess: () => {},
  onCreateSibling: () => {},
  onCreateSub: () => {},
  onMove: () => {},
  onDelete: () => {},
};

/**
 * Wrapper that uses the hook to produce items, then passes them to WorkspaceActions.
 * This lets stories specify workspace/permissions/callbacks props instead of raw items.
 */
const WorkspaceActionsWithHook: React.FC<{
  workspace: WorkspacesWorkspace;
  permissions?: WorkspacePermissions;
  callbacks?: WorkspaceActionCallbacks;
  isDisabled?: boolean;
}> = ({ workspace, permissions, callbacks = NOOP_CALLBACKS, isDisabled }) => {
  const items = useWorkspaceActionItems({ workspaceId: workspace.id, permissions, callbacks });
  return <WorkspaceActions items={items} isDisabled={isDisabled} />;
};

const withProviders = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <IntlProvider locale="en" messages={{}}>
        <div style={{ padding: '16px', height: '400px' }}>
          <Story />
        </div>
      </IntlProvider>
    </BrowserRouter>
  );
};

const meta: Meta<typeof WorkspaceActionsWithHook> = {
  component: WorkspaceActionsWithHook,
  tags: ['autodocs'],
  decorators: [withProviders],
  parameters: {
    msw: {
      handlers: [...workspacesHandlers([mockWorkspace, mockSubWorkspace])],
    },
    docs: {
      description: {
        component: `
The WorkspaceActions component provides a dropdown menu for workspace management actions.

## Key Features
- **Contextual Actions**: Different actions available based on workspace type and permissions
- **Permission Awareness**: Actions adapt based on user permissions

## Actions Available
- **Edit Workspace**: Modify workspace properties and settings
- **Grant Access**: Manage user and group access to the workspace
- **Create Sibling/Sub-workspace**: Add workspaces (list page only)
- **Move Workspace**: Relocate a workspace under a different parent
- **Delete Workspace**: Remove workspace (navigates to confirmation route)
        `,
      },
    },
  },
  argTypes: {
    workspace: {
      description: 'The workspace object for which actions are being provided',
      control: { type: 'object' },
    },
    isDisabled: {
      description: 'Whether the actions menu should be disabled',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkspaceActionsWithHook>;

export const Default: Story = {
  args: {
    workspace: mockWorkspace,
    callbacks: NOOP_CALLBACKS,
    isDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify actions menu', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await expect(actionsButton).toBeInTheDocument();
      await expect(actionsButton).not.toBeDisabled();

      await userEvent.click(actionsButton);

      await expect(within(document.body).findByText('Edit workspace')).resolves.toBeInTheDocument();
      await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
    });
  },
};

export const DisabledState: Story = {
  args: {
    workspace: mockWorkspace,
    callbacks: NOOP_CALLBACKS,
    isDisabled: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify disabled state', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await expect(actionsButton).toBeInTheDocument();
      await expect(actionsButton).toBeDisabled();
    });
  },
};

export const WithAssets: Story = {
  args: {
    workspace: mockWorkspace,
    callbacks: NOOP_CALLBACKS,
    isDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify with assets menu', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
    });
  },
};

export const DeleteActionEnabled: Story = {
  args: {
    workspace: mockSubWorkspace,
    permissions: ALL_PERMS,
    callbacks: NOOP_CALLBACKS,
    isDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Open menu and verify delete item is enabled', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const deleteItem = await within(document.body).findByText('Delete workspace');
      await waitFor(
        async () => {
          await expect(deleteItem.closest('button')).not.toHaveAttribute('disabled');
        },
        { timeout: 5000 },
      );
    });
  },
};

export const SubWorkspace: Story = {
  args: {
    workspace: mockSubWorkspace,
    callbacks: NOOP_CALLBACKS,
    isDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify sub-workspace actions', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await expect(actionsButton).toBeInTheDocument();

      await userEvent.click(actionsButton);

      await expect(within(document.body).findByText('Edit workspace')).resolves.toBeInTheDocument();
      await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
    });
  },
};

export const MenuNavigation: Story = {
  args: {
    workspace: mockWorkspace,
    callbacks: NOOP_CALLBACKS,
    isDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify menu navigation', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });

      await expect(actionsButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(actionsButton);
      await expect(actionsButton).toHaveAttribute('aria-expanded', 'true');

      await expect(within(document.body).findByText('Edit workspace')).resolves.toBeInTheDocument();

      await userEvent.click(actionsButton);
      await expect(actionsButton).toHaveAttribute('aria-expanded', 'false');

      await waitFor(async () => {
        await expect(canvas.queryByText('Edit workspace')).not.toBeInTheDocument();
      });
    });
  },
};

/**
 * Root workspace with Kessel grants stripped by type constraints.
 * Edit, Grant Access, Create sub-workspace, Move, and Delete are all disabled.
 * Create sibling is hidden (not rendered) because root has no parent.
 */
export const ItemsDisabledByWorkspaceType: Story = {
  args: {
    workspace: mockWorkspace,
    permissions: NO_PERMS,
    callbacks: { ...NOOP_CALLBACKS, onCreateSibling: undefined },
    isDisabled: false,
  },
  parameters: {
    featureFlags: { 'platform.rbac.workspaces': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify all mutating actions are disabled for a root workspace', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const body = within(document.body);

      const editItem = await body.findByText('Edit workspace');
      await expect(editItem.closest('button')).toHaveAttribute('disabled');

      const grantItem = await body.findByText('Grant access to workspace');
      await expect(grantItem.closest('button')).toHaveAttribute('disabled');

      const createSubItem = await body.findByText('Create sub-workspace');
      await expect(createSubItem.closest('button')).toHaveAttribute('disabled');

      const moveItem = await body.findByText('Move workspace');
      await expect(moveItem.closest('button')).toHaveAttribute('disabled');

      const deleteItem = await body.findByText('Delete workspace');
      await expect(deleteItem.closest('button')).toHaveAttribute('disabled');
    });
    await step('Verify Create sibling workspace is not rendered', async () => {
      await expect(within(document.body).queryByText('Create sibling workspace')).toBeNull();
    });
  },
};

/**
 * Default workspace type restrictions.
 * Create sibling is hidden because default's parent is root where creation is restricted.
 */
export const DefaultWorkspaceTypeRestrictions: Story = {
  args: {
    workspace: { ...mockWorkspace, id: 'default-1', name: 'Default Workspace', type: 'default', parent_id: 'root-1' },
    permissions: { view: true, edit: true, delete: false, create: true, move: false },
    callbacks: { ...NOOP_CALLBACKS, onCreateSibling: undefined },
    isDisabled: false,
  },
  parameters: {
    msw: {
      handlers: [
        ...workspacesHandlers([
          mockWorkspace,
          { ...mockWorkspace, id: 'default-1', name: 'Default Workspace', type: 'default', parent_id: 'root-1' },
          mockSubWorkspace,
        ]),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify Create sibling workspace is not rendered for default workspace', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const body = within(document.body);
      await expect(body.queryByText('Create sibling workspace')).toBeNull();

      const editItem = await body.findByText('Edit workspace');
      await expect(editItem.closest('button')).not.toHaveAttribute('disabled');
    });
  },
};

export const ItemsDisabledByPermissions: Story = {
  args: {
    workspace: mockSubWorkspace,
    permissions: NO_PERMS,
    callbacks: NOOP_CALLBACKS,
    isDisabled: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify items disabled by permissions', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const editItem = await within(document.body).findByText('Edit workspace');
      await expect(editItem.closest('button')).toHaveAttribute('disabled');

      const grantItem = await within(document.body).findByText('Grant access to workspace');
      await expect(grantItem.closest('button')).toHaveAttribute('disabled');

      const moveItem = await within(document.body).findByText('Move workspace');
      await expect(moveItem.closest('button')).toHaveAttribute('disabled');

      const deleteItem = await within(document.body).findByText('Delete workspace');
      await expect(deleteItem.closest('button')).toHaveAttribute('disabled');
    });
  },
};
