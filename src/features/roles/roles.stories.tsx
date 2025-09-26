import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import Roles from './roles';

// Spy functions to track API calls
const fetchRolesSpy = fn();
const fetchAdminGroupSpy = fn();

// Mock role data
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Platform Administrator',
    display_name: 'Platform Administrator',
    description: 'Full access to all platform features',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 25,
    applications: ['rbac', 'inventory', 'cost-management'],
    modified: '2023-12-01T10:30:00Z',
    groups_in_count: 3,
    groups_in: [
      { uuid: 'group-1', name: 'Administrators', description: 'System administrators group' },
      { uuid: 'group-2', name: 'Platform Team', description: 'Platform engineering team' },
      { uuid: 'group-3', name: 'Super Users', description: 'Super user access group' },
    ],
    access: [
      { permission: 'rbac:*:*' },
      { permission: 'inventory:*:*' },
      { permission: 'cost-management:*:*' },
      { permission: 'insights:*:read' },
      { permission: 'vulnerability:*:read' },
    ],
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    display_name: 'Cost Management Viewer',
    description: 'View cost management data and reports',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 8,
    applications: ['cost-management'],
    modified: '2023-11-28T14:20:00Z',
    groups_in_count: 1,
    groups_in: [{ uuid: 'group-4', name: 'Finance Team', description: 'Finance and accounting team' }],
    access: [
      { permission: 'cost-management:*:read' },
      { permission: 'cost-management:report:read' },
      { permission: 'cost-management:resource:read' },
    ],
  },
  {
    uuid: 'role-3',
    name: 'Vulnerability Administrator',
    display_name: 'Vulnerability Administrator',
    description: 'Manage vulnerability scanning and remediation',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 12,
    applications: ['vulnerability'],
    modified: '2023-12-05T09:15:00Z',
    groups_in_count: 2,
    groups_in: [
      { uuid: 'group-5', name: 'Security Team', description: 'Security and compliance team' },
      { uuid: 'group-6', name: 'Operations', description: 'Operations and monitoring team' },
    ],
    access: [
      { permission: 'vulnerability:*:*' },
      { permission: 'vulnerability:system:read' },
      { permission: 'vulnerability:system:write' },
      { permission: 'vulnerability:report:read' },
    ],
  },
];

const mockAdminGroup = {
  uuid: 'admin-group-1',
  name: 'Default admin group',
  description: 'System generated admin group',
  system: true,
  platform_default: true,
  admin_default: true,
};

// Router decorator for components that use navigation
const withRouter = (Story: any) => (
  <BrowserRouter>
    <div style={{ minHeight: '600px' }}>
      <Story />
    </div>
  </BrowserRouter>
);

