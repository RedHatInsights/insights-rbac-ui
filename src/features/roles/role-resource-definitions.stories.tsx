import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ResourceDefinitions from './role-resource-definitions';
import { fetchRole } from '../../redux/roles/actions';

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

// Component wrapper that pre-fetches role data before rendering ResourceDefinitions
const ResourceDefinitionsWrapper = ({ roleId }: { roleId: string }) => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pre-fetch role data to populate Redux state before component renders
    dispatch(fetchRole(roleId) as any).then(() => {
      setIsReady(true);
    });
  }, [dispatch, roleId]);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return <ResourceDefinitions />;
};

// Router decorator
const withRouter = (Story: any, context: any) => {
  const roleId = context.parameters.roleId || 'role-123';
  const permissionId = context.parameters.permissionId || 'inventory:hosts:read';

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/roles/:roleId/permissions/:permissionId"
          element={
            <div style={{ minHeight: '100vh' }}>
              <ResourceDefinitionsWrapper roleId={roleId} />
            </div>
          }
        />
        <Route path="/roles/:roleId/permissions/:permissionId/edit" element={<div data-testid="edit-page">Edit Page</div>} />
        <Route path="/roles/:roleId" element={<div data-testid="role-detail-page">Role Detail</div>} />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="*" element={<Navigate to={`/roles/${roleId}/permissions/${permissionId}`} replace />} />
      </Routes>
    </BrowserRouter>
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
  // Fetch role
  http.get('/api/rbac/v1/roles/:roleId/', async ({ params }) => {
    fetchRoleSpy({ roleId: params.roleId });
    await delay(100);
    return HttpResponse.json(role);
  }),

  // Fetch inventory groups - handles comma-separated group IDs
  http.get('/api/inventory/v1/groups/:groupIds', async ({ params }) => {
    const groupIds = (params.groupIds as string).split(',');
    fetchInventoryGroupsSpy({ groupIds });
    await delay(100);

    const results = groupIds.map((id) => mockInventoryGroups[id as keyof typeof mockInventoryGroups]).filter(Boolean);

    return HttpResponse.json({ results });
  }),

  // Bulk inventory groups without path param
  http.get('/api/inventory/v1/groups', async () => {
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
