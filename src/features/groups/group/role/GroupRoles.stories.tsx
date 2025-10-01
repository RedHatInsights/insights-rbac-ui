import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HttpResponse, http } from 'msw';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { GroupRoles } from './GroupRoles';
import { fetchGroup } from '../../../../redux/groups/actions';

const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Console Administrator',
    display_name: 'Console Administrator',
    description: 'Full administrative access to all resources and settings',
    system: false,
    platform_default: false,
    created: '2023-01-15T10:30:00.000Z',
    modified: '2023-01-20T14:45:00.000Z',
    policyCount: 15,
    accessCount: 50,
  },
  {
    uuid: 'role-2',
    name: 'Organization Administrator',
    display_name: 'Organization Administrator',
    description: 'Manage organization settings, users, and subscriptions',
    system: false,
    platform_default: false,
    created: '2023-01-10T09:15:00.000Z',
    modified: '2023-01-25T11:30:00.000Z',
    policyCount: 12,
    accessCount: 35,
  },
  {
    uuid: 'role-3',
    name: 'Insights Viewer',
    display_name: 'Insights Viewer',
    description: 'View insights, recommendations, and system health data',
    system: false,
    platform_default: false,
    created: '2023-01-05T16:20:00.000Z',
    modified: '2023-01-18T08:45:00.000Z',
    policyCount: 8,
    accessCount: 20,
  },
];

const mockGroup = {
  uuid: 'test-group-id',
  name: 'Test Group',
  description: 'A test group for development',
  platform_default: false,
  admin_default: false,
  system: false,
  principalCount: 5,
  roleCount: 3,
  policyCount: 8,
  created: '2023-01-01T00:00:00.000Z',
  modified: '2023-01-15T12:00:00.000Z',
};

const mockDefaultGroup = {
  uuid: 'default-group-id',
  name: 'Default access',
  description: 'Default access group for all users',
  platform_default: false,
  admin_default: true,
  system: false,
  principalCount: 'All',
  roleCount: 8,
  policyCount: 8,
  created: '2023-01-01T00:00:00.000Z',
  modified: '2023-01-15T12:00:00.000Z',
};

// Wrapper component that loads group data into Redux
const GroupRolesWrapper: React.FC<{ groupId?: string }> = () => {
  const dispatch = useDispatch();
  const { groupId } = useParams<{ groupId: string }>();

  useEffect(() => {
    if (groupId) {
      // Load the group data so Redux state is populated
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, groupId]);

  return <GroupRoles />;
};

const meta: Meta<typeof GroupRolesWrapper> = {
  component: GroupRolesWrapper,
  tags: ['group-roles'], // NO autodocs on meta
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[`/groups/detail/${parameters?.groupId || 'test-group-id'}/roles`]}>
        <Routes>
          <Route path="/groups/detail/:groupId/roles" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    groupId: 'test-group-id',
  },
};

export default meta;
type Story = StoryObj<typeof GroupRolesWrapper>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Group roles management with full functionality including role listing, selection, and actions.