const meta: Meta<typeof Roles> = {
  component: Roles,
  tags: ['roles-container'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**Roles** is a container component that manages the roles list page at \`/iam/user-access/roles\`.

## Container Responsibilities
- **Redux State Management**: Manages role data, filters, pagination through Redux
- **API Orchestration**: Dispatches \`fetchRolesWithPolicies\` and \`fetchAdminGroup\` actions
- **Permission Context**: Uses \`orgAdmin\` and \`userAccessAdministrator\` from PermissionsContext
- **URL Synchronization**: Manages pagination and filters in URL parameters
- **Table Management**: Provides data and callbacks to TableToolbarView component

## Known Issue (TO BE FIXED)
This component currently makes unauthorized API calls for non-admin users, causing 403 error toast spam.
The stories below test both the bug scenario and expected behavior after fix.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminUserWithRoles: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Admin User View**: Tests complete roles management interface for organization administrators.

## Additional Test Stories

For testing specific scenarios and the permission bug, see these additional stories:

- **[NonAdminUserUnauthorizedCalls](?path=/story/features-roles-roles--non-admin-user-unauthorized-calls)**: Tests the BUG - non-admin users trigger unauthorized API calls
- **[LoadingState](?path=/story/features-roles-roles--loading-state)**: Tests container behavior during API loading
- **[EmptyRoles](?path=/story/features-roles-roles--empty-roles)**: Tests container response to empty role data

## Expected Fix Behavior
After the fix is applied, the NonAdminUserUnauthorizedCalls story should pass with zero API calls made.
        `,
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Roles API - successful response for admin users
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          console.log('🔍 MSW: Roles API called', request.url);
          fetchRolesSpy(request);
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);

          return HttpResponse.json({
            data: mockRoles.slice(offset, offset + limit),
            meta: {
              count: mockRoles.length,
              limit,
              offset,
            },
          });
        }),

        // Admin group API - successful response for admin users
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          console.log('🔍 MSW: Groups API called', request.url);
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            console.log('🔍 MSW: Admin group API matched');
            fetchAdminGroupSpy(request);
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          console.log('🔍 MSW: Groups API - not admin_default request');
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add debugging to see what's happening
    console.log('🔍 PLAY: Starting admin roles test');

    // Debug: Check spy call counts
    console.log('🔍 Roles spy calls:', fetchRolesSpy.mock.calls.length);
    console.log('🔍 Admin group spy calls:', fetchAdminGroupSpy.mock.calls.length);

    // Wait for container to load data through Redux
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Management Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Vulnerability Administrator')).toBeInTheDocument();

    // Verify admin users trigger API calls (expected behavior)
    expect(fetchRolesSpy).toHaveBeenCalled();
    expect(fetchAdminGroupSpy).toHaveBeenCalled();

    // Verify roles table is displayed with data
    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify role data is rendered through Redux state
    const tableContent = within(table);
    expect(await tableContent.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await tableContent.findByText('25')).toBeInTheDocument(); // accessCount
  },
};

export const NonAdminUserUnauthorizedCalls: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**BUG REPLICATION**: This story demonstrates the unauthorized API call issue for non-admin users.

