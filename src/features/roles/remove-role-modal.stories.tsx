import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RemoveRoleModal from './remove-role-modal';

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
const withRouter = (Story: any, context: any) => {
  const roleId = context.parameters.roleId || 'role-123';
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
const createDefaultHandlers = (role = mockRole) => [
  // Fetch single role
  http.get('/api/rbac/v1/roles/:roleId', async ({ params }) => {
    fetchRoleSpy({ roleId: params.roleId });
    await delay(100);
    return HttpResponse.json(role);
  }),

  // Delete role
  http.delete('/api/rbac/v1/roles/:roleId', async ({ params }) => {
    removeRoleSpy({ roleId: params.roleId });
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),
];

/**
 * Default state - Confirmation modal with role name
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Modal should be visible
    const modal = await body.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Title should ask about deletion (may appear multiple times)
    const deleteTexts = body.getAllByText(/delete role/i);
    expect(deleteTexts.length).toBeGreaterThan(0);

    // Role name should appear in the warning text
    await waitFor(() => {
      expect(body.getByText(/platform administrator/i)).toBeInTheDocument();
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
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wait for modal
    await body.findByRole('dialog');

    // Find checkbox
    const checkbox = body.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Delete/Confirm button should be disabled initially
    const deleteButton = body.getByRole('button', { name: /delete role/i });
    expect(deleteButton).toBeDisabled();
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
  play: async () => {
    await delay(500);
    const body = within(document.body);

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
    await delay(500);
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
    await delay(500);
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
    await delay(500);
    const body = within(document.body);

    // Wait for modal
    await body.findByRole('dialog');

    // Should contain warning about role deletion
    await waitFor(() => {
      const warningText = body.getByText(/platform administrator/i);
      expect(warningText).toBeInTheDocument();
    });

    // Should mention permissions
    expect(body.getByText(/permission/i)).toBeInTheDocument();
  },
};
