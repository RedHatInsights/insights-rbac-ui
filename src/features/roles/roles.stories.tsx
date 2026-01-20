import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { Roles } from './Roles';
import { withRouter } from '../../../.storybook/helpers/router-test-utils';
import {
  PAGINATION_TEST_DEFAULT_PER_PAGE,
  PAGINATION_TEST_SMALL_PER_PAGE,
  PAGINATION_TEST_TOTAL_ITEMS,
  expectLocationParams,
  getLastCallArg,
  openPerPageMenu,
  selectPerPage,
} from '../../../.storybook/helpers/pagination-test-utils';

// Spy functions to track API calls
const fetchRolesSpy = fn();
const fetchAdminGroupSpy = fn();
const paginationSpy = fn();

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

// Larger dataset for pagination stories (must exceed perPage to enable next/prev)
const mockRolesLarge = Array.from({ length: PAGINATION_TEST_TOTAL_ITEMS }, (_v, idx) => {
  const i = idx + 1;
  return {
    uuid: `role-${i}`,
    name: `Role ${i}`,
    display_name: `Role ${i}`,
    description: `Role description ${i}`,
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 1,
    applications: ['rbac'],
    modified: '2023-12-01T10:30:00Z',
    groups_in_count: 0,
    groups_in: [],
    access: [{ permission: 'rbac:*:*' }],
  };
});

const meta: Meta<typeof Roles> = {
  component: Roles,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
**Roles** is a container component that manages the roles list page at \`/iam/user-access/roles\`.

## Container Responsibilities
- **Data Fetching**: Uses TanStack Query hooks for role data and admin group
- **Permission Context**: Uses \`orgAdmin\` and \`userAccessAdministrator\` from PermissionsContext
- **URL Synchronization**: Manages pagination and filters in URL parameters
- **Table Management**: Provides data and callbacks to TableView component
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminUserWithRoles: Story = {
  tags: ['autodocs', 'perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Admin User View**: Tests complete roles management interface for organization administrators.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[NonAdminUserUnauthorizedCalls](?path=/story/features-roles-roles--non-admin-user-unauthorized-calls)**: Verifies non-admin users see UnauthorizedAccess and make no API calls
- **[LoadingState](?path=/story/features-roles-roles--loading-state)**: Tests container behavior during API loading
- **[EmptyRoles](?path=/story/features-roles-roles--empty-roles)**: Tests container response to empty role data
        `,
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Roles API - successful response for admin users with detailed logging
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          const displayNameFilter = url.searchParams.get('display_name');
          const orderBy = url.searchParams.get('order_by');

          console.log('SB: 🔍 MSW: Roles API called', {
            url: request.url,
            displayNameFilter:
              displayNameFilter === null ? 'NULL (no parameter)' : displayNameFilter === '' ? 'EMPTY STRING' : `"${displayNameFilter}"`,
            orderBy,
            limit,
            offset,
          });

          fetchRolesSpy(request);

          // Apply display_name filtering ONLY if provided and not empty
          // Note: mappedProps filters out empty strings, so when clearing filters,
          // the display_name parameter won't be in the URL at all (displayNameFilter will be null)
          let filteredRoles = [...mockRoles];
          if (displayNameFilter && displayNameFilter.trim() !== '') {
            console.log('SB: 🔍 MSW: Applying display_name filter:', displayNameFilter);
            filteredRoles = filteredRoles.filter(
              (role) =>
                role.name.toLowerCase().includes(displayNameFilter.toLowerCase()) ||
                (role.display_name && role.display_name.toLowerCase().includes(displayNameFilter.toLowerCase())) ||
                (role.description && role.description.toLowerCase().includes(displayNameFilter.toLowerCase())),
            );
            console.log('SB: 🔍 MSW: Filtered roles count:', filteredRoles.length);
          } else {
            console.log('SB: 🔍 MSW: No filter (displayNameFilter is null or empty), returning all', mockRoles.length, 'roles');
          }

          // Apply sorting based on order_by parameter
          if (orderBy) {
            const isDescending = orderBy.startsWith('-');
            const sortField = isDescending ? orderBy.slice(1) : orderBy;

            filteredRoles.sort((a, b) => {
              let aVal: string | number = '';
              let bVal: string | number = '';

              if (sortField === 'display_name' || sortField === 'name') {
                aVal = (a.display_name || a.name || '').toLowerCase();
                bVal = (b.display_name || b.name || '').toLowerCase();
              } else if (sortField === 'modified') {
                aVal = new Date(a.modified || 0).getTime();
                bVal = new Date(b.modified || 0).getTime();
              }

              if (aVal < bVal) return isDescending ? 1 : -1;
              if (aVal > bVal) return isDescending ? -1 : 1;
              return 0;
            });
          }

          const response = {
            data: filteredRoles.slice(offset, offset + limit),
            meta: {
              count: filteredRoles.length,
              limit,
              offset,
            },
            // Include filters and pagination for Redux state management
            // When displayNameFilter is null (parameter not in URL), use empty string for Redux
            filters: {
              display_name: displayNameFilter || '',
            },
            pagination: {
              count: filteredRoles.length,
              limit,
              offset,
            },
          };

          console.log('SB: 🔍 MSW: Returning', response.data.length, 'roles, total count:', response.meta.count);

          return HttpResponse.json(response);
        }),

        // Admin group API - successful response for admin users
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          console.log('SB: 🔍 MSW: Groups API called', request.url);
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            console.log('SB: 🔍 MSW: Admin group API matched');
            fetchAdminGroupSpy(request);
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          console.log('SB: 🔍 MSW: Groups API - not admin_default request');
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for debounced functions to settle
    await delay(300);

    // Add debugging to see what's happening
    console.log('SB: 🔍 PLAY: Starting admin roles test');

    // Debug: Check spy call counts
    console.log('SB: 🔍 Roles spy calls:', fetchRolesSpy.mock.calls.length);
    console.log('SB: 🔍 Admin group spy calls:', fetchAdminGroupSpy.mock.calls.length);

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
**Non-Admin User Access**: Verifies that non-admin users do not trigger unauthorized API calls.

