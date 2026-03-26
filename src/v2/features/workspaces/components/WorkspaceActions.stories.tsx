import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceActions } from './WorkspaceActions';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import type { WorkspacesWorkspace } from '../../../data/queries/workspaces';

// Mock workspace data
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

// Story decorator to provide necessary context
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

const meta: Meta<typeof WorkspaceActions> = {
  component: WorkspaceActions,
  tags: ['autodocs'],
  decorators: [withProviders],
  parameters: {
    docs: {
      description: {
        component: `
The WorkspaceActions component provides a comprehensive dropdown menu for workspace management actions.

## Key Features
- **Contextual Actions**: Different actions available based on workspace type and permissions
- **Hierarchical Menus**: Drill-down menus for organizing related actions
- **Delete Protection**: Smart delete confirmation with asset checks
- **External Links**: Actions that open external services with visual indicators
- **Permission Awareness**: Actions adapt based on user permissions
- **Modal Confirmations**: Critical actions like delete require confirmation

## Actions Available
- **Edit Workspace**: Modify workspace properties and settings
- **Grant Access**: Manage user and group access to the workspace
- **Create Sub-workspace**: Add child workspaces for organization
- **View Tenant**: Open tenant management interface
- **Manage Integrations**: Configure workspace integrations (drill-down menu)
- **Manage Notifications**: Set up alerts and notifications (external link)
- **Delete Workspace**: Remove workspace with confirmation

## Safety Features
- Disabled state prevents accidental actions
- Asset checks before deletion
- Confirmation modals for destructive actions
- Clear visual feedback for external actions
        `,
      },
    },
  },
  argTypes: {
    currentWorkspace: {
      description: 'The workspace object for which actions are being provided',
      control: { type: 'object' },
    },
    hasAssets: {
      description: 'Whether the workspace contains assets that prevent deletion',
      control: { type: 'boolean' },
    },
    isDisabled: {
      description: 'Whether the actions menu should be disabled',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkspaceActions>;

export const Default: Story = {
  args: {
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default workspace actions menu showing all available actions for a standard workspace.',
      },
    },
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
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state where the actions menu cannot be opened, typically due to insufficient permissions.',
      },
    },
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
    currentWorkspace: mockWorkspace,
    hasAssets: true,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Workspace with assets - showing how the component behaves when assets exist. Note: Modal functionality requires additional context in actual usage.',
      },
    },
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

/**
 * Tests the delete confirmation modal interaction.
 * Verifies the modal opens, shows confirmation checkbox, and calls onDelete on confirm.
 */
export const DeleteConfirmation: Story = {
  args: {
    currentWorkspace: mockSubWorkspace,
    hasAssets: false,
    isDisabled: false,
    permissions: { view: true, edit: true, delete: true, create: true, move: true },
    onDelete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete confirmation modal — opens on click, requires checkbox, calls onDelete callback.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    await step('Open menu and click delete', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const deleteItem = await within(document.body).findByText('Delete workspace');
      await userEvent.click(deleteItem);
    });

    await step('Verify modal and confirm', async () => {
      const body = within(document.body);
      await expect(body.findByText(/Delete workspace/i)).resolves.toBeInTheDocument();

      const checkbox = await body.findByRole('checkbox');
      await userEvent.click(checkbox);

      const confirmButton = await body.findByRole('button', { name: /delete/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(args.onDelete).toHaveBeenCalledWith(mockSubWorkspace);
      });
    });
  },
};

/**
 * Tests the delete modal in "has assets" informational mode.
 * The modal shows a "Got it" button instead of a danger "Delete" button.
 */
export const DeleteBlockedByAssets: Story = {
  args: {
    currentWorkspace: mockSubWorkspace,
    hasAssets: true,
    isDisabled: false,
    permissions: { view: true, edit: true, delete: true, create: true, move: true },
    onDelete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete blocked when workspace has child assets — shows informational "Got it" modal.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    await step('Open menu and click delete', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const deleteItem = await within(document.body).findByText('Delete workspace');
      await userEvent.click(deleteItem);
    });

    await step('Verify informational modal with "Got it" button', async () => {
      const body = within(document.body);
      const gotItButton = await body.findByRole('button', { name: /got it/i });
      await expect(gotItButton).toBeInTheDocument();

      await expect(body.queryByRole('checkbox')).not.toBeInTheDocument();

      await userEvent.click(gotItButton);
      expect(args.onDelete).not.toHaveBeenCalled();
    });
  },
};

export const DrilldownMenuInteraction: Story = {
  args: {
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the drill-down menu functionality for managing integrations.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify drilldown menu', async () => {
      const actionsButton = await canvas.findByRole('button', { name: /actions/i });
      await userEvent.click(actionsButton);

      const menuItems = within(document.body).getAllByText('Manage integrations');
      const manageIntegrationsMenuItem =
        menuItems.find(
          (el) => el.closest('[role="menuitem"]') && !el.closest('[role="menuitem"]')?.getAttribute('aria-label')?.includes('breadcrumb'),
        ) || menuItems[0];

      await userEvent.click(manageIntegrationsMenuItem);

      const body = within(document.body);
      await expect(body.findByText('Menu Item 1')).resolves.toBeInTheDocument();
      await expect(body.findByText('Menu Item 2')).resolves.toBeInTheDocument();
    });
  },
};

export const SubWorkspace: Story = {
  args: {
    currentWorkspace: mockSubWorkspace,
    hasAssets: false,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Actions available for a sub-workspace, which may have different available actions than root workspaces.',
      },
    },
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

export const ExternalLinkAction: Story = {
  args: {
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the external link action with visual indicator for actions that open external services.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the menu
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await userEvent.click(actionsButton);

    // Look for the manage notifications item with external link icon (rendered in portal)
    const body = within(document.body);
    const manageNotifications = await body.findByText('Manage notifications');
    await expect(manageNotifications).toBeInTheDocument();

    // The external link icon should be in the menu (document.body, not canvas)
    const externalIcon = await body.findByLabelText('Manage Notifications');
    await expect(externalIcon).toBeInTheDocument();
  },
};

export const MenuNavigation: Story = {
  args: {
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive test of menu opening, closing, and navigation behavior.',
      },
    },
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
 * Tests that workspace-type constraints disable actions even when Kessel grants
 * full permissions. A root-type workspace should only allow viewing — edit,
 * create subworkspace, move, and delete must all be disabled.
 *
 * In production the `useWorkspacePermissions` hook strips these permissions
 * before they reach the component. This story validates that the component
 * renders correctly when it receives the post-hook permissions.
 */
export const ItemsDisabledByWorkspaceType: Story = {
  args: {
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: false,
    permissions: { view: true, edit: false, delete: false, create: false, move: false },
  },
  parameters: {
    featureFlags: { 'platform.rbac.workspaces': true },
    docs: {
      description: {
        story:
          'Root workspace with Kessel grants stripped by `useWorkspacePermissions` type constraints. ' +
          'Edit, Create subworkspace, Move, and Delete are all disabled despite the backend granting all relations.',
      },
    },
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
  },
};

/**
 * Tests that menu items respect per-relation permissions.
 *
 * Edit disabled (!edit), Grant Access disabled (!create), Delete disabled (!delete).
 */
export const ItemsDisabledByPermissions: Story = {
  args: {
    currentWorkspace: mockSubWorkspace,
    hasAssets: false,
    isDisabled: false,
    permissions: {
      view: true,
      edit: false,
      delete: false,
      create: false,
      move: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests that menu items are disabled when the user lacks the corresponding Kessel relation.',
      },
    },
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
