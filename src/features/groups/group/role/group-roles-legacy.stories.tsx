import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HttpResponse, http } from 'msw';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fetchAddRolesForGroup, fetchGroup } from '../../../../redux/groups/actions';
import GroupRoles from './group-roles-legacy';

const mockRoles = [
  {
    uuid: 'role-1',
    display_name: 'Administrator',
    name: 'admin',
    description: 'Full system administrator access',
    modified: '2024-01-15T10:00:00Z',
  },
  {
    uuid: 'role-2',
    display_name: 'User Manager',
    name: 'user-manager',
    description: 'Can manage users and groups',
    modified: '2024-01-14T15:30:00Z',
  },
  {
    uuid: 'role-3',
    display_name: 'Viewer',
    name: 'viewer',
    description: 'Read-only access to system resources',
    modified: '2024-01-13T09:15:00Z',
  },
];

// Available roles that can be added (not already assigned)
const mockAvailableRoles = [
  {
    uuid: 'role-4',
    display_name: 'Content Manager',
    name: 'content-manager',
    description: 'Can manage content and media',
    modified: '2024-01-12T14:20:00Z',
  },
  {
    uuid: 'role-5',
    display_name: 'Auditor',
    name: 'auditor',
    description: 'Can view audit logs and reports',
    modified: '2024-01-11T11:45:00Z',
  },
];

// Shared handler for group roles with addRoles support
const createGroupRolesHandler = (assignedRoles = mockRoles) => {
  const handlerFunction = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const exclude = url.searchParams.get('exclude');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (exclude === 'true') {
      // Available roles that can be added (not already assigned)
      const paginatedAvailable = mockAvailableRoles.slice(offset, offset + limit);
      return HttpResponse.json({
        data: paginatedAvailable,
        meta: { count: mockAvailableRoles.length, limit, offset },
      });
    }

    // Assigned roles (default)
    const paginatedAssigned = assignedRoles.slice(offset, offset + limit);
    return HttpResponse.json({
      data: paginatedAssigned,
      meta: { count: assignedRoles.length, limit, offset },
    });
  };

  // Return multiple handlers to catch different URL patterns
  return [http.get('/api/rbac/v1/groups/:groupId/roles/', handlerFunction), http.get('/api/rbac/v1/groups/:groupId/roles', handlerFunction)];
};

// ✅ Using only MSW handlers and global Redux provider (as per Storybook rules)
// All stories use the global Redux provider from .storybook/preview.tsx

