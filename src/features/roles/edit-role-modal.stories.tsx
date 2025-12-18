import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import EditRoleModal from './edit-role-modal';

// API Spies
const patchRoleSpy = fn();
const fetchRoleSpy = fn();
const fetchRolesSpy = fn();
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
          path="/roles/:roleId/edit"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/roles/:roleId" element={<div data-testid="role-detail-page">Role Detail Page</div>} />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="*" element={<Navigate to={`/roles/${roleId}/edit`} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof EditRoleModal> = {
  component: EditRoleModal,
  tags: ['edit-role-modal', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    roleId: 'role-123',
  },
  args: {
    cancelRoute: '/roles/role-123',
    submitRoute: '/roles/role-123',
    afterSubmit: afterSubmitSpy,
    // Note: isLoading is required by PropTypes but not in TS types - component bug
    isLoading: false,
  } as any,
};

export default meta;
type Story = StoryObj<typeof EditRoleModal>;

// Default handlers
const createDefaultHandlers = (role = mockRole) => [
  // Fetch single role
  http.get('/api/rbac/v1/roles/:roleId', async ({ params }) => {
    fetchRoleSpy({ roleId: params.roleId });
    await delay(100);
    return HttpResponse.json(role);
  }),

  // Fetch roles for name validation
  http.get('/api/rbac/v1/roles/', async ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    fetchRolesSpy({ name });
    await delay(100);
    // Return empty to indicate name is available
    return HttpResponse.json({
      data: [],
      meta: { count: 0 },
    });
  }),

  // Patch role
  http.patch('/api/rbac/v1/roles/:roleId', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    patchRoleSpy({ roleId: params.roleId, ...body });
    await delay(100);
    return HttpResponse.json({
      ...role,
      ...body,
    });
  }),
];

/**
 * Default state - Modal opens with role data loaded
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

    // Title should be visible
    expect(body.getByText(/edit role information/i)).toBeInTheDocument();

    // Name input should have current value
    const nameInput = body.getByRole('textbox', { name: /name/i });
    expect(nameInput).toBeInTheDocument();
    await waitFor(() => {
      expect(nameInput).toHaveValue('Platform Administrator');
    });

    // Description textarea should have current value
    const descInput = body.getByRole('textbox', { name: /description/i });
    expect(descInput).toHaveValue('Full platform access for administrators');
  },
};

/**
 * Edit role name
 */
export const EditRoleName: Story = {
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

    // Find name input
    const nameInput = body.getByRole('textbox', { name: /name/i });
    await waitFor(() => {
      expect(nameInput).toHaveValue('Platform Administrator');
    });

    // Clear and type new name
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Role Name');
    expect(nameInput).toHaveValue('Updated Role Name');
  },
};

/**
 * Edit role description
 */
export const EditRoleDescription: Story = {
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

    // Find description textarea
    const descInput = body.getByRole('textbox', { name: /description/i });
    await waitFor(() => {
      expect(descInput).toHaveValue('Full platform access for administrators');
    });

    // Clear and type new description
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'New description for this role');
    expect(descInput).toHaveValue('New description for this role');
  },
};

/**
 * Cancel button is visible and clickable
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
 * Save button is visible
 */
export const SaveButtonVisible: Story = {
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

    // Save/Submit button should be present
    const saveButton = body.getByRole('button', { name: /save|submit/i });
    expect(saveButton).toBeInTheDocument();
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

    // Close button (X) should be present
    const closeButton = body.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  },
};

/**
 * Form validation - name is required
 */
export const NameRequired: Story = {
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

    // Find name input
    const nameInput = body.getByRole('textbox', { name: /name/i });
    await waitFor(() => {
      expect(nameInput).toHaveValue('Platform Administrator');
    });

    // Clear the name input
    await userEvent.clear(nameInput);

    // Focus out to trigger validation
    await userEvent.tab();

    // Wait for validation message
    await delay(500);

    // Required field indicator should be present
    const requiredIndicator = body.queryByText(/required/i);
    if (requiredIndicator) {
      expect(requiredIndicator).toBeInTheDocument();
    } else {
      // Check if input is marked as invalid
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    }
  },
};
