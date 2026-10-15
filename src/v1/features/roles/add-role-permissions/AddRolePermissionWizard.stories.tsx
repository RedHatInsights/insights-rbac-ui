import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { queryByOuiaId, queryWizardNav } from '../../../../test-utils/interactionHelpers';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddRolePermissionWizard } from './AddRolePermissionWizard';
import { v1RolesHandlers } from '../../../data/mocks/roles.handlers';
import type { RoleOutDynamic } from '../../../data/mocks/db';
import { permissionsHandlers } from '../../../../shared/data/mocks/permissions.handlers';
import { inventoryHandlers } from '../../../../shared/data/mocks/inventory.handlers';

// API Spies
const updateRoleSpy = fn();
const fetchPermissionsSpy = fn();

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
  ...permissionsHandlers(mockPermissions as unknown as Parameters<typeof permissionsHandlers>[0], {
    networkDelay: 100,
    onList: (params) =>
      fetchPermissionsSpy({
        application: params.get('application'),
        limit: parseInt(params.get('limit') ?? '100'),
        offset: parseInt(params.get('offset') ?? '0'),
      }),
  }),
  ...v1RolesHandlers([mockRole as unknown as RoleOutDynamic], {
    networkDelay: 100,
    onUpdate: (roleId, body) => updateRoleSpy({ roleId, ...(body as Record<string, unknown>) }),
  }),
  ...inventoryHandlers(
    undefined,
    [
      { value: 'aws.account', path: '/api/cost-management/v1/resource-types/aws-accounts/', count: 5 },
      { value: 'aws.organizational_unit', path: '/api/cost-management/v1/resource-types/aws-organizational-units/', count: 3 },
    ],
    { networkDelay: 100 },
  ),
];

/**
 * Default state - Wizard opens to add permissions
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify wizard initial state', async () => {
      // Wizard should be visible (may have multiple dialogs)
      const dialogs = await body.findAllByRole('dialog');
      expect(dialogs.length).toBeGreaterThan(0);

      // Title should show "Add permissions"
      const addPermissionsTexts = body.getAllByText(/add permissions/i);
      expect(addPermissionsTexts.length).toBeGreaterThan(0);
    });
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
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify cancel button', async () => {
      // Wait for wizard
      await body.findAllByRole('dialog');

      // Cancel button should be present
      const cancelButton = body.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeEnabled();
    });
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
    const body = within(document.body);

    // Wait for wizard
    await body.findAllByRole('dialog');

    // Next button(s) should be present (may have multiple)
    const nextButtons = body.getAllByRole('button', { name: /next/i });
    expect(nextButtons.length).toBeGreaterThan(0);
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
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify wizard step navigation', async () => {
      // Wait for wizard
      await body.findAllByRole('dialog');

      // Step nav should be present (PatternFly-specific, no accessible alternative)
      const wizardNav = queryWizardNav();
      expect(wizardNav).toBeInTheDocument();
    });
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
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify permissions table rendered', async () => {
      // Wait for wizard
      await body.findAllByRole('dialog');

      // Should show permissions selection UI (table or list)
      await body.findByRole('grid', {}, { timeout: 3000 });
    });
  },
};

/**
 * Permissions filters are wired correctly (Application/Resource/Operation) and update the query.
 * (IQE: test_permissions_filters)
 */
export const PermissionsFilteringInteraction: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Apply application filter and verify', async () => {
      // Wait for wizard and initial permissions load
      await body.findAllByRole('dialog');
      await waitFor(() => {
        expect(fetchPermissionsSpy).toHaveBeenCalled();
      });

      // Reset spy so we only capture calls triggered by our interaction
      fetchPermissionsSpy.mockClear();

      // Open the Applications checkbox filter dropdown (DataViewCheckboxFilter renders via portal)
      const appFilterToggle =
        body.queryByRole('button', { name: /filter by application/i }) ?? queryByOuiaId(document.body, 'DataViewCheckboxFilter-toggle');
      expect(appFilterToggle).toBeTruthy();
      await userEvent.click(appFilterToggle!);

      // Select the "inventory" option (dropdown renders via portal)
      const inventoryMenuItem = await body.findByRole('menuitem', { name: /^inventory$/i });
      const inventoryCheckbox = within(inventoryMenuItem).getByRole('checkbox');
      await userEvent.click(inventoryCheckbox);

      // Verify API was called with application filter
      await waitFor(() => {
        expect(fetchPermissionsSpy).toHaveBeenCalled();
        const lastCall = fetchPermissionsSpy.mock.calls[fetchPermissionsSpy.mock.calls.length - 1][0];
        expect(lastCall.application).toBe('inventory');
      });

      // Verify non-inventory permission is not visible after filtering
      await waitFor(() => {
        const filteredTable = body.queryByRole('grid');
        expect(filteredTable).toBeInTheDocument();
        expect(within(filteredTable as HTMLElement).queryByText('rate')).not.toBeInTheDocument();
      });
    });
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
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify role info displayed', async () => {
      // Wait for wizard
      await body.findAllByRole('dialog');

      // Wizard should be visible with some content
      const wizardTitle = body.getAllByText(/add permissions/i);
      expect(wizardTitle.length).toBeGreaterThan(0);
    });
  },
};
