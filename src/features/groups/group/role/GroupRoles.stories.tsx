import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HttpResponse, http } from 'msw';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { GroupRoles } from './GroupRoles';
import { fetchGroup } from '../../../../redux/groups/actions';

// Regular group roles (custom roles assigned by admins)
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

// Admin default group roles (system/platform defaults that apply to ALL users)
const mockDefaultGroupRoles = [
  {
    uuid: 'default-role-1',
    name: 'User Access administrator',
    display_name: 'User Access administrator',
    description: 'Perform any available operation against any User Access resource',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 25,
  },
  {
    uuid: 'default-role-2',
    name: 'Inventory Hosts Viewer',
    display_name: 'Inventory Hosts Viewer',
    description: 'A viewer role that grants read permissions on Inventory Hosts and groups',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 8,
  },
  {
    uuid: 'default-role-3',
    name: 'Automation Analytics Viewer',
    display_name: 'Automation Analytics Viewer',
    description: 'A viewer role that grants read permissions on Automation Analytics',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 5,
  },
  {
    uuid: 'default-role-4',
    name: 'Compliance Viewer',
    display_name: 'Compliance Viewer',
    description: 'A viewer role that grants read permissions on Compliance',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 12,
  },
  {
    uuid: 'default-role-5',
    name: 'Remediations User',
    display_name: 'Remediations User',
    description: 'A user role that grants read and execute permissions on Remediations',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 15,
  },
  {
    uuid: 'default-role-6',
    name: 'Subscriptions Viewer',
    display_name: 'Subscriptions Viewer',
    description: 'A viewer role that grants read permissions on Subscriptions',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 6,
  },
  {
    uuid: 'default-role-7',
    name: 'Cost Price List Viewer',
    display_name: 'Cost Price List Viewer',
    description: 'A viewer role that grants read permissions on Cost Management Price List',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 4,
  },
  {
    uuid: 'default-role-8',
    name: 'Advisor Viewer',
    display_name: 'Advisor Viewer',
    description: 'A viewer role that grants read permissions on Insights Advisor',
    system: true,
    platform_default: true,
    created: '2020-01-01T00:00:00.000Z',
    modified: '2020-01-01T00:00:00.000Z',
    policyCount: 1,
    accessCount: 10,
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
  tags: ['custom-css'], // NO autodocs on meta
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
  tags: ['autodocs', 'perm:user-access-admin'],
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
          const excluded = url.searchParams.get('excluded');

          // Handle fetchAddRolesForGroup (excluded=true) - available roles not in group
          if (excluded === 'true') {
            const availableRoles = [
              { uuid: 'role-4', name: 'Cost Administrator', display_name: 'Cost Administrator', description: 'Manage cost data' },
              { uuid: 'role-5', name: 'Compliance Viewer', display_name: 'Compliance Viewer', description: 'View compliance reports' },
            ];
            return HttpResponse.json({
              data: availableRoles.slice(offset, offset + limit),
              meta: { count: availableRoles.length, limit, offset },
            });
          }

          // Handle fetchRolesForGroup (excluded=false/undefined) - roles in group
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
          console.log('SB: 🗑️ Remove roles API called:', { groupId: params.groupId, roles: requestBody.roles });
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

    // CRITICAL: Verify Add role button is present AND enabled (production bug fix)
    // The bug was that fetchAddRolesForGroup wasn't called on mount, causing button to be disabled
    const addRoleButton = await canvas.findByRole('button', { name: /add role/i });
    expect(addRoleButton).toBeInTheDocument();

    // Wait for addRoles state to populate (from fetchAddRolesForGroup call on mount)
    await waitFor(
      () => {
        expect(addRoleButton).not.toBeDisabled();
      },
      { timeout: 5000 },
    );

    // Test individual role actions - find actions menu for Console Administrator role
    const actionButton = await canvas.findByRole('button', { name: /actions for role console administrator/i });
    expect(actionButton).toBeInTheDocument();
  },
};

