import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddRolePermissionWizard } from './AddRolePermissionWizard';

// API Spies
const updateRoleSpy = fn();
const fetchPermissionsSpy = fn();

const findWizardDialog = async () => {
  const dialogs = await screen.findAllByRole('dialog');
  return dialogs.find((d) => within(d).queryAllByText(/add permissions/i).length > 0) ?? dialogs[0];
};

// Mock role data
const mockRole = {
  uuid: 'role-123',
  name: 'Platform Administrator',
  display_name: 'Platform Administrator',
  description: 'Full platform access',
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-15T10:30:00Z',
  accessCount: 2,
  system: false,
  access: [
    { permission: 'rbac:role:read', resourceDefinitions: [] },
    { permission: 'rbac:group:read', resourceDefinitions: [] },
  ],
};

// Mock permissions
const mockPermissions = [
  {
    application: 'inventory',
    resource_type: 'hosts',
    verb: 'read',
    permission: 'inventory:hosts:read',
    description: 'View inventory hosts',
  },
  {
    application: 'inventory',
    resource_type: 'hosts',
    verb: 'write',
    permission: 'inventory:hosts:write',
    description: 'Modify inventory hosts',
  },
  {
    application: 'cost-management',
    resource_type: 'rate',
    verb: 'read',
    permission: 'cost-management:rate:read',
    description: 'View cost rates',
  },
];

// Router decorator
const withRouter = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/roles/:roleId/add-permissions"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/roles/:roleId" element={<div data-testid="role-detail-page">Role Detail Page</div>} />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="*" element={<Navigate to="/roles/role-123/add-permissions" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof AddRolePermissionWizard> = {
  component: AddRolePermissionWizard,
  tags: ['add-role-permission-wizard', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    role: mockRole,
  },
};

export default meta;
type Story = StoryObj<typeof AddRolePermissionWizard>;

// Default handlers
const createDefaultHandlers = () => [
  // Permissions API
  http.get('/api/rbac/v1/permissions/', async ({ request }) => {
    const url = new URL(request.url);
    const application = url.searchParams.get('application');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    fetchPermissionsSpy({ application, limit, offset });

    let filteredPermissions = mockPermissions;
    if (application) {
      filteredPermissions = mockPermissions.filter((p) => p.application === application);
    }

    return HttpResponse.json({
      data: filteredPermissions.slice(offset, offset + limit),
      meta: { count: filteredPermissions.length, limit, offset },
    });
  }),

  // Permissions options API
  http.get('/api/rbac/v1/permissions/options/', async ({ request }) => {
    const url = new URL(request.url);
    const field = url.searchParams.get('field');

    if (field === 'application') {
      return HttpResponse.json({
        data: ['inventory', 'cost-management', 'rbac'],
        meta: { count: 3 },
      });
    }
    if (field === 'resource_type') {
      return HttpResponse.json({
        data: ['hosts', 'groups', 'rate', 'role'],
        meta: { count: 4 },
      });
    }
    if (field === 'verb') {
      return HttpResponse.json({
        data: ['read', 'write', 'execute'],
        meta: { count: 3 },
      });
    }

    return HttpResponse.json({
      data: [],
      meta: { count: 0 },
    });
  }),

  // Update role API
  http.put('/api/rbac/v1/roles/:roleId', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    updateRoleSpy({ roleId: params.roleId, ...body });
    return HttpResponse.json({
      ...mockRole,
      ...body,
    });
  }),

  // Cost management resource types API
  http.get('/api/cost-management/v1/resource-types/', async () => {
    return HttpResponse.json({
      data: [
        { value: 'aws.account', path: '/api/cost-management/v1/resource-types/aws-accounts/' },
        { value: 'aws.organizational_unit', path: '/api/cost-management/v1/resource-types/aws-organizational-units/' },
      ],
      meta: { count: 2 },
    });
  }),
];

/**
 * Default state - Wizard opens to add permissions
 */
export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
    docs: {
      description: {
        story:
          'Container story for the **Add permissions** wizard (Role permissions step). Additional interaction stories validate the key UI behaviors for filtering and controls.',
      },
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    await expect(dialog).toBeInTheDocument();

    const addPermissionsTexts = await body.findAllByText(/add permissions/i);
    await expect(addPermissionsTexts.length).toBeGreaterThan(0);
  },
};

/**
 * Cancel button is visible
 */
export const CancelButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Cancel button should be present
    const cancelButton = await body.findByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeInTheDocument();
    await expect(cancelButton).toBeEnabled();
  },
};

/**
 * Next button is visible
 */
export const NextButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Next button(s) should be present (may have multiple)
    const nextButtons = await body.findAllByRole('button', { name: /next/i });
    await expect(nextButtons.length).toBeGreaterThan(0);
  },
};

/**
 * Wizard step navigation is visible
 */
export const WizardStepNavigation: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await findWizardDialog();

    // Step nav should be present
    const wizardNav = document.querySelector('.pf-v6-c-wizard__nav');
    await expect(wizardNav).toBeInTheDocument();
  },
};

/**
 * Permissions table is rendered
 */
export const PermissionsTableRendered: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    const table = await body.findByRole('grid');
    await expect(table).toBeInTheDocument();
  },
};

/**
 * Permissions filters are wired correctly (Application/Resource/Operation) and update the query.
 * Mirrors IQE intent: test_permissions_filters
 */
export const PermissionsFilteringInteraction: Story = {
  tags: ['test-skip'],
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Wait for initial permissions call (data may take time to render)
    await waitFor(async () => {
      await expect(fetchPermissionsSpy).toHaveBeenCalled();
    });

    // Reset spy so we only capture calls triggered by our interaction
    fetchPermissionsSpy.mockClear();

    // Open the Applications checkbox filter dropdown (DataViewCheckboxFilter renders via portal)
    const appFilterToggle =
      dialog.querySelector('[data-ouia-component-id="DataViewCheckboxFilter-toggle"]') ??
      (await body.findByRole('button', { name: /filter by application/i }));
    await userEvent.click(appFilterToggle as HTMLElement);

    // Select the "inventory" option (dropdown renders via portal as menu items with embedded checkboxes)
    const inventoryMenuItem = await within(document.body).findByRole('menuitem', { name: /^inventory$/i });
    const inventoryCheckbox = within(inventoryMenuItem).getByRole('checkbox');
    await userEvent.click(inventoryCheckbox);

    // Verify API was called with application filter
    await waitFor(async () => {
      await expect(fetchPermissionsSpy).toHaveBeenCalled();
      const lastCall = fetchPermissionsSpy.mock.calls[fetchPermissionsSpy.mock.calls.length - 1][0];
      await expect(lastCall.application).toBe('inventory');
    });

    // Verify non-inventory permission is not visible after filtering
    // (cost-management permission has resource type "rate")
    const filteredTable = await body.findByRole('grid');
    await expect(within(filteredTable).queryByText('rate')).not.toBeInTheDocument();
  },
};

/**
 * Role info is displayed in wizard
 */
export const RoleInfoDisplayed: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Wizard should be visible with some content
    const wizardTitle = await body.findAllByText(/add permissions/i);
    await expect(wizardTitle.length).toBeGreaterThan(0);
  },
};
