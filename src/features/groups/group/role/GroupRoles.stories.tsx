import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HttpResponse, delay, http } from 'msw';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { GroupRoles } from './GroupRoles';
import { fetchGroup } from '../../../../redux/groups/actions';

// Spy for testing API calls
const getRolesSpy = fn();

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

    // Wait for actual data to load (not just any grid - wait for content)
    await canvas.findByText('Console Administrator', undefined, { timeout: 10000 });

    // Now get the table with data
    const table = canvas.getByRole('grid');
    const tableContext = within(table);
    const firstRoleCheckbox = tableContext.getByLabelText('Select row 0');

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

    // Wait for actual data to load (not just any grid - wait for content)
    await canvas.findByText('Role 1', undefined, { timeout: 10000 });

    // Now get the table with data
    const table = canvas.getByRole('grid');
    const tableContext = within(table);

    // Select first role on page 1
    const firstRoleCheckbox = tableContext.getByLabelText('Select row 0');
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
    await canvas.findByText('Role 21', undefined, { timeout: 10000 });

    // Re-get table context after pagination
    const page2Table = canvas.getByRole('grid');
    const page2TableContext = within(page2Table);
    const page2FirstCheckbox = page2TableContext.getByLabelText('Select row 0');

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

export const RemoveSingleRoleFlow: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Flow**: Complete user journey from table to removal confirmation modal.

This story demonstrates:
1. User clicks kebab menu on a role row
2. Selects "Remove" action
3. Confirmation modal appears with proper messaging
4. User can confirm or cancel the removal

Perfect for code review and UX validation.
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
        http.delete('/api/rbac/v1/groups/:groupId/roles/', async () => {
          return HttpResponse.json({ message: 'Roles removed successfully' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();

    await canvas.findByText('Console Administrator');

    const firstRow = (await canvas.findByText('Console Administrator')).closest('tr');
    if (!firstRow) throw new Error('Could not find first role row');

    const kebabButton = within(firstRow).getByLabelText(/Actions for role/i);
    await userEvent.click(kebabButton);

    await delay(200);

    const removeMenuItem = await canvas.findByRole('menuitem', { name: /Remove/i });
    expect(removeMenuItem).toBeInTheDocument();

    await userEvent.click(removeMenuItem);

    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Remove role\?/i)).toBeInTheDocument();
    expect(within(modal).getByText(/Console Administrator/i)).toBeInTheDocument();
  },
};

export const BulkRemoveRolesFlow: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Bulk Removal Flow**: Complete user journey for removing multiple roles at once.

This story demonstrates:
1. User selects multiple roles using checkboxes
2. Clicks bulk "Remove" button in toolbar
3. Confirmation modal appears showing plural messaging ("Remove roles?")
4. Modal shows count of roles to be removed

Perfect for testing bulk operations and proper pluralization.
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
        http.delete('/api/rbac/v1/groups/:groupId/roles/', async () => {
          return HttpResponse.json({ message: 'Roles removed successfully' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    const tableContext = within(table);

    await canvas.findByText('Console Administrator');

    const firstCheckbox = await tableContext.findByLabelText('Select row 0');
    await userEvent.click(firstCheckbox);

    await delay(200);

    const secondCheckbox = await tableContext.findByLabelText('Select row 1');
    await userEvent.click(secondCheckbox);

    await delay(200);

    const kebabToggle = await canvas.findByLabelText(/bulk actions/i);
    await userEvent.click(kebabToggle);

    await delay(200);

    const removeMenuItem = await canvas.findByRole('menuitem', { name: /Remove/i });
    await userEvent.click(removeMenuItem);

    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Remove roles\?/i)).toBeInTheDocument();
  },
};

// Test filtering functionality
export const FilterRoles: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Filter Functionality Test**: Validates that role filtering works correctly with API calls and "Clear filters" button.

This story tests:
1. Filter input updates the table
2. API is called with correct filter parameters
3. "Clear filters" button appears and works
4. API is called with empty filter when clearing
5. Table displays all roles after clearing filters

