import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RemoveRoleModal } from './RemoveRoleModal';
import { v1RolesHandlers } from '../../data/mocks/roles.handlers';
import type { RoleOutDynamic } from '../../data/mocks/db';

// API Spies
const removeRoleSpy = fn();
const fetchRoleSpy = fn();
const afterSubmitSpy = fn();

// Mock role data
const mockRole = {
  uuid: 'role-123',
  name: 'Platform Administrator',
  display_name: 'Platform Administrator',
  description: 'Full platform access for administrators',
  modified: '2024-01-15T10:30:00Z',
  accessCount: 5,
  system: false,
};

// Router decorator with role ID param
const withRouter = (Story: React.ComponentType, context: { parameters?: { roleId?: string } }) => {
  const roleId = context.parameters?.roleId || 'role-123';
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/roles/:roleId/remove"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="*" element={<Navigate to={`/roles/${roleId}/remove`} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof RemoveRoleModal> = {
  component: RemoveRoleModal,
  tags: ['remove-role-modal', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    roleId: 'role-123',
  },
  args: {
    cancelRoute: '/roles',
    submitRoute: '/roles',
    afterSubmit: afterSubmitSpy,
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof RemoveRoleModal>;

// Default handlers
const createDefaultHandlers = (role = mockRole) =>
  v1RolesHandlers([role as unknown as RoleOutDynamic], {
    networkDelay: 100,
    onGet: (roleId) => fetchRoleSpy({ roleId }),
    onDelete: (roleId) => removeRoleSpy({ roleId }),
  });

/**
 * Default state - Confirmation modal with role name
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify modal and deletion warning', async () => {
      // Modal should be visible
      const modal = await body.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Title should ask about deletion (may appear multiple times)
      const deleteTexts = body.getAllByText(/delete role/i);
      expect(deleteTexts.length).toBeGreaterThan(0);

      // Role name should appear in the warning text
      await waitFor(() => {
        expect(body.queryByText(/platform administrator/i)).toBeInTheDocument();
      });
    });
  },
};

/**
 * Confirmation checkbox must be checked to enable delete
 */
export const CheckboxRequired: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify checkbox required and delete disabled', async () => {
      // Wait for modal
      await body.findByRole('dialog');

      // Find checkbox
      const checkbox = body.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();

      // Delete/Confirm button should be disabled initially
      const deleteButton = body.getByRole('button', { name: /delete role/i });
      expect(deleteButton).toBeDisabled();
    });
  },
};

/**
 * Checking checkbox enables delete button
 */
export const CheckboxEnablesDelete: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Check checkbox and verify delete enabled', async () => {
      // Wait for modal
      await body.findByRole('dialog');

      // Find and click checkbox
      const checkbox = body.getByRole('checkbox');
      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Delete button should now be enabled
      const deleteButton = body.getByRole('button', { name: /delete role/i });
      await waitFor(() => {
        expect(deleteButton).toBeEnabled();
      });
    });
  },
};

/**
 * Cancel button is visible and enabled
 */
export const CancelButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const body = within(document.body);

    // Wait for modal
    await body.findByRole('dialog');

    // Cancel button should be present and enabled
    const cancelButton = body.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
  },
};

/**
 * Close button (X) is visible
 */
export const CloseButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const body = within(document.body);

    // Wait for modal
    await body.findByRole('dialog');

    // Close button should be present
    const closeButton = body.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  },
};

/**
 * Warning text contains role information
 */
export const WarningTextContent: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const body = within(document.body);

    // Wait for modal
    await body.findByRole('dialog');

    // Should contain warning about role deletion
    await waitFor(() => {
      const warningText = body.queryByText(/platform administrator/i);
      expect(warningText).toBeInTheDocument();
    });

    // Should mention permissions
    expect(body.getByText(/permission/i)).toBeInTheDocument();
  },
};
