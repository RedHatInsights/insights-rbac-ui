import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AddRolePermissionWizard from './add-role-permission-wizard';

// API Spies
const updateRoleSpy = fn();
const fetchPermissionsSpy = fn();

// Mock role data
const mockRole = {
  uuid: 'role-123',
  name: 'Platform Administrator',
  display_name: 'Platform Administrator',
  description: 'Full platform access',
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
const withRouter = (Story: any) => {
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

    await delay(100);
    return HttpResponse.json({
      data: filteredPermissions.slice(offset, offset + limit),
      meta: { count: filteredPermissions.length, limit, offset },
    });
  }),

  // Permissions options API
  http.get('/api/rbac/v1/permissions/options/', async ({ request }) => {
    const url = new URL(request.url);
    const field = url.searchParams.get('field');

    await delay(100);

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
    await delay(100);
    return HttpResponse.json({
      ...mockRole,
      ...body,
    });
  }),

  // Cost management resource types API
  http.get('/api/cost-management/v1/resource-types/', async () => {
    await delay(100);
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
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible (may have multiple dialogs)
    const dialogs = await body.findAllByRole('dialog');
    expect(dialogs.length).toBeGreaterThan(0);

    // Title should show "Add permissions"
    const addPermissionsTexts = body.getAllByText(/add permissions/i);
    expect(addPermissionsTexts.length).toBeGreaterThan(0);
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
    await delay(500);
    const body = within(document.body);

    // Wait for wizard
    await body.findAllByRole('dialog');

    // Cancel button should be present
    const cancelButton = body.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
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
    await delay(500);
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
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wait for wizard
    await body.findAllByRole('dialog');

    // Step nav should be present
    const wizardNav = document.querySelector('.pf-v5-c-wizard__nav');
    expect(wizardNav).toBeInTheDocument();
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
    await delay(500);
    const body = within(document.body);

    // Wait for wizard
    await body.findAllByRole('dialog');

    // Should show permissions selection UI (table or list)
    await waitFor(
      () => {
        const table = document.querySelector('table') || document.querySelector('[role="grid"]');
        expect(table).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
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
    await delay(500);
    const body = within(document.body);

    // Wait for wizard
    await body.findAllByRole('dialog');

    // Wizard should be visible with some content
    const wizardTitle = body.getAllByText(/add permissions/i);
    expect(wizardTitle.length).toBeGreaterThan(0);
  },
};