Non-admin users should see a NotAuthorized component and make zero API calls to the roles or admin group endpoints.
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

    // Verify no API calls were made
    expect(fetchRolesSpy).not.toHaveBeenCalled();
    expect(fetchAdminGroupSpy).not.toHaveBeenCalled();

    // Verify NotAuthorized component is shown
    expect(await canvas.findByText(/You do not have access to User Access Administration/i)).toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  tags: ['perm:org-admin'],
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
  tags: ['perm:org-admin'],
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
        // Return empty data for roles
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          console.log('SB: 🔍 EmptyRoles: Roles API called', request.url);
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

    // Wait for debounced functions to settle
    await delay(300);

    // Should show empty state message for no roles - "Configure roles"
    await expect(canvas.findByText(/Configure roles/i)).resolves.toBeInTheDocument();
  },
};

// Additional spies for focused testing
const filterSpy = fn();
const sortSpy = fn();

export const AdminUserWithRolesFiltering: Story = {
  tags: ['perm:org-admin'],
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
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);

          console.log(
            'SB: 🔍 MSW: Roles API called with display_name filter:',
            displayNameFilter === null ? 'NULL (no parameter)' : displayNameFilter === '' ? 'EMPTY STRING' : `"${displayNameFilter}"`,
          );
          fetchRolesSpy(request);

          if (displayNameFilter) {
            filterSpy(displayNameFilter);
          }

          // Apply display_name filtering ONLY if provided and not empty
          // mappedProps filters out empty strings, so when clearing filters,
          // the display_name parameter won't be in the URL (displayNameFilter will be null)
          let filteredRoles = mockRoles;
          if (displayNameFilter && displayNameFilter.trim() !== '') {
            console.log('SB: 🔍 MSW: Filtering to', displayNameFilter);
            filteredRoles = mockRoles.filter(
              (role) =>
                role.name.toLowerCase().includes(displayNameFilter.toLowerCase()) ||
                (role.display_name && role.display_name.toLowerCase().includes(displayNameFilter.toLowerCase())) ||
                (role.description && role.description.toLowerCase().includes(displayNameFilter.toLowerCase())),
            );
          } else {
            console.log('SB: 🔍 MSW: No filter, returning all', mockRoles.length, 'roles');
          }

          return HttpResponse.json({
            data: filteredRoles,
            meta: {
              count: filteredRoles.length,
              limit,
              offset,
            },
            // Include filters and pagination for Redux state management
            // When displayNameFilter is null (not in URL), use empty string for Redux
            filters: {
              display_name: displayNameFilter || '',
            },
            pagination: {
              count: filteredRoles.length,
              limit,
              offset,
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

    // Wait for debounced functions to settle
    await delay(300);

    console.log('SB: 🧪 FILTERING: Starting role filtering test');

    // Clear spy to ensure clean state (spies persist across stories)
    filterSpy.mockClear();

    // Wait for initial data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Management Viewer')).toBeInTheDocument();

    // Test filtering functionality
    const filterInput = await canvas.findByPlaceholderText(/filter by name/i);
    expect(filterInput).toBeInTheDocument();

    // Test 1: Filter by "vulner" - should match "Vulnerability Administrator"
    console.log('SB: 🧪 FILTERING: Typing "vulner" filter');
    await userEvent.type(filterInput, 'vulner');

    // Wait for debounce + Redux state update + re-render
    await waitFor(
      () => {
        expect(filterSpy).toHaveBeenCalledWith('vulner');
      },
      { timeout: 3000 },
    );

    // Wait for the filtered data to render - Platform Administrator should disappear
    await waitFor(
      () => {
        expect(canvas.queryByText('Platform Administrator')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify only Vulnerability Administrator is visible
    expect(await canvas.findByText('Vulnerability Administrator')).toBeInTheDocument();
    expect(canvas.queryByText('Cost Management Viewer')).not.toBeInTheDocument();

    // Test 2: Clear filter by clicking the Clear filters button
    console.log('SB: 🧪 FILTERING: Clicking clear filters button');
    const clearFiltersButton = await canvas.findByRole('button', { name: /clear filters/i });
    expect(clearFiltersButton).toBeInTheDocument();

    filterSpy.mockClear();
    await userEvent.click(clearFiltersButton);

    // Wait for API call and table refresh
    console.log('SB: 🧪 FILTERING: Waiting for clear to complete...');
    await delay(600);

    // All roles should be visible again after clearing
    console.log('SB: 🧪 FILTERING: Verifying all roles are back...');
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Management Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Vulnerability Administrator')).toBeInTheDocument();

    console.log('SB: 🧪 FILTERING: Role filtering test completed successfully');
  },
};

export const AdminUserWithRolesExpandableContent: Story = {
  tags: ['perm:org-admin'],
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

    // Wait for debounced functions to settle
    await delay(300);

    console.log('SB: 🧪 EXPANDABLE: Starting expandable content test');

    // Wait for initial data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Find the Platform Administrator row specifically
    const platformAdminRow = canvas.getByText('Platform Administrator').closest('tr');
    expect(platformAdminRow).toBeInTheDocument();

    if (!platformAdminRow) {
      throw new Error('Platform Administrator row not found');
    }

    // Test groups expandable content
    console.log('SB: 🧪 Testing groups expandable...');
    const groupsButton = within(platformAdminRow).getByRole('button', { name: '3' });
    expect(groupsButton).toBeInTheDocument();
    const row = within(groupsButton.closest('tbody') as HTMLElement);

    await userEvent.click(groupsButton);

    // Scope queries to the nested groups table within the expanded row
    const expandedGroupsRow = within(await row.findByLabelText(/Groups for role/i));

    // Test nested groups table headers (they're <th> elements, not role="columnheader")
    expect(await expandedGroupsRow.findByText('Group name')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('Description')).toBeInTheDocument();

    // Test group data within the nested table only
    expect(await expandedGroupsRow.findByText('Administrators')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('System administrators group')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('Platform Team')).toBeInTheDocument();
    expect(await expandedGroupsRow.findByText('Super Users')).toBeInTheDocument();

    // Test permissions expandable content
    console.log('SB: 🧪 Testing permissions expandable...');
    const permissionsButton = within(platformAdminRow).getByRole('button', { name: '25' });
    expect(permissionsButton).toBeInTheDocument();

    await userEvent.click(permissionsButton);

    // Scope queries to the nested permissions table within the expanded row
    const expandedPermissionsRow = within(await row.findByLabelText(/Permissions for role/i));

    // Test nested permissions table headers (they're <th> elements, not role="columnheader")
    expect(await expandedPermissionsRow.findByText('Application')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('Resource type')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('Operation')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('Last modified')).toBeInTheDocument();

    // Test permission data within the nested table only
    expect(await expandedPermissionsRow.findByText('rbac')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('inventory')).toBeInTheDocument();
    expect(await expandedPermissionsRow.findByText('cost-management')).toBeInTheDocument();

    console.log('SB: 🧪 EXPANDABLE: Expandable content test completed');
  },
};

export const AdminUserWithRolesSorting: Story = {
  tags: ['perm:org-admin'],
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

          console.log('SB: 🔍 MSW: Roles API called with order_by:', orderBy);
          fetchRolesSpy(request);

          if (orderBy) {
            sortSpy(orderBy);
          }

          // Actually sort the data based on order_by parameter
          let sortedRoles = [...mockRoles];
          if (orderBy) {
            const isDescending = orderBy.startsWith('-');
            const sortField = isDescending ? orderBy.slice(1) : orderBy;

            sortedRoles.sort((a, b) => {
              let aVal: string | number = '';
              let bVal: string | number = '';

              if (sortField === 'display_name' || sortField === 'name') {
                aVal = (a.display_name || a.name || '').toLowerCase();
                bVal = (b.display_name || b.name || '').toLowerCase();
              } else if (sortField === 'modified') {
                aVal = new Date(a.modified || 0).getTime();
                bVal = new Date(b.modified || 0).getTime();
              }

              if (aVal < bVal) return isDescending ? 1 : -1;
              if (aVal > bVal) return isDescending ? -1 : 1;
              return 0;
            });
          }

          return HttpResponse.json({
            data: sortedRoles,
            meta: { count: sortedRoles.length, limit: 20, offset: 0 },
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

    console.log('SB: 🧪 SORTING: Starting column sorting test');

    // Wait for initial data load - table should be fully rendered with sortable headers
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Additional wait to ensure table headers are interactive (not skeletons)
    await delay(100);

    // Test sorting by Name column (display_name)
    console.log('SB: 🧪 Testing Name column sorting...');
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
    console.log('SB: 🧪 Testing Last Modified column sorting...');
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

    console.log('SB: 🧪 SORTING: Column sorting test completed');
  },
};

export const AdminUserWithRolesPrimaryActions: Story = {
  tags: ['perm:org-admin'],
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

    // Wait for debounced functions to settle
    await delay(300);

    console.log('SB: 🧪 ACTIONS: Starting primary actions test');

    // Wait for data load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Test Create Role button availability and state
    const createRoleButton = canvas.getByRole('button', { name: /create role/i });
    expect(createRoleButton).toBeInTheDocument();
    expect(createRoleButton).not.toBeDisabled();

    // Test row actions (kebab menus) availability
    const kebabMenus = canvas.getAllByLabelText(/Actions for role/i);
    expect(kebabMenus.length).toBeGreaterThan(0);

    // Test first row kebab menu interaction
    const firstRowKebab = kebabMenus[0]; // Actions dropdown;
    await userEvent.click(firstRowKebab);

    console.log('SB: 🧪 ACTIONS: Primary actions test completed');
  },
};

export const PaginationUrlSync: Story = {
  tags: ['perm:org-admin', 'sbtest:roles-pagination'],
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: verifies Roles pagination updates URL search params (`page`, `perPage`) when changing page size and navigating to next page.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    // Use MemoryRouter so we can assert location.search deterministically
    routerInitialEntries: [`/iam/user-access/roles?perPage=${PAGINATION_TEST_DEFAULT_PER_PAGE}`],
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || String(PAGINATION_TEST_DEFAULT_PER_PAGE), 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          paginationSpy({ limit, offset });

          return HttpResponse.json({
            data: mockRolesLarge.slice(offset, offset + limit),
            meta: { count: mockRolesLarge.length, limit, offset },
            filters: { display_name: '' },
            pagination: { count: mockRolesLarge.length, limit, offset },
          });
        }),
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            return HttpResponse.json({ data: [mockAdminGroup], meta: { count: 1 } });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    paginationSpy.mockClear();

    // Wait for initial load - rely on UI state instead of a fixed delay
    await expect(canvas.findByText('Role 1')).resolves.toBeInTheDocument();

    // Assert initial URL params
    const locEl = canvas.getByTestId('router-location');
    await expectLocationParams(locEl, {
      page: null, // page=1 is represented by absence of the param (see updatePageInUrl)
      perPage: String(PAGINATION_TEST_DEFAULT_PER_PAGE),
    });

    await openPerPageMenu(body);
    await selectPerPage(body, PAGINATION_TEST_SMALL_PER_PAGE);
    await expectLocationParams(locEl, {
      page: null, // perPage change resets page and deletes the page param
      perPage: String(PAGINATION_TEST_SMALL_PER_PAGE),
    });

    await waitFor(() => {
      expect(paginationSpy).toHaveBeenCalled();
      const last = getLastCallArg<{ limit: number; offset: number }>(paginationSpy);
      expect(last.limit).toBe(PAGINATION_TEST_SMALL_PER_PAGE);
      expect(last.offset).toBe(0);
    });

    // Navigate to next page
    const nextButtons = canvas.getAllByRole('button', { name: /go to next page/i });
    await userEvent.click(nextButtons[0]);

    await expectLocationParams(locEl, {
      page: '2',
      perPage: String(PAGINATION_TEST_SMALL_PER_PAGE),
    });

    await waitFor(() => {
      const last = getLastCallArg<{ limit: number; offset: number }>(paginationSpy);
      expect(last.limit).toBe(PAGINATION_TEST_SMALL_PER_PAGE);
      expect(last.offset).toBe(PAGINATION_TEST_SMALL_PER_PAGE);
    });
  },
};

// NOTE: PaginationOutOfRangeClampsToLastPage test was REMOVED from here.
// Page clamping is now handled centrally by TableView and tested in:
// src/components/table-view/TableView.stories.tsx -> PageClampingOutOfRange
//
// This avoids duplicating the same test across Roles, Users, and Groups stories.
// All tables using TableView automatically get page clamping behavior.