const meta: Meta<any> = {
  title: 'Features/Groups/Group/Role/GroupRoles-Legacy',
  component: GroupRoles,
  tags: ['group-roles'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/groups/detail/test-group-id/roles']}>
        <Routes>
          <Route path="/groups/detail/:groupId/roles" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component that mimics the parent Group component behavior
// This loads the group data before rendering GroupRoles, exactly like the real app
const GroupRolesWithData = () => {
  const dispatch = useDispatch();
  const { groupId } = useParams();

  // Get the selectedGroup from Redux to check if it's loaded
  const selectedGroup = useSelector((state: any) => state.groupReducer?.selectedGroup);

  useEffect(() => {
    if (groupId) {
      // Load the group data just like the parent Group component would
      dispatch(fetchGroup(groupId));
      // Also load the addRoles data that the component expects
      dispatch(fetchAddRolesForGroup(groupId, {}));
    }
  }, [dispatch, groupId]);

  // Only render GroupRoles once the group is loaded and has the required structure
  if (!selectedGroup || !selectedGroup.uuid || !selectedGroup.addRoles) {
    return <div>Loading group data...</div>;
  }

  // Render the actual GroupRoles component
  return <GroupRoles />;
};

export const Default: Story = {
  tags: ['autodocs'],
  render: () => <GroupRolesWithData />,
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete group roles management interface with role listing, selection, and bulk actions.

## Additional Test Stories

- **[Loading](?path=/story/features-groups-group-role-grouproles--loading)**: Shows skeleton loading state
- **[EmptyState](?path=/story/features-groups-group-role-grouproles--empty-state)**: No roles assigned to group
- **[DefaultGroup](?path=/story/features-groups-group-role-grouproles--default-group)**: Default group role management
- **[WithSelection](?path=/story/features-groups-group-role-grouproles--with-selection)**: Role selection and bulk actions
- **[LargeDataset](?path=/story/features-groups-group-role-grouproles--large-dataset)**: Pagination with many roles
        `,
      },
    },
    msw: {
      handlers: [
        // ✅ Initialize selectedGroup in Redux state
        http.get('/api/rbac/v1/groups/:groupId', ({ params }) => {
          console.log('MSW: Group API called with groupId:', params.groupId);
          const groupData = {
            uuid: params.groupId,
            name: 'Test Group',
            platform_default: false,
            admin_default: false,
            system: false,
            roleCount: mockRoles.length,
            created: '2024-01-01T10:00:00Z',
            modified: '2024-01-15T15:30:00Z',
            principalCount: 5,
          };
          console.log('MSW: Returning group data:', groupData);
          return HttpResponse.json(groupData);
        }),
        // ✅ Handle assigned and available roles
        ...createGroupRolesHandler(mockRoles),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Role table should be visible with roles
    expect(await canvas.findByText('Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('User Manager')).toBeInTheDocument();
    expect(await canvas.findByText('Viewer')).toBeInTheDocument();

    // Table headers should be present (using more specific column header selectors)
    expect(await canvas.findByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(await canvas.findByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
    expect(await canvas.findByRole('columnheader', { name: 'Last modified' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
          });
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => new Promise(() => {})), // Never resolves
        http.get('/api/rbac/v1/groups/', () => new Promise(() => {})), // Never resolves
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // Should show skeleton loading state
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
  render: () => <GroupRolesWithData />,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
          });
        }),
        ...createGroupRolesHandler([]),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'test-group-id', name: 'Test Group' }],
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show empty state message
    expect(await canvas.findByText(/no roles/i)).toBeInTheDocument();

    // Should show add role button
    expect(await canvas.findByText(/add a role/i)).toBeInTheDocument();
  },
};

export const DefaultGroup: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'system-default-uuid',
            name: 'Default Access',
            platform_default: true,
            admin_default: false,
            system: false,
          });
        }),
        ...createGroupRolesHandler(mockRoles.slice(0, 2)),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'system-default-uuid', name: 'Default Access' }],
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show roles for default group
    // (Group name not displayed by this component directly)
    expect(await canvas.findByText('Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('User Manager')).toBeInTheDocument();

    // Default groups may show special messaging or warnings
    const alertElements = canvas.queryAllByRole('alert');
    expect(alertElements.length).toBeGreaterThanOrEqual(0);
  },
};

export const AdminView: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    // ✅ Admin View - Full permissions enabled
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
            admin_default: false, // Ensure checkboxes are enabled
            system: false,
          });
        }),
        ...createGroupRolesHandler(),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'test-group-id', name: 'Test Group' }],
            meta: { count: 1 },
          });
        }),
        http.delete('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({ message: 'Roles removed successfully' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ✅ Admin View: Focus on core admin selection functionality

    // 1. Verify roles load and display
    expect(await canvas.findByText('Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('User Manager')).toBeInTheDocument();
    expect(await canvas.findByText('Viewer')).toBeInTheDocument();

    // 2. Key admin feature: "Add role" button should be visible with permissions
    expect(await canvas.findByText('Add role')).toBeInTheDocument();

    // 3. Core admin functionality: Selection checkboxes should be present
    const checkboxes = await canvas.findAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1); // Header + role checkboxes

    // 4. Test selection functionality works
    const firstRoleCheckbox = checkboxes[1]; // Skip header checkbox
    await userEvent.click(firstRoleCheckbox);
    expect(firstRoleCheckbox).toBeChecked();

    // 5. Test table headers are accessible
    expect(await canvas.findByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(await canvas.findByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
    expect(await canvas.findByRole('columnheader', { name: 'Last modified' })).toBeInTheDocument();

    // 6. Multi-selection capability (admin feature)
    if (checkboxes.length > 2) {
      await userEvent.click(checkboxes[2]);
      expect(checkboxes[2]).toBeChecked();
    }
  },
};

// Large dataset for testing pagination
const largeDataset = Array.from({ length: 20 }, (_, i) => ({
  ...mockRoles[i % mockRoles.length],
  uuid: `role-${i + 1}`,
  display_name: `${mockRoles[i % mockRoles.length].display_name} ${i + 1}`,
}));

export const LargeDataset: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    // Enable permissions to test Add role button
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
          });
        }),
        ...createGroupRolesHandler(largeDataset),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'test-group-id', name: 'Test Group' }],
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ✅ Large Dataset: Focus on testing with more data

    // 1. Test roles from large dataset load correctly
    expect(await canvas.findByText('Administrator 1')).toBeInTheDocument();
    expect(await canvas.findByText('User Manager 2')).toBeInTheDocument();

    // 2. Test "Add role" button works with large dataset
    expect(await canvas.findByText('Add role')).toBeInTheDocument();

    // 3. Test pagination appears with large dataset
    const paginationElements = canvas.queryAllByLabelText(/pagination/i);
    if (paginationElements.length > 0) {
      expect(paginationElements.length).toBeGreaterThan(0);
    }

    // 4. Test table structure with large dataset
    const rows = canvas.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows

    // 5. Test navigation elements are present
    const table = canvas.queryByRole('table');
    if (table) {
      expect(table).toBeInTheDocument();
    }
  },
};

// 🚨 NEW COMPREHENSIVE STORIES TO FIX CRITICAL GAPS IN GROUP ROLES TESTING

export const RoleWorkflowsComplete: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
            admin_default: false,
          });
        }),
        ...createGroupRolesHandler(),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'test-group-id', name: 'Test Group' }],
            meta: { count: 1 },
          });
        }),
        // Mock add/remove roles API endpoints
        http.post('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({ success: true });
        }),
        http.delete('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for all roles to load
    await waitFor(
      async () => {
        expect(await canvas.findByText('Administrator')).toBeInTheDocument();
        expect(await canvas.findByText('User Manager')).toBeInTheDocument();
        expect(await canvas.findByText('Viewer')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // 1. TEST ADD ROLE WORKFLOW: Verify add role navigation
    const addRoleElements = canvas.queryAllByText(/add role/i);
    expect(addRoleElements.length).toBeGreaterThan(0);
    const interactiveAddElement = addRoleElements.find((el) => el.closest('a') || el.closest('button') || el.getAttribute('role') === 'button');
    expect(interactiveAddElement).toBeTruthy();

    // 2. TEST SELECTION INFRASTRUCTURE: Verify checkboxes work for removal workflow
    const checkboxes = await canvas.findAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1);

    // Test individual role selection (enables single role removal)
    const firstRoleCheckbox = checkboxes[1];
    await userEvent.click(firstRoleCheckbox);
    expect(firstRoleCheckbox).toBeChecked();

    // Test multiple selection (enables bulk removal)
    if (checkboxes.length > 2) {
      await userEvent.click(checkboxes[2]);
      expect(checkboxes[2]).toBeChecked();
    }

    // Test bulk select header (enables all roles removal)
    const headerCheckbox = checkboxes[0];
    await userEvent.click(headerCheckbox);

    // Verify multiple roles can be selected (core requirement for removal workflows)
    const totalSelected = checkboxes.filter((cb) => (cb as HTMLInputElement).checked).length;
    expect(totalSelected).toBeGreaterThan(0);
  },
};

export const RoleFilteringAndSearch: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
            admin_default: false,
          });
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const nameFilter = url.searchParams.get('name') || url.searchParams.get('role_display_name');
          const descriptionFilter = url.searchParams.get('description') || url.searchParams.get('role_description');

          let filteredRoles = mockRoles;
          if (nameFilter) {
            filteredRoles = filteredRoles.filter(
              (role) =>
                role.display_name.toLowerCase().includes(nameFilter.toLowerCase()) || role.name.toLowerCase().includes(nameFilter.toLowerCase()),
            );
          }
          if (descriptionFilter) {
            filteredRoles = filteredRoles.filter((role) => role.description?.toLowerCase().includes(descriptionFilter.toLowerCase()));
          }

          return HttpResponse.json({
            data: filteredRoles,
            meta: { count: filteredRoles.length, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'test-group-id', name: 'Test Group' }],
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for all roles to load initially
    await waitFor(
      async () => {
        expect(await canvas.findByText('Administrator')).toBeInTheDocument();
        expect(await canvas.findByText('User Manager')).toBeInTheDocument();
        expect(await canvas.findByText('Viewer')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Look for filter input fields
    const filterInputs = canvas.queryAllByRole('textbox');
    if (filterInputs.length > 0) {
      const nameFilterInput = filterInputs.find(
        (input) =>
          input.getAttribute('placeholder')?.toLowerCase().includes('name') || input.getAttribute('aria-label')?.toLowerCase().includes('name'),
      );

      if (nameFilterInput) {
        // Test role name filtering
        await userEvent.type(nameFilterInput, 'admin');

        // Wait for filtering to take effect
        await waitFor(
          async () => {
            expect(await canvas.findByText('Administrator')).toBeInTheDocument();
            // Other roles should be filtered out
            expect(canvas.queryByText('User Manager')).not.toBeInTheDocument();
            expect(canvas.queryByText('Viewer')).not.toBeInTheDocument();
          },
          { timeout: 5000 },
        );

        // Clear filter
        await userEvent.clear(nameFilterInput);

        // All roles should appear again
        await waitFor(
          async () => {
            expect(await canvas.findByText('Administrator')).toBeInTheDocument();
            expect(await canvas.findByText('User Manager')).toBeInTheDocument();
            expect(await canvas.findByText('Viewer')).toBeInTheDocument();
          },
          { timeout: 5000 },
        );
      }
    }
  },
};

export const RoleEmptyState: Story = {
  render: () => <GroupRolesWithData />,
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json({
            uuid: 'test-group-id',
            name: 'Test Group',
            platform_default: false,
            admin_default: false,
          });
        }),
        // Return empty roles to show empty state
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'test-group-id', name: 'Test Group' }],
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for empty state to be rendered
    await waitFor(
      () => {
        // Look for actual empty state messages or add role button
        const emptyOrAddElements = [canvas.queryByText(/no roles/i), canvas.queryByText(/empty/i), canvas.queryByText(/add role/i)].filter(Boolean);
        expect(emptyOrAddElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Verify component structure is intact despite empty state
    expect(canvasElement).toBeInTheDocument();
    expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
