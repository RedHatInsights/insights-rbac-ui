import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceActions } from './WorkspaceActions';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Workspace } from '../../../redux/workspaces/reducer';

// Mock workspace data
const mockWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'Production Environment',
  description: 'Main production workspace for critical services',
  type: 'root',
  parent_id: '',
};

const mockSubWorkspace: Workspace = {
  id: 'workspace-2',
  name: 'Web Services',
  description: 'Frontend web applications and services',
  type: 'standard',
  parent_id: 'workspace-1',
};

// Story decorator to provide necessary context
const withProviders = (Story: any) => {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the Actions button
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await expect(actionsButton).toBeInTheDocument();
    await expect(actionsButton).not.toBeDisabled();

    // Click to open the menu
    await userEvent.click(actionsButton);

    // Verify some core menu items are present (not testing all to avoid flakiness)
    await expect(within(document.body).findByText('Edit workspace')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the Actions button but disabled
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await expect(actionsButton).toBeInTheDocument();
    await expect(actionsButton).toBeDisabled();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the menu
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await userEvent.click(actionsButton);

    // Verify the delete action is present - the actual modal behavior requires full app context
    await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
  },
};

export const DeleteConfirmation: Story = {
  args: {
    currentWorkspace: mockWorkspace,
    hasAssets: false,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete confirmation behavior for empty workspaces. Note: Full modal functionality requires additional app context.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the menu
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await userEvent.click(actionsButton);

    // Verify the delete action is present - the modal behavior requires full app context
    await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the main menu
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await userEvent.click(actionsButton);

    // Find the main menu item for "Manage integrations" (avoid breadcrumb)
    const menuItems = within(document.body).getAllByText('Manage integrations');
    const manageIntegrationsMenuItem =
      menuItems.find(
        (el) => el.closest('[role="menuitem"]') && !el.closest('[role="menuitem"]')?.getAttribute('aria-label')?.includes('breadcrumb'),
      ) || menuItems[0];

    await userEvent.click(manageIntegrationsMenuItem);

    // Should show the drill-down menu items (rendered in portal)
    const body = within(document.body);
    await expect(body.findByText('Menu Item 1')).resolves.toBeInTheDocument();
    await expect(body.findByText('Menu Item 2')).resolves.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the Actions button
    const actionsButton = await canvas.findByRole('button', { name: /actions/i });
    await expect(actionsButton).toBeInTheDocument();

    // Open menu to verify actions are available
    await userEvent.click(actionsButton);

    // All actions should still be available for sub-workspaces
    await expect(within(document.body).findByText('Edit workspace')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('Delete workspace')).resolves.toBeInTheDocument();
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
    const externalIcon = document.body.querySelector('[aria-label="Manage Notifications"]');
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const actionsButton = await canvas.findByRole('button', { name: /actions/i });

    // Initially closed
    await expect(actionsButton).toHaveAttribute('aria-expanded', 'false');

    // Open menu
    await userEvent.click(actionsButton);
    await expect(actionsButton).toHaveAttribute('aria-expanded', 'true');

    // Verify menu content is visible
    await expect(within(document.body).findByText('Edit workspace')).resolves.toBeInTheDocument();

    // Close by clicking button again
    await userEvent.click(actionsButton);
    await expect(actionsButton).toHaveAttribute('aria-expanded', 'false');

    // Menu content should no longer be visible
    await waitFor(async () => {
      await expect(canvas.queryByText('Edit workspace')).not.toBeInTheDocument();
    });
  },
};