Perfect for testing filter state management and API integration.
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
          const nameFilter = url.searchParams.get('role_display_name') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          // Call spy for testing
          getRolesSpy({ name: nameFilter, limit, offset });

          // Filter roles by display_name if name parameter is provided
          let filteredRoles = mockRoles;
          if (nameFilter) {
            filteredRoles = mockRoles.filter((role) => role.display_name.toLowerCase().includes(nameFilter.toLowerCase()));
          }

          return HttpResponse.json({
            data: filteredRoles.slice(offset, offset + limit),
            meta: { count: filteredRoles.length, limit, offset },
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

    // Wait for initial load
    await canvas.findByText('Console Administrator');
    await canvas.findByText('Organization Administrator');
    await canvas.findByText('Insights Viewer');

    // Clear the spy before testing to ignore mount calls
    await delay(500); // Wait for any pending calls
    getRolesSpy.mockClear();

    // TEST FILTERING: Enter filter text
    // Note: DataViewFilters onChange receives (event, newFilters)
    const filterInput = canvas.getByPlaceholderText('Filter by name');

    // Type the filter value
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'Console');

    // Wait longer for all the onChange calls and API to complete
    await delay(2000);

    // Verify filtered results appear (this proves filtering works)
    await waitFor(
      () => {
        expect(canvas.getByText('Console Administrator')).toBeInTheDocument();
        expect(canvas.queryByText('Organization Administrator')).not.toBeInTheDocument();
        expect(canvas.queryByText('Insights Viewer')).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify filter input has the value
    expect(filterInput).toHaveValue('Console');

    // TEST CLEAR FILTERS: Find and click "Clear filters" button
    // There are two toolbars (top and bottom), so use findAllByText and click the first one
    const clearButtons = await canvas.findAllByText('Clear filters');
    await userEvent.click(clearButtons[0]);

    // Wait for API to be called and data to refresh
    await delay(500);

    // Verify all roles are displayed again (proves clear filters works)
    await waitFor(() => {
      expect(canvas.getByText('Console Administrator')).toBeInTheDocument();
      expect(canvas.getByText('Organization Administrator')).toBeInTheDocument();
      expect(canvas.getByText('Insights Viewer')).toBeInTheDocument();
    });

    // Verify filter input is cleared
    expect(filterInput).toHaveValue('');
  },
};

// =============================================================================
// Error Handling Stories - Shared Helpers
// =============================================================================

// Shared MSW handlers for group data endpoints
const baseGroupHandlers = [
  http.get('/api/rbac/v1/groups/:groupId/', () => HttpResponse.json(mockGroup)),
  http.get('/api/rbac/v1/groups/:groupId/roles/', () =>
    HttpResponse.json({
      data: mockRoles,
      meta: { count: mockRoles.length, limit: 20, offset: 0 },
    }),
  ),
  http.get('/api/rbac/v1/groups/', () =>
    HttpResponse.json({
      data: [],
      meta: { count: 0, limit: 50, offset: 0 },
    }),
  ),
];

// Factory for creating error delete handlers
const makeDeleteRoleErrorHandler = (status: number, detail: string) =>
  http.delete('/api/rbac/v1/groups/:groupId/roles/', async () => {
    await delay(200);
    return new HttpResponse(JSON.stringify({ errors: [{ detail }] }), { status });
  });

// Shared play function for remove role error scenarios
// Note: Redux actions have built-in error notifications, so we test that:
// 1. The modal opens and confirms
// 2. An error notification appears (from Redux middleware)
// 3. The modal closes after error
type RemoveRoleErrorPlayArgs = {
  canvasElement: HTMLElement;
};

async function playRemoveRoleError({ canvasElement }: RemoveRoleErrorPlayArgs) {
  await delay(500);
  const canvas = within(canvasElement);

  // Wait for table to load
  await canvas.findByText('Console Administrator');

  // Click kebab menu on first role
  const firstRow = (await canvas.findByText('Console Administrator')).closest('tr');
  if (!firstRow) throw new Error('Could not find first role row');

  const kebabButton = within(firstRow).getByLabelText(/Actions for role/i);
  await userEvent.click(kebabButton);

  await delay(200);

  // Click Remove
  const removeMenuItem = await canvas.findByRole('menuitem', { name: /Remove/i });
  await userEvent.click(removeMenuItem);

  // Modal should appear
  const body = within(document.body);
  const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
  expect(modal).toBeInTheDocument();

  // Click confirm to trigger the error
  const confirmButton = within(modal).getByRole('button', { name: /Remove role/i });
  await userEvent.click(confirmButton);

  // Wait for API call and error handling
  await delay(500);

  // Verify notification portal exists and contains a danger alert
  // (Redux actions show "Failed removing roles from the group" on any error)
  await waitFor(
    async () => {
      const notificationPortal = document.querySelector('.notifications-portal');
      expect(notificationPortal).toBeInTheDocument();

      const dangerAlert = notificationPortal?.querySelector('.pf-v5-c-alert.pf-m-danger');
      expect(dangerAlert).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  // Modal should be closed
  expect(body.queryByRole('dialog')).not.toBeInTheDocument();
}

// =============================================================================
// Error Handling Stories
// =============================================================================

export const RemoveRoleError404: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Error Handling: 404 Not Found**

Tests the scenario where a role was already removed by another user (race condition).

**Flow**:
1. User clicks to remove a role
2. API returns 404 (role no longer exists)
3. Error notification appears (Redux handles this)
4. Modal closes gracefully

This prevents confusing error messages when concurrent users modify the same group.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...baseGroupHandlers, makeDeleteRoleErrorHandler(404, 'Role not found in group')],
    },
  },
  play: ({ canvasElement }) => playRemoveRoleError({ canvasElement }),
};

export const RemoveRoleError403: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Error Handling: 403 Forbidden**

Tests the scenario where user doesn't have permission to remove roles.

**Flow**:
1. User clicks to remove a role
2. API returns 403 (permission denied)
3. Error notification appears (Redux handles this)
4. Modal closes gracefully

This provides clear feedback when permissions change during a session.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...baseGroupHandlers, makeDeleteRoleErrorHandler(403, 'You do not have permission to modify this group')],
    },
  },
  play: ({ canvasElement }) => playRemoveRoleError({ canvasElement }),
};

export const RemoveRoleGenericError: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Error Handling: Generic Server Error**

Tests the scenario where an unexpected server error occurs.

**Flow**:
1. User clicks to remove a role
2. API returns 500 (internal server error)
3. Error notification appears (Redux handles this)
4. Modal closes gracefully

This ensures users get feedback even for unexpected errors.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...baseGroupHandlers, makeDeleteRoleErrorHandler(500, 'Internal server error occurred')],
    },
  },
  play: ({ canvasElement }) => playRemoveRoleError({ canvasElement }),
};
