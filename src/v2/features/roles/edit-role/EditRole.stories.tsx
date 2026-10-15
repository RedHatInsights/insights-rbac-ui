import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { EditRole } from './EditRole';
import { v2RolesHandlers, v2RolesLoadingHandlers } from '../../../data/mocks/roles.handlers';
import { permissionsHandlers } from '../../../../shared/data/mocks/permissions.handlers';

// =============================================================================
// API SPIES
// =============================================================================

const readRoleSpy = fn();
const updateRoleSpy = fn();
const listPermissionsSpy = fn();

// =============================================================================
// DECORATORS
// =============================================================================

function withRouterForRole(roleId: string) {
  const Wrapper = () => (
    <MemoryRouter initialEntries={[`/roles/${roleId}/edit`]}>
      <Routes>
        <Route path="/roles/:roleId/edit" element={<EditRole />} />
        <Route path="*" element={<div data-testid="navigated-away">Roles list</div>} />
      </Routes>
    </MemoryRouter>
  );
  Wrapper.displayName = `withRouterForRole(${roleId})`;
  return Wrapper;
}

// =============================================================================
// META
// =============================================================================

const meta: Meta<typeof EditRole> = {
  component: EditRole,
  decorators: [withRouterForRole('role-rhel-devops')],
  parameters: {
    docs: {
      description: {
        component: `
### Design References

<img src="/mocks/workspaces/Editing a role.png" alt="Editing a role" width="400" />
        `,
      },
    },
    layout: 'fullscreen',
    permissions: ['rbac:role:read', 'rbac:role:write'],
    msw: {
      handlers: [
        ...v2RolesHandlers(undefined, {
          onRead: readRoleSpy,
          onUpdate: updateRoleSpy,
        }),
        ...permissionsHandlers(undefined, { onList: listPermissionsSpy }),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditRole>;

// =============================================================================
// STORIES
// =============================================================================

export const StandardView: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    readRoleSpy.mockClear();
    listPermissionsSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Verify standard view', async () => {
      // Wait for role data to load — page header includes role name
      await expect(canvas.findByText(/edit rhel devops/i)).resolves.toBeInTheDocument();

      // API spy: role detail fetched for role-rhel-devops
      await waitFor(() => {
        expect(readRoleSpy).toHaveBeenCalledWith('role-rhel-devops');
      });

      // Name field pre-populated with role name
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      await expect(nameInput).toHaveValue('RHEL DevOps');

      // Description field pre-populated
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });
      await expect(descriptionInput).toHaveValue('DevOps for RHEL systems');

      // Permissions table renders with existing permissions
      const grid = await canvas.findByRole('grid');
      await expect(grid).toBeInTheDocument();

      // API spy: permissions list endpoint called (for the available permissions picker)
      await waitFor(() => {
        expect(listPermissionsSpy).toHaveBeenCalled();
      });

      // Save button starts disabled (pristine state)
      const saveButton = await canvas.findByRole('button', { name: /save/i });
      await expect(saveButton).toBeDisabled();

      // Cancel button is present
      await expect(canvas.findByRole('button', { name: /cancel/i })).resolves.toBeInTheDocument();
    });
  },
};

export const SubmitChanges: Story = {
  play: async ({ canvasElement, step }) => {
    updateRoleSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Submit changes', async () => {
      // Wait for form to load
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      await expect(nameInput).toHaveValue('RHEL DevOps');

      // Save should be disabled initially (pristine)
      const saveButton = await canvas.findByRole('button', { name: /save/i });
      await expect(saveButton).toBeDisabled();

      // Modify the name field
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated RHEL DevOps');

      // Save becomes enabled after modification
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });

      // Submit the form
      await userEvent.click(saveButton);

      // API spy: update called with the role ID and updated body
      await waitFor(
        () => {
          expect(updateRoleSpy).toHaveBeenCalledWith('role-rhel-devops', expect.objectContaining({ name: 'Updated RHEL DevOps' }));
        },
        { timeout: 5000 },
      );
    });
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [...v2RolesLoadingHandlers(), ...permissionsHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify loading state', async () => {
      const spinner = await canvas.findByRole('progressbar');
      await expect(spinner).toBeInTheDocument();
    });
  },
};
