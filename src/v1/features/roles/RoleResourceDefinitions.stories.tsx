import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleResourceDefinitions } from './RoleResourceDefinitions';
import { v1RolesHandlers } from '../../data/mocks/roles.handlers';
import type { RoleOutDynamic } from '../../data/mocks/db';
import { inventoryHandlers } from '../../data/mocks/inventory.handlers';

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

// Component wrapper - data fetching is now handled internally via TanStack Query
const RoleResourceDefinitionsWrapper = () => {
  return <RoleResourceDefinitions />;
};

// Router decorator - uses MemoryRouter to set initial route with params
const withRouter = (Story: React.FC, context: { parameters: { roleId?: string; permissionId?: string } }) => {
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
              <RoleResourceDefinitionsWrapper />
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

const meta: Meta<typeof RoleResourceDefinitions> = {
  component: RoleResourceDefinitions,
  tags: ['role-resource-definitions', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
  },
};

export default meta;
type Story = StoryObj<typeof RoleResourceDefinitions>;

// Default handlers
const createDefaultHandlers = (role = mockRole) => [
  ...v1RolesHandlers([role as unknown as RoleOutDynamic], {
    networkDelay: 100,
    onGet: (roleId) => fetchRoleSpy({ roleId }),
  }),
  ...inventoryHandlers(
    Object.values(mockInventoryGroups).map((g) => ({ id: g.id, name: g.name, host_count: 0, updated: '2024-01-01' })),
    undefined,
    { networkDelay: 100, onGroupsList: (req) => fetchInventoryGroupsSpy({ url: req.url }) },
  ),
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify permission and defined resources', async () => {
      // Permission ID should be in title (appears multiple times)
      await waitFor(
        () => {
          const permissionTexts = canvas.queryAllByText(/inventory:hosts:read/i);
          expect(permissionTexts.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      // "Defined resources" heading should be visible
      expect(canvas.getByText(/defined resources/i)).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify edit button visible', async () => {
      // Edit button should be visible
      await waitFor(
        () => {
          const editButton = canvas.queryByRole('button', { name: /edit/i }) || canvas.queryByRole('link', { name: /edit/i });
          expect(editButton).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify edit button hidden for system role', async () => {
      // Wait for data to load (permission ID appears multiple times in breadcrumb and title)
      await waitFor(
        () => {
          const permissionTexts = canvas.queryAllByText(/inventory:hosts:read/i);
          expect(permissionTexts.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      // Edit button should NOT be visible for system roles - wait for page to fully render
      await waitFor(
        () => {
          const editButton = canvas.queryByRole('button', { name: /edit/i });
          expect(editButton).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify breadcrumbs', async () => {
      // Breadcrumb should show "Roles" link
      await waitFor(
        () => {
          expect(canvas.queryByRole('link', { name: /roles/i })).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify role name in breadcrumb', async () => {
      // Wait for role data to load and breadcrumb to update
      await waitFor(
        () => {
          const roleLink = canvas.queryByRole('link', { name: /inventory administrator/i });
          expect(roleLink).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('grid', {}, { timeout: 3000 });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify filter input visible', async () => {
      // Filter input should be visible
      await waitFor(
        () => {
          const filterInput = canvas.queryByRole('textbox') || canvas.queryByPlaceholderText(/filter/i);
          expect(filterInput).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify permission ID in title', async () => {
      // Permission ID should be visible as page title
      await waitFor(
        () => {
          const permissionTexts = canvas.queryAllByText(/inventory:hosts:read/i);
          expect(permissionTexts.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial data and filter by Production', async () => {
      await waitFor(
        async () => {
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[0].name)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      expect(await canvas.findByText(Object.values(mockInventoryGroups)[0].name)).toBeInTheDocument();
      expect(await canvas.findByText(Object.values(mockInventoryGroups)[1].name)).toBeInTheDocument();
      expect(await canvas.findByText(Object.values(mockInventoryGroups)[2].name)).toBeInTheDocument();

      // Find the filter input
      const filterInput = await canvas.findByPlaceholderText(/filter by resource/i);
      expect(filterInput).toBeInTheDocument();

      // Type "Production" in the filter
      await userEvent.clear(filterInput);
      await userEvent.type(filterInput, 'Production');

      await waitFor(
        async () => {
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[0].name)).toBeInTheDocument();
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[1].name)).not.toBeInTheDocument();
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[2].name)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    await step('Filter by Servers then Dev then clear', async () => {
      const filterInput = await canvas.findByPlaceholderText(/filter by resource/i);

      await userEvent.clear(filterInput);
      await userEvent.type(filterInput, 'Servers');

      await waitFor(
        async () => {
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[0].name)).toBeInTheDocument();
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[1].name)).toBeInTheDocument();
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[2].name)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await userEvent.clear(filterInput);
      await userEvent.type(filterInput, 'Dev');

      await waitFor(
        async () => {
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[1].name)).toBeInTheDocument();
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[0].name)).not.toBeInTheDocument();
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[2].name)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await userEvent.clear(filterInput);

      await waitFor(
        async () => {
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[0].name)).toBeInTheDocument();
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[1].name)).toBeInTheDocument();
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[2].name)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Filter with no results', async () => {
      // Wait for data to load - use findByText which has built-in retry
      const productionText = await canvas.findByText(Object.values(mockInventoryGroups)[0].name, {}, { timeout: 5000 });
      expect(productionText).toBeInTheDocument();

      const filterInput = await canvas.findByPlaceholderText(/filter by resource/i);

      await userEvent.type(filterInput, 'NonExistentResource');

      await waitFor(
        () => {
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[0].name)).not.toBeInTheDocument();
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[1].name)).not.toBeInTheDocument();
          expect(canvas.queryByText(Object.values(mockInventoryGroups)[2].name)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // After filtering with no results, the table should have no data rows
      // Verify by checking the table exists but the specific data items are gone
      const table = canvas.queryByRole('grid') || canvas.queryByRole('table');
      expect(table).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify API spy calls', async () => {
      await waitFor(
        async () => {
          expect(await canvas.findByText(Object.values(mockInventoryGroups)[0].name)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

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
    });
  },
};