## Current Behavior (BUG)
Non-admin users accessing \`/iam/user-access/roles\` trigger unauthorized API calls that result in 403 errors and toast spam.

## Expected Test Result: ❌ FAIL (shows the bug exists)
This test currently **FAILS** with: \`expect(spy).not.toHaveBeenCalled()\` because unauthorized calls ARE being made.

## Expected Behavior (AFTER FIX)  
Non-admin users should NOT trigger any API calls and should see a NotAuthorized component instead. The component should check permissions before making API requests.

## Test Validation
After the fix is applied, this test should **PASS** with zero API calls.
        `,
      },
    },

    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Roles API - returns 403 for non-admin users (simulates the production bug)
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          fetchRolesSpy(request);
          return new HttpResponse(
            JSON.stringify({
              error: 'You do not have permission to perform this action',
              request_id: 'd725af14b571411ea0b31be7215e560a',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }),

        // Admin group API - returns 403 for non-admin users
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            fetchAdminGroupSpy(request);
            return new HttpResponse(
              JSON.stringify({
                error: 'You do not have permission to perform this action',
                request_id: 'd725af14b571411ea0b31be7215e560a',
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await delay(300);

    console.log('🐛 BUG TEST: Non-admin roles spy calls:', fetchRolesSpy.mock.calls.length);
    console.log('🐛 BUG TEST: Non-admin admin group spy calls:', fetchAdminGroupSpy.mock.calls.length);

    // 🐛 BUG DEMONSTRATION: These tests currently FAIL because unauthorized API calls are made
    // This proves the bug exists - non-admin users trigger API calls when they shouldn't
    expect(fetchRolesSpy).not.toHaveBeenCalled();
    expect(fetchAdminGroupSpy).not.toHaveBeenCalled();

    // After fix: Verify NotAuthorized component is shown instead of making API calls
    expect(await canvas.findByText(/You do not have access to User Access Administration/i)).toBeInTheDocument();

    console.log('🧪 NON-ADMIN: NotAuthorized component shown, no unauthorized API calls made');
  },
};

export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests container behavior during API loading via Redux state management.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Never resolve to keep component in loading state
        http.get('/api/rbac/v1/roles/', async () => {
          await delay('infinite');
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
        http.get('/api/rbac/v1/groups/', async () => {
          await delay('infinite');
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);

    // Should show loading state while API calls are pending
    await waitFor(async () => {
      const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  },
};

export const EmptyRoles: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests container handling of empty role data from Redux.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Return empty data
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [mockAdminGroup],
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show empty state message for no roles
    await expect(canvas.findByText(/Configure roles/i)).resolves.toBeInTheDocument();
  },
};

// Additional spies for focused testing
const filterSpy = fn();
const sortSpy = fn();

export const AdminUserWithRolesFiltering: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests role filtering functionality with spy verification for admin users.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Roles API - supports filtering via display_name parameter
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const displayNameFilter = url.searchParams.get('display_name');

          console.log('🔍 MSW: Roles API called with display_name filter:', displayNameFilter);
          fetchRolesSpy(request);

          if (displayNameFilter) {
            filterSpy(displayNameFilter);
          }

          let filteredRoles = mockRoles;
          if (displayNameFilter) {
            filteredRoles = mockRoles.filter((role) => role.display_name.toLowerCase().includes(displayNameFilter.toLowerCase()));
          }

          return HttpResponse.json({
            data: filteredRoles,
            meta: {
              count: filteredRoles.length,
              limit: 20,
              offset: 0,
            },
          });
        }),

        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            fetchAdminGroupSpy(request);
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('🧪 FILTERING: Starting role filtering test');

    // Wait for initial data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Management Viewer')).toBeInTheDocument();

    // Test filtering functionality
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    expect(filterInput).toBeInTheDocument();

    // Test 1: Filter by "Platform"
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'Platform');

    await waitFor(() => {
      // Verify filter API was called with correct parameter
      expect(filterSpy).toHaveBeenCalledWith('Platform');
    });

    // Test 2: Filter by "Management"
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'Management');

    await waitFor(() => {
      expect(filterSpy).toHaveBeenCalledWith('Management');
    });

    // Test 3: Clear filter
    await userEvent.clear(filterInput);

    console.log('🧪 FILTERING: Role filtering test completed');
  },
};

export const AdminUserWithRolesExpandableContent: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests expandable row functionality for groups and permissions nested tables.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          fetchRolesSpy(request);
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),

        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            fetchAdminGroupSpy(request);
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('🧪 EXPANDABLE: Starting expandable content test');

    // Wait for initial data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Find the Platform Administrator row specifically
    const platformAdminRow = canvas.getByText('Platform Administrator').closest('tr');
    expect(platformAdminRow).toBeInTheDocument();

    if (!platformAdminRow) {
      throw new Error('Platform Administrator row not found');
    }

    // Test groups expandable content
    console.log('🧪 Testing groups expandable...');
    const groupsButton = within(platformAdminRow).getByRole('button', { name: '3' });
    expect(groupsButton).toBeInTheDocument();
    const row = within(groupsButton.closest('tbody') as HTMLElement);

    await userEvent.click(groupsButton);

    // Scope queries to the nested groups table within the expanded row
    const expandedGroupsRow = within(await row.findByLabelText('Compound groups table'));

    // Test nested groups table headers (they're <th> elements, not role="columnheader")
    expect(await expandedGroupsRow.findByText('Group name')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('Description')).toBeInTheDocument();

    // Test group data within the nested table only
    expect(await expandedGroupsRow.findByText('Administrators')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('System administrators group')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('Platform Team')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('Super Users')).toBeInTheDocument();

    // Test permissions expandable content
    console.log('🧪 Testing permissions expandable...');
    const permissionsButton = within(platformAdminRow).getByRole('button', { name: '25' });
    expect(permissionsButton).toBeInTheDocument();

    await userEvent.click(permissionsButton);

    // Scope queries to the nested permissions table within the expanded row
    const expandedPermissionsRow = within(await row.findByLabelText('Compound permissions table'));

    // Test nested permissions table headers (they're <th> elements, not role="columnheader")
    expect(await expandedPermissionsRow.findByText('Application')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('Resource type')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('Operation')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('Last modified')).toBeInTheDocument();

    // Test permission data within the nested table only
    expect(await expandedPermissionsRow.findByText('rbac')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('inventory')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('cost-management')).toBeInTheDocument();

    console.log('🧪 EXPANDABLE: Expandable content test completed');
  },
};

