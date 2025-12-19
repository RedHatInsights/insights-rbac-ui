import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResourceDefinitions from './role-resource-definitions';

// API Spies
const fetchRoleSpy = fn();
const fetchInventoryGroupsSpy = fn();

// Mock role with resource definitions
const mockRole = {
  uuid: 'role-123',
  name: 'Inventory Administrator',
  display_name: 'Inventory Administrator',
  description: 'Manage inventory resources',
  system: false,
  access: [
    {
      permission: 'inventory:hosts:read',
      resourceDefinitions: [
        {
          attributeFilter: {
            key: 'group.id',
            operation: 'in',
            value: ['group-1', 'group-2', 'group-3'],
          },
        },
      ],
    },
    {
      permission: 'inventory:hosts:write',
      resourceDefinitions: [],
    },
    {
      permission: 'cost-management:rate:read',
      resourceDefinitions: [
        {
          attributeFilter: {
            key: 'cost-management.rate',
            operation: 'in',
            value: ['resource-a', 'resource-b'],
          },
        },
      ],
    },
  ],
};

// Mock inventory group details
const mockInventoryGroups = {
  'group-1': { id: 'group-1', name: 'Production Servers' },
  'group-2': { id: 'group-2', name: 'Development Servers' },
  'group-3': { id: 'group-3', name: 'Test Servers' },
};