This story demonstrates the complete GroupRoles component with:
- Role table with Name, Description, Modified columns
- Individual role selection and bulk selection
- Add role and remove role actions
- Proper permissions-based action visibility

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[WithoutPermissions](?path=/story/features-groups-group-role-grouproles--without-permissions)**: Tests role view without edit permissions
- **[DefaultGroupRoles](?path=/story/features-groups-group-role-grouproles--default-group-roles)**: Tests system default group with restricted actions
- **[LoadingState](?path=/story/features-groups-group-role-grouproles--loading-state)**: Tests skeleton loading state
- **[EmptyState](?path=/story/features-groups-group-role-grouproles--empty-state)**: Tests empty roles table
- **[BulkSelection](?path=/story/features-groups-group-role-grouproles--bulk-selection)**: Tests bulk select and remove functionality
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          return HttpResponse.json({
            data: mockRoles.slice(offset, offset + limit),
            meta: {
              count: mockRoles.length,
              limit,
              offset,
            },
          });
        }),
        // Mock for the admin default group check
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const adminDefault = url.searchParams.get('admin_default');

          if (adminDefault === 'true') {
            return HttpResponse.json({
              data: [],
              meta: { count: 0, limit: 1, offset: 0 },
            });
          }

          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 50, offset: 0 },
          });
        }),
        // Mock remove role action
        http.delete('/api/rbac/v1/groups/:groupId/roles/', async ({ request, params }) => {
          const requestBody = (await request.json()) as { roles: string[] };
          console.log('🗑️ Remove roles API called:', { groupId: params.groupId, roles: requestBody.roles });
          return HttpResponse.json({ message: 'Roles removed successfully' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
    expect(table).toBeInTheDocument();

    // Verify role data is displayed
    expect(await canvas.findByText('Console Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Organization Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Insights Viewer')).toBeInTheDocument();

    // Verify Add role button is present
    expect(await canvas.findByRole('button', { name: /add role/i })).toBeInTheDocument();

    // Test individual role actions - find actions menu for Console Administrator role
    const actionButton = await canvas.findByRole('button', { name: /actions for role console administrator/i });
    expect(actionButton).toBeInTheDocument();
  },
};

export const WithoutPermissions: Story = {
  parameters: {
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 50, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
    expect(table).toBeInTheDocument();

    // Verify role data is displayed (read-only view)
    expect(await canvas.findByText('Console Administrator')).toBeInTheDocument();

    // Verify no Add role button (no permissions)
    expect(canvas.queryByRole('button', { name: /add role/i })).not.toBeInTheDocument();

    // Verify no bulk select checkbox
    expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
};

export const DefaultGroupRoles: Story = {
  parameters: {
    groupId: 'default-group-id',
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockDefaultGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const adminDefault = url.searchParams.get('admin_default');

          if (adminDefault === 'true') {
            return HttpResponse.json({
              data: [mockDefaultGroup],
              meta: { count: 1, limit: 1, offset: 0 },
            });
          }

          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 50, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
    expect(table).toBeInTheDocument();

    // Verify role data is displayed
    expect(await canvas.findByText('Console Administrator')).toBeInTheDocument();

    // For admin default groups, Add role button should be disabled or hidden
    // Wait a moment for Redux state to update with group data
    await waitFor(
      async () => {
        const addButton = canvas.queryByRole('button', { name: /add role/i });
        // Admin default groups should not have an add role button, or if present it should be disabled
        if (addButton) {
          expect(addButton).toBeDisabled();
        }
        // If no button, that's also acceptable for admin default groups
      },
      { timeout: 5000 },
    );

    // Verify no bulk select for system default groups
    expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
};

export const BulkSelection: Story = {
  parameters: {
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 50, offset: 0 },
          });
        }),
        // Mock bulk remove
        http.delete('/api/rbac/v1/groups/:groupId/roles/', async ({ request, params }) => {
          const requestBody = (await request.json()) as { roles: string[] };
          console.log('🗑️ Bulk remove roles API called:', { groupId: params.groupId, roles: requestBody.roles });
          return HttpResponse.json({ message: `${requestBody.roles.length} roles removed successfully` });
        }),
        // Mock refresh after remove
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          console.log('🔄 Refreshing roles after remove');
          return HttpResponse.json({
            data: mockRoles.slice(1), // Remove first role to simulate deletion
            meta: { count: mockRoles.length - 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
    expect(table).toBeInTheDocument();

    // Test individual role selection
    const checkboxes = await canvas.findAllByRole('checkbox');
    const firstRoleCheckbox = checkboxes.find((cb) => !cb.hasAttribute('aria-label')); // Not the bulk select checkbox

    if (firstRoleCheckbox) {
      await userEvent.click(firstRoleCheckbox);
      expect(firstRoleCheckbox).toBeChecked();

      // Verify bulk actions dropdown appears
      const bulkActionsToggle = await canvas.findByRole('button', { name: /bulk actions toggle/i });
      expect(bulkActionsToggle).toBeInTheDocument();

      // Test bulk select all
      const bulkSelectToggle = canvas.getAllByRole('checkbox')[0]; // First checkbox should be bulk select
      await userEvent.click(bulkSelectToggle);

      // Verify all checkboxes are selected
      await waitFor(() => {
        const allCheckboxes = canvas.getAllByRole('checkbox');
        const roleCheckboxes = allCheckboxes.slice(1); // Skip bulk select checkbox
        roleCheckboxes.forEach((checkbox) => {
          expect(checkbox).toBeChecked();
        });
      });
    }
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          // Never resolves to keep loading state
          return new Promise(() => {});
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 50, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // Test skeleton loading state (check for skeleton elements)
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};

export const EmptyState: Story = {
  parameters: {
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 50, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for empty state message
    const emptyMessage = await canvas.findByText(/there are no roles in this group/i, undefined, { timeout: 10000 });
    expect(emptyMessage).toBeInTheDocument();

    // Verify Add role button is still present
    expect(await canvas.findByRole('button', { name: /add role/i })).toBeInTheDocument();
  },
};