export const AdminUserWithRolesSorting: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests column sorting functionality with spy verification for sortable columns (Name, Last Modified).',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Roles API - supports sorting via order_by parameter
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const orderBy = url.searchParams.get('order_by');

          console.log('🔍 MSW: Roles API called with order_by:', orderBy);
          fetchRolesSpy(request);

          if (orderBy) {
            sortSpy(orderBy);
          }

          // Return roles (sorting would be handled server-side in real app)
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),

        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            fetchAdminGroupSpy(request);
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('🧪 SORTING: Starting column sorting test');

    // Wait for initial data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Test sorting by Name column (display_name)
    console.log('🧪 Testing Name column sorting...');
    let nameColumnHeader = await canvas.findByRole('columnheader', { name: /name/i });
    let nameButton = await within(nameColumnHeader).findByRole('button');

    // Reset spy
    sortSpy.mockClear();

    // Click to sort descending (reverses default ascending)
    await userEvent.click(nameButton);

    // Verify sort API was called with display_name descending
    await waitFor(() => {
      expect(sortSpy).toHaveBeenCalledWith('-display_name');
    });

    // Re-find the button after table re-render
    nameColumnHeader = await canvas.findByRole('columnheader', { name: /name/i });
    nameButton = await within(nameColumnHeader).findByRole('button');

    // Reset spy
    sortSpy.mockClear();

    // Click again to sort ascending
    await userEvent.click(nameButton);

    // Verify sort API was called with display_name ascending
    await waitFor(() => {
      expect(sortSpy).toHaveBeenCalledWith('display_name');
    });

    // Test sorting by Last Modified column
    console.log('🧪 Testing Last Modified column sorting...');
    let lastModifiedHeader = await canvas.findByRole('columnheader', { name: /last modified/i });
    let lastModifiedButton = await within(lastModifiedHeader).findByRole('button');

    // Reset spy
    sortSpy.mockClear();

    // Click to sort by modified date
    await userEvent.click(lastModifiedButton);

    // Verify sort API was called with modified
    await waitFor(() => {
      expect(sortSpy).toHaveBeenCalledWith('modified');
    });

    // Re-find the button after table re-render
    lastModifiedHeader = await canvas.findByRole('columnheader', { name: /last modified/i });
    lastModifiedButton = await within(lastModifiedHeader).findByRole('button');

    // Reset spy
    sortSpy.mockClear();

    // Click again for descending
    await userEvent.click(lastModifiedButton);

    // Verify sort API was called with modified descending
    await waitFor(() => {
      expect(sortSpy).toHaveBeenCalledWith('-modified');
    });

    console.log('🧪 SORTING: Column sorting test completed');
  },
};

export const AdminUserWithRolesPrimaryActions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests primary toolbar actions like Create Role button availability and functionality.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          fetchRolesSpy(request);
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),

        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            fetchAdminGroupSpy(request);
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('🧪 ACTIONS: Starting primary actions test');

    // Wait for data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Test Create Role button availability and state
    const createRoleButton = canvas.getByRole('button', { name: /create role/i });
    expect(createRoleButton).toBeInTheDocument();
    expect(createRoleButton).not.toBeDisabled();

    // Test row actions (kebab menus) availability
    const kebabMenus = canvas.getAllByLabelText(/kebab toggle/i);
    expect(kebabMenus.length).toBeGreaterThan(0);

    // Test first row kebab menu interaction
    const firstRowKebab = kebabMenus[0];
    await userEvent.click(firstRowKebab);

    console.log('🧪 ACTIONS: Primary actions test completed');
  },
};