export const WithoutPermissions: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Read-Only View**: User without permissions sees roles but cannot edit.

**Key Behavior**:
- ❌ No "Add Role" button (user lacks \`user-access-admin\` permission)
- ❌ No checkboxes for selection (no edit permissions)
- ✅ Can view role list (read-only access)
- ❌ No kebab menu actions on individual roles

**Contrast with DefaultGroupRoles**: That story shows a user WITH permissions viewing an admin default group, where the button exists but is disabled.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', () => {
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const excluded = url.searchParams.get('excluded');

          // Even though user can't add roles, the API call still happens on mount
          if (excluded === 'true') {
            return HttpResponse.json({
              data: [{ uuid: 'role-4', name: 'Cost Administrator', display_name: 'Cost Administrator' }],
              meta: { count: 1, limit: 20, offset: 0 },
            });
          }

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

    // CRITICAL: Verify no Add role button (no permissions means button not rendered at all)
    expect(canvas.queryByRole('button', { name: /add role/i })).not.toBeInTheDocument();

    // Verify no bulk select checkbox (no edit permissions)
    expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();

    // Verify no kebab menu actions (read-only)
    expect(canvas.queryByRole('button', { name: /actions for role/i })).not.toBeInTheDocument();
  },
};

export const DefaultGroupRoles: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Admin Default Group**: User WITH permissions viewing a system default group.

**Key Behavior** (visually identical to WithoutPermissions but for different reason):
- ❌ "Add Role" button NOT RENDERED (admin_default group protection - see line 311 in useGroupRoles.tsx)
- ❌ No checkboxes for selection (default groups are protected)
- ❌ No kebab menu actions (default groups are protected)

**Why this story exists**:
Although the UI looks the same as WithoutPermissions, the code path is different:
- \`WithoutPermissions\`: \`!hasPermissions = true\` → button not rendered
- \`DefaultGroupRoles\`: \`isAdminDefault = true\` → button not rendered

**Business Rule**: Admin default groups contain roles that apply to all users in the organization. Even users WITH admin permissions cannot modify them to prevent accidental changes to baseline permissions.

**Code**: \`if (!hasPermissions || isAdminDefault) { return []; }\` in useGroupRoles.tsx line 311
        `,
      },
    },
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
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const excluded = url.searchParams.get('excluded');

          // Handle fetchAddRolesForGroup - No available roles (all system roles already in default group)
          if (excluded === 'true') {
            return HttpResponse.json({
              data: [], // No roles to add - all system defaults already included
              meta: { count: 0, limit: 20, offset: 0 },
            });
          }

          // Handle fetchRolesForGroup - return SYSTEM/PLATFORM DEFAULT roles (8 roles)
          return HttpResponse.json({
            data: mockDefaultGroupRoles,
            meta: { count: mockDefaultGroupRoles.length, limit: 20, offset: 0 },
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

    // CRITICAL: Verify DIFFERENT roles than WithoutPermissions (system/platform defaults, not custom roles)
    // This proves we're actually testing admin default group behavior, not just permissions
    expect(await canvas.findByText('User Access administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Inventory Hosts Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Automation Analytics Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Compliance Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Remediations User')).toBeInTheDocument();
    expect(await canvas.findByText('Subscriptions Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Price List Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Advisor Viewer')).toBeInTheDocument();

    // Verify these are NOT the same roles as WithoutPermissions story
    expect(canvas.queryByText('Console Administrator')).not.toBeInTheDocument();
    expect(canvas.queryByText('Organization Administrator')).not.toBeInTheDocument();

    // CRITICAL: For admin default groups, button is NOT rendered (line 311: if (!hasPermissions || isAdminDefault))
    // This is IDENTICAL behavior to WithoutPermissions, but code path is different:
    // - WithoutPermissions: !hasPermissions = true → no button
    // - DefaultGroupRoles: isAdminDefault = true → no button
    expect(canvas.queryByRole('button', { name: /add role/i })).not.toBeInTheDocument();

    // Verify no bulk select for admin default groups (protected from modifications)
    expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();

    // Verify no individual role actions (protected from modifications)
    expect(canvas.queryByRole('button', { name: /actions for role/i })).not.toBeInTheDocument();
  },
};