// Router decorator - uses MemoryRouter to set initial route with params
const withRouter = (Story: any, context: any) => {
  const roleId = context.parameters.roleId || 'role-123';
  const permissionId = context.parameters.permissionId || 'inventory:hosts:read';
  const initialRoute = `/roles/${roleId}/permissions/${permissionId}`;

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/roles/:roleId/permissions/:permissionId"
          element={
            <div style={{ minHeight: '100vh' }}>
              <ResourceDefinitions />
            </div>
          }
        />
        <Route path="/roles/:roleId/permissions/:permissionId/edit" element={<div data-testid="edit-page">Edit Page</div>} />
        <Route path="/roles/:roleId" element={<div data-testid="role-detail-page">Role Detail</div>} />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

const meta: Meta<typeof ResourceDefinitions> = {
  component: ResourceDefinitions,
  tags: ['role-resource-definitions', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
  },
};

export default meta;
type Story = StoryObj<typeof ResourceDefinitions>;

// Default handlers
const createDefaultHandlers = (role = mockRole) => [
  // Fetch role - matches with or without query params
  http.get('/api/rbac/v1/roles/:roleId/', async ({ params }) => {
    fetchRoleSpy({ roleId: params.roleId });
    await delay(100);
    return HttpResponse.json(role);
  }),

  // Inventory groups API - matches any inventory API path
  http.get(/\/api\/inventory\/v1\/groups.*/, async ({ request }) => {
    const url = new URL(request.url);
    fetchInventoryGroupsSpy({ url: url.toString() });
    await delay(100);
    return HttpResponse.json({
      results: Object.values(mockInventoryGroups),
    });
  }),
];

/**
 * Default state - Shows resource definitions for inventory permission
 */
export const Default: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Permission ID should be in title (appears multiple times)
    await waitFor(
      () => {
        const permissionTexts = canvas.getAllByText(/inventory:hosts:read/i);
        expect(permissionTexts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // "Defined resources" heading should be visible
    expect(canvas.getByText(/defined resources/i)).toBeInTheDocument();
  },
};

/**
 * Edit button is visible for non-system roles
 */
export const EditButtonVisible: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Edit button should be visible
    await waitFor(
      () => {
        const editButton = canvas.queryByRole('button', { name: /edit/i }) || canvas.queryByRole('link', { name: /edit/i });
        expect(editButton).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Edit button is hidden for system roles
 */
export const EditButtonHiddenForSystemRole: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers({ ...mockRole, system: true }),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for data to load (permission ID appears multiple times in breadcrumb and title)
    await waitFor(
      () => {
        const permissionTexts = canvas.getAllByText(/inventory:hosts:read/i);
        expect(permissionTexts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // Edit button should NOT be visible for system roles
    const editButton = canvas.queryByRole('button', { name: /edit/i });
    expect(editButton).not.toBeInTheDocument();
  },
};

/**
 * Breadcrumbs navigation - Roles link
 */
export const BreadcrumbsVisible: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Breadcrumb should show "Roles" link
    await waitFor(
      () => {
        expect(canvas.getByRole('link', { name: /roles/i })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Role name in breadcrumb
 */
export const RoleNameInBreadcrumb: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for role data to load and breadcrumb to update
    await waitFor(
      () => {
        const roleLink = canvas.queryByRole('link', { name: /inventory administrator/i });
        expect(roleLink).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Table shows resource definitions
 */
export const ResourceDefinitionsTable: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);

    // Wait for table to render
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
 * Filter input is visible
 */
export const FilterInputVisible: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Filter input should be visible
    await waitFor(
      () => {
        const filterInput = canvas.queryByRole('textbox') || canvas.queryByPlaceholderText(/filter/i);
        expect(filterInput).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Permission ID displayed in page title
 */
export const PermissionIdInTitle: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Permission ID should be visible as page title
    await waitFor(
      () => {
        const permissionTexts = canvas.getAllByText(/inventory:hosts:read/i);
        expect(permissionTexts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Filter resources - Tests client-side filtering functionality
 */
export const FilterResources: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load
    await waitFor(
      async () => {
        expect(await canvas.findByText('Production Servers')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify all 3 rows are initially visible
    expect(await canvas.findByText('Production Servers')).toBeInTheDocument();
    expect(await canvas.findByText('Development Servers')).toBeInTheDocument();
    expect(await canvas.findByText('Test Servers')).toBeInTheDocument();

    // Find the filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by resource/i);
    expect(filterInput).toBeInTheDocument();

    // Type "Production" in the filter
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'Production');

    // Wait for filtering to apply (client-side, should be immediate)
    await waitFor(
      async () => {
        // Production Servers should still be visible
        expect(await canvas.findByText('Production Servers')).toBeInTheDocument();
        // Other servers should be filtered out
        expect(canvas.queryByText('Development Servers')).not.toBeInTheDocument();
        expect(canvas.queryByText('Test Servers')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Clear filter and type "Servers" to match all
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'Servers');

    // All 3 rows should be visible again
    await waitFor(
      async () => {
        expect(await canvas.findByText('Production Servers')).toBeInTheDocument();
        expect(await canvas.findByText('Development Servers')).toBeInTheDocument();
        expect(await canvas.findByText('Test Servers')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Test partial match - filter by "Dev"
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'Dev');

    await waitFor(
      async () => {
        expect(await canvas.findByText('Development Servers')).toBeInTheDocument();
        expect(canvas.queryByText('Production Servers')).not.toBeInTheDocument();
        expect(canvas.queryByText('Test Servers')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Clear the filter completely
    await userEvent.clear(filterInput);

    // All rows should be back
    await waitFor(
      async () => {
        expect(await canvas.findByText('Production Servers')).toBeInTheDocument();
        expect(await canvas.findByText('Development Servers')).toBeInTheDocument();
        expect(await canvas.findByText('Test Servers')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * Filter with no results - Tests empty state when filter matches nothing
 */
export const FilterNoResults: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load - use findByText which has built-in retry
    const productionText = await canvas.findByText('Production Servers', {}, { timeout: 5000 });
    expect(productionText).toBeInTheDocument();

    // Find the filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by resource/i);

    // Type a non-matching filter value
    await userEvent.type(filterInput, 'NonExistentResource');

    // Wait for filtering to apply - no rows should be visible
    await waitFor(
      () => {
        expect(canvas.queryByText('Production Servers')).not.toBeInTheDocument();
        expect(canvas.queryByText('Development Servers')).not.toBeInTheDocument();
        expect(canvas.queryByText('Test Servers')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // After filtering with no results, the table should have no data rows
    // Verify by checking the table exists but the specific data items are gone
    const table = canvas.queryByRole('grid') || canvas.queryByRole('table');
    expect(table).toBeInTheDocument();
  },
};

/**
 * API Spy verification - Verifies correct API calls are made with spies
 */
export const APISpyVerification: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load
    await waitFor(
      async () => {
        expect(await canvas.findByText('Production Servers')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify the fetchRoleSpy was called with the role ID
    await waitFor(() => {
      expect(fetchRoleSpy).toHaveBeenCalledWith({ roleId: 'role-123' });
    });

    // Verify the inventory groups API was called
    await waitFor(() => {
      expect(fetchInventoryGroupsSpy).toHaveBeenCalled();
    });

    // Verify inventory API was called with the correct URL pattern
    await waitFor(() => {
      const calls = fetchInventoryGroupsSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      // The URL should contain the group IDs
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.url).toContain('/api/inventory/v1/groups');
    });
  },
};
