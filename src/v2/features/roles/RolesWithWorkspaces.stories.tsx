import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectLoadingVisible, queryAlert, queryByOuiaId, queryDrawerPanel, queryEmptyState } from '../../../test-utils/interactionHelpers';

import { RolesPage } from './RolesWithWorkspaces';
import { DEFAULT_V2_ROLES, V2_ROLE_RHEL_DEVOPS } from '../../data/mocks/seed';
import { createRoleBindingsListHandlers } from '../../data/mocks/roleBindings.handlers';
import { v2RolesErrorHandlers, v2RolesHandlers, v2RolesLoadingHandlers } from '../../data/mocks/roles.handlers';

// =============================================================================
// API SPIES
// =============================================================================

const listRolesSpy = fn();
const readRoleSpy = fn();
const batchDeleteRolesSpy = fn();

// =============================================================================
// MSW HANDLERS
// =============================================================================

const roleBindingsListHandlers = createRoleBindingsListHandlers([]);

// =============================================================================
// META
// =============================================================================

const withRouter = () => (
  <BrowserRouter>
    <div style={{ minHeight: '600px' }}>
      <RolesPage />
    </div>
  </BrowserRouter>
);

const meta: Meta<typeof RolesPage> = {
  component: RolesPage,
  decorators: [withRouter],
  parameters: {
    permissions: ['rbac:role:read', 'rbac:role:write'],
    msw: {
      handlers: [
        ...v2RolesHandlers(undefined, {
          onList: listRolesSpy,
          onRead: readRoleSpy,
          onBatchDelete: batchDeleteRolesSpy,
        }),
        ...roleBindingsListHandlers,
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RolesPage>;

const TARGET_CUSTOM_ROLE = V2_ROLE_RHEL_DEVOPS;

// =============================================================================
// STORIES
// =============================================================================

export const StandardView: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    listRolesSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Verify standard view', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      // Column headers
      await expect(canvas.findByText('Name')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Description')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Permissions')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Last modified')).resolves.toBeInTheDocument();

      for (const role of DEFAULT_V2_ROLES) {
        await expect(canvas.findByText(role.name!)).resolves.toBeInTheDocument();
      }

      // Verify permissions counts are displayed
      await expect(canvas.findByText('5')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('4')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('3')).resolves.toBeInTheDocument();

      // Create role button (requires rbac:role:write)
      await expect(canvas.findByRole('button', { name: /create role/i })).resolves.toBeInTheDocument();

      // API spy: list was called
      await expect(listRolesSpy).toHaveBeenCalled();
    });
  },
};

export const DrawerInteraction: Story = {
  play: async ({ canvasElement, step }) => {
    readRoleSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Verify drawer interaction', async () => {
      await canvas.findByRole('grid');

      const tenantAdminCell = await canvas.findByText(DEFAULT_V2_ROLES[0].name!);
      await userEvent.click(tenantAdminCell);

      // Wait for drawer panel to appear
      await waitFor(
        () => {
          const panel = queryDrawerPanel({ hidden: false });
          expect(panel).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const body = within(document.body);

      await expect(body.findByRole('heading', { name: DEFAULT_V2_ROLES[0].name! })).resolves.toBeInTheDocument();

      await waitFor(
        () => {
          expect(readRoleSpy).toHaveBeenCalledWith(DEFAULT_V2_ROLES[0].id);
        },
        { timeout: 5000 },
      );

      // Permissions tab — click to activate
      const permissionsTab = await body.findByRole('tab', { name: /permissions/i });
      await userEvent.click(permissionsTab);

      // Permissions table shows data rows for Tenant admin (5 permissions)
      const permissionsTable = await body.findByRole('grid', { name: /role permissions/i });
      await expect(permissionsTable).toBeInTheDocument();
      const dataRows = within(permissionsTable).getAllByRole('row');
      await expect(dataRows.length).toBeGreaterThanOrEqual(5);

      // Assigned user groups tab
      const groupsTab = await body.findByRole('tab', { name: /assigned user groups/i });
      await userEvent.click(groupsTab);

      // Groups table renders (empty since mock returns [])
      await waitFor(() => {
        const groupsTable = queryByOuiaId(document.body, 'assigned-usergroups-table');
        expect(groupsTable).toBeInTheDocument();
      });

      // Close drawer
      const closeButton = queryByOuiaId(document.body, 'RolesTable-drawer-close-button');
      await expect(closeButton).toBeInTheDocument();
      await userEvent.click(closeButton as HTMLElement);

      await waitFor(() => {
        const panel = queryDrawerPanel();
        expect(panel === null || panel.hasAttribute('hidden')).toBe(true);
      });
    });
  },
};