export const BulkSelection: Story = {
  tags: ['perm:user-access-admin'],
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
          console.log('SB: 🗑️ Bulk remove roles API called:', { groupId: params.groupId, roles: requestBody.roles });
          return HttpResponse.json({ message: `${requestBody.roles.length} roles removed successfully` });
        }),
        // Mock refresh after remove
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          console.log('SB: 🔄 Refreshing roles after remove');
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

    // Wait for table to load and get first row checkbox
    const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
    const tableContext = within(table);
    const firstRoleCheckbox = await tableContext.findByLabelText('Select row 0');

    await userEvent.click(firstRoleCheckbox);
    expect(firstRoleCheckbox).toBeChecked();

    // Verify bulk actions toggle button appears after selecting a row
    await canvas.findByLabelText('Bulk select toggle');

    // Test bulk select page - click the bulk select checkbox (selects all on current page)
    const bulkSelectCheckbox = await canvas.findByLabelText('Select page');
    await userEvent.click(bulkSelectCheckbox);

    // All row checkboxes should now be checked
    const row1Checkbox = tableContext.getByLabelText('Select row 1');
    const row2Checkbox = tableContext.getByLabelText('Select row 2');
    expect(firstRoleCheckbox).toBeChecked();
    expect(row1Checkbox).toBeChecked();
    expect(row2Checkbox).toBeChecked();
  },
};

// Generate many roles for pagination testing
const generateManyRoles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    uuid: `role-${i + 1}`,
    name: `Role ${i + 1}`,
    display_name: `Role ${i + 1}`,
    description: `Description for role ${i + 1}`,
    system: false,
    platform_default: false,
    created: new Date(2023, 0, i + 1).toISOString(),
    modified: new Date(2023, 1, i + 1).toISOString(),
    policyCount: Math.floor(Math.random() * 20) + 1,
    accessCount: Math.floor(Math.random() * 50) + 1,
  }));
};

const manyRoles = generateManyRoles(25);

export const BulkSelectionPaginated: Story = {
  tags: ['perm:user-access-admin'],
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
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const pageData = manyRoles.slice(offset, offset + limit);

          return HttpResponse.json({
            data: pageData,
            meta: { count: manyRoles.length, limit, offset },
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
    const tableContext = within(table);

    // Select first role on page 1
    const firstRoleCheckbox = await tableContext.findByLabelText('Select row 0');
    await userEvent.click(firstRoleCheckbox);
    expect(firstRoleCheckbox).toBeChecked();

    // Click the bulk select checkbox to select all on current page
    const bulkSelectCheckbox = await canvas.findByLabelText('Select page');
    await userEvent.click(bulkSelectCheckbox);

    // Verify multiple rows are checked on page 1 (20 items)
    const row1Checkbox = tableContext.getByLabelText('Select row 1');
    const row5Checkbox = tableContext.getByLabelText('Select row 5');
    const row10Checkbox = tableContext.getByLabelText('Select row 10');
    expect(firstRoleCheckbox).toBeChecked();
    expect(row1Checkbox).toBeChecked();
    expect(row5Checkbox).toBeChecked();
    expect(row10Checkbox).toBeChecked();

    // Navigate to page 2 using pagination (use getAllByLabelText since we have top and bottom pagination)
    const nextPageButtons = canvas.getAllByLabelText('Go to next page');
    await userEvent.click(nextPageButtons[0]); // Click the first (top) pagination button

    // Wait for page 2 to load - should have 5 items (25 total - 20 on page 1)
    const page2FirstCheckbox = await tableContext.findByLabelText('Select row 0');

    // Page 2 items should NOT be selected (page-level selection only)
    expect(page2FirstCheckbox).not.toBeChecked();
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
  tags: ['perm:user-access-admin'],
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