export const KebabActionsForCustomRole: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify kebab actions', async () => {
      await canvas.findByRole('grid');

      // Writable role should have a kebab menu
      const kebab = await canvas.findByRole('button', {
        name: new RegExp(`Actions for role ${TARGET_CUSTOM_ROLE.name}`, 'i'),
      });
      await expect(kebab).toBeInTheDocument();
      await userEvent.click(kebab);

      // Dropdown menu items: Edit and Delete
      const editItem = await within(document.body).findByRole('menuitem', { name: /edit/i });
      const deleteItem = await within(document.body).findByRole('menuitem', { name: /delete/i });
      await expect(editItem).toBeInTheDocument();
      await expect(deleteItem).toBeInTheDocument();
    });
  },
};

export const DeleteModalFlow: Story = {
  play: async ({ canvasElement, step }) => {
    batchDeleteRolesSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Verify delete modal flow', async () => {
      await canvas.findByRole('grid');

      // Open kebab for custom role
      const kebab = await canvas.findByRole('button', {
        name: new RegExp(`Actions for role ${TARGET_CUSTOM_ROLE.name}`, 'i'),
      });
      await userEvent.click(kebab);

      // Click Delete
      const deleteItem = await within(document.body).findByRole('menuitem', { name: /delete/i });
      await userEvent.click(deleteItem);

      // Modal appears
      const modalEl = await within(document.body).findByRole('dialog');
      const modal = within(modalEl);

      // Modal mentions the role name
      await expect(modal.findByText(new RegExp(TARGET_CUSTOM_ROLE.name!, 'i'))).resolves.toBeInTheDocument();

      // Delete button disabled until checkbox checked
      const deleteButton = await modal.findByRole('button', { name: /delete/i });
      await expect(deleteButton).toBeDisabled();

      const checkbox = await modal.findByRole('checkbox');
      await userEvent.click(checkbox);
      await expect(deleteButton).toBeEnabled();

      // Submit delete
      await userEvent.click(deleteButton);

      // API spy: batch delete called with the role's IDs
      await waitFor(() => {
        expect(batchDeleteRolesSpy).toHaveBeenCalled();
      });
    });
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [...v2RolesLoadingHandlers(), ...roleBindingsListHandlers],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify loading state', async () => {
      await waitFor(() => {
        expectLoadingVisible(canvasElement);
      });
    });
  },
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [...v2RolesHandlers([]), ...roleBindingsListHandlers],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty state', async () => {
      await expect(canvas.findByRole('heading', { name: /configure roles/i })).resolves.toBeInTheDocument();
    });
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [...v2RolesErrorHandlers(500), ...roleBindingsListHandlers],
    },
    test: { dangerouslyIgnoreUnhandledErrors: true },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify error state', async () => {
      await waitFor(() => {
        const hasState =
          !!canvasElement.textContent?.match(/configure roles|no roles|error|failed/i) ||
          !!queryEmptyState(canvasElement) ||
          !!queryAlert(canvasElement, 'danger');
        expect(hasState).toBe(true);
      });
    });
  },
};

export const ReadOnlyUser: Story = {
  parameters: {
    permissions: ['rbac:role:read'],
    msw: {
      handlers: [...v2RolesHandlers(), ...roleBindingsListHandlers],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify read-only user', async () => {
      await canvas.findByRole('grid');

      await expect(canvas.findByText(DEFAULT_V2_ROLES[0].name!)).resolves.toBeInTheDocument();

      // No write actions
      await expect(canvas.queryByRole('button', { name: /create role/i })).not.toBeInTheDocument();

      // No kebab menus at all
      const kebabs = canvas.queryAllByRole('button', { name: /actions for role/i });
      await expect(kebabs.length).toBe(0);
    });
  },
};
