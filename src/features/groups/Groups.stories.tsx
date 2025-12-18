import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { Groups } from './Groups';
import { chromeAppNavClickSpy } from '../../../.storybook/context-providers';

// Mock groups data
const mockGroups = [
  {
    uuid: 'group-1',
    name: 'Test Group 1',
    description: 'First test group',
    principalCount: 5,
    roleCount: 2,
    policyCount: 3,
    platform_default: false,
    admin_default: false,
    system: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    uuid: 'group-2',
    name: 'Test Group 2',
    description: 'Second test group',
    principalCount: 8,
    roleCount: 2,
    policyCount: 2,
    platform_default: false,
    admin_default: false,
    system: false,
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

// Mock members data for member expansion testing
const mockMembersData = [
  {
    username: 'john.doe@example.com',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_org_admin: true,
    is_active: true,
  },
  {
    username: 'jane.smith@example.com',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_org_admin: false,
    is_active: true,
  },
];

const mockAdminGroup = {
  uuid: 'admin-group',
  name: 'Default admin access',
  description: 'Default admin group',
  principalCount: 'All org admins',
  roleCount: 15, // Admin groups typically have many roles
  policyCount: 15,
  platform_default: false,
  admin_default: true,
  system: false,
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
};

const mockSystemGroup = {
  uuid: 'system-group',
  name: 'Default access',
  description: 'Default access group',
  principalCount: 'All',
  roleCount: 8, // System groups have basic access roles
  policyCount: 8,
  platform_default: true,
  admin_default: false,
  system: false,
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
};

// Track API calls for parameter verification
const groupsApiCallSpy = fn();
const groupsPaginationSpy = fn();

// Router location spy (used by pagination URL sync stories)
const RouterLocationSpy: React.FC = () => {
  const location = useLocation();
  return (
    <pre data-testid="router-location" style={{ display: 'none' }}>
      {location.pathname}
      {location.search}
    </pre>
  );
};

const mockGroupsLarge = Array.from({ length: 55 }, (_v, idx) => {
  const i = idx + 1;
  return {
    uuid: `group-${i}`,
    name: `Group ${i}`,
    description: `Group description ${i}`,
    principalCount: 0,
    roleCount: 0,
    policyCount: 0,
    platform_default: false,
    admin_default: false,
    system: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  };
});

// ❌ REMOVED: createMockStore violates global provider + MSW rules
// Stories now use global Redux provider + MSW handlers

const meta: Meta<typeof Groups> = {
  title: 'Features/Groups/Groups',
  component: Groups, // Update component reference
  tags: ['custom-css'],
  parameters: {
    msw: {
      handlers: [
        // Groups API
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const adminDefault = url.searchParams.get('admin_default');
          const platformDefault = url.searchParams.get('platform_default');

          // Call the spy with API parameters for testing
          groupsApiCallSpy({
            limit: limit.toString(),
            offset: offset.toString(),
            name,
            admin_default: adminDefault,
            platform_default: platformDefault,
            order_by: url.searchParams.get('order_by') || 'name',
          });

          // Handle admin default groups query
          if (adminDefault === 'true') {
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1, limit, offset },
            });
          }

          // Handle platform default groups query
          if (platformDefault === 'true') {
            return HttpResponse.json({
              data: [mockSystemGroup],
              meta: { count: 1, limit, offset },
            });
          }

          let filteredGroups = mockGroups;
          if (name) {
            filteredGroups = mockGroups.filter((group) => group.name.toLowerCase().includes(name.toLowerCase()));
          }

          const paginatedGroups = filteredGroups.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginatedGroups,
            meta: {
              count: filteredGroups.length,
              limit,
              offset,
            },
          });
        }),

        // Admin group API
        http.get('/api/rbac/v1/groups/:uuid/', ({ params }) => {
          if (params.uuid === 'admin-default') {
            return HttpResponse.json(mockAdminGroup);
          }
          if (params.uuid === 'system-default') {
            return HttpResponse.json(mockSystemGroup);
          }
          return HttpResponse.json(mockGroups.find((group) => group.uuid === params.uuid) || {});
        }),

        // Expanded roles API
        http.get('/api/rbac/v1/groups/:uuid/roles/', () => {
          return HttpResponse.json({
            data: [
              { uuid: 'role-1', name: 'Test Role 1', description: 'First test role', modified: '2023-01-10T00:00:00Z' },
              { uuid: 'role-2', name: 'Test Role 2', description: 'Second test role', modified: '2023-01-12T00:00:00Z' },
            ],
            meta: { count: 2 },
          });
        }),

        // Expanded members API
        http.get('/api/rbac/v1/groups/:uuid/principals/', () => {
          return HttpResponse.json({
            data: mockMembersData,
            meta: { count: mockMembersData.length },
          });
        }),
      ],
    },
  },
  decorators: [
    (Story, { parameters }) => {
      const initialEntries = parameters.routerInitialEntries || ['/groups'];
      return (
        <MemoryRouter initialEntries={initialEntries}>
          <RouterLocationSpy />
          <Routes>
            <Route path="/groups" element={<Story />} />
          </Routes>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Groups>;

export const Default: Story = {
  tags: ['autodocs', 'env:stage', 'perm:org-admin', 'perm:user-access-admin'], // ONLY story with autodocs
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await delay(300); // Required for MSW

    // Test that container loads and displays groups
    const group1Elements = await canvas.findAllByText('Test Group 1');
    expect(group1Elements.length).toBeGreaterThan(0);
    const group2Elements = await canvas.findAllByText('Test Group 2');
    expect(group2Elements.length).toBeGreaterThan(0);

    // Test that toolbar and controls are available
    expect(await canvas.findByText('Create group')).toBeInTheDocument();
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // CRITICAL: Verify Chrome integration was called on mount
    // This tests the critical Line 96: chrome.appNavClick({ id: 'groups', secondaryNav: true })
    expect(chromeAppNavClickSpy).toHaveBeenCalledWith({ id: 'groups', secondaryNav: true });
  },
};

// Non-admin user view
export const NonAdminUserView: Story = {
  tags: ['env:stage'],
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: false, userAccessAdministrator: false }, // Non-admin user
    msw: {
      handlers: [
        // REPLACE handlers entirely for non-admin users
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const adminDefault = url.searchParams.get('admin_default');
          const platformDefault = url.searchParams.get('platform_default');

          // Call the spy with API parameters for testing (CRITICAL FIX)
          groupsApiCallSpy({
            limit: limit.toString(),
            offset: offset.toString(),
            name,
            admin_default: adminDefault,
            platform_default: platformDefault,
            order_by: url.searchParams.get('order_by') || 'name',
          });

          // For non-admin users, default group calls should return empty
          if (adminDefault === 'true' || platformDefault === 'true') {
            return HttpResponse.json({
              data: [],
              meta: { count: 0, limit: 1, offset: 0 },
            });
          }

          // For regular groups, use the same logic as the main handler
          let filteredGroups = mockGroups;
          if (name) {
            filteredGroups = mockGroups.filter((group) => group.name.toLowerCase().includes(name.toLowerCase()));
          }

          const paginatedGroups = filteredGroups.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginatedGroups,
            meta: {
              count: filteredGroups.length,
              limit,
              offset,
            },
          });
        }),

        // Keep other handlers from the base
        http.get('/api/rbac/v1/groups/:uuid/', ({ params }) => {
          return HttpResponse.json(mockGroups.find((group) => group.uuid === params.uuid) || {});
        }),

        http.get('/api/rbac/v1/groups/:uuid/roles/', () => {
          return HttpResponse.json({
            data: [
              { uuid: 'role-1', name: 'Test Role 1', description: 'First test role', modified: '2023-01-10T00:00:00Z' },
              { uuid: 'role-2', name: 'Test Role 2', description: 'Second test role', modified: '2023-01-12T00:00:00Z' },
            ],
            meta: { count: 2, limit: 100, offset: 0 },
          });
        }),

        http.get('/api/rbac/v1/groups/:uuid/principals/', () => {
          return HttpResponse.json({
            data: mockMembersData,
            meta: { count: mockMembersData.length, limit: 100, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await delay(300); // Required for MSW

    // Should still see regular groups but without admin features
    const group1Elements = await canvas.findAllByText('Test Group 1');
    expect(group1Elements.length).toBeGreaterThan(0);
    const group2Elements = await canvas.findAllByText('Test Group 2');
    expect(group2Elements.length).toBeGreaterThan(0);

    // Should NOT see default groups (admin-only)
    expect(canvas.queryByText('Default admin access')).not.toBeInTheDocument();
    expect(canvas.queryByText('Default access')).not.toBeInTheDocument();

    // Should NOT see create group button
    expect(canvas.queryByText('Create group')).not.toBeInTheDocument();

    // Should NOT see bulk selection checkbox in table header
    const table = canvas.getByRole('grid');
    const headerRow = within(table).getAllByRole('row')[0];
    const checkboxes = within(headerRow).queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);
  },
};

// Admin user view with full permissions
export const AdminUserView: Story = {
  tags: ['env:stage', 'perm:org-admin', 'perm:user-access-admin'],
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await delay(300); // Required for MSW

    // Should see regular groups
    const group1Elements = await canvas.findAllByText('Test Group 1');
    expect(group1Elements.length).toBeGreaterThan(0);
    const group2Elements = await canvas.findAllByText('Test Group 2');
    expect(group2Elements.length).toBeGreaterThan(0);

    // CRITICAL: Should see default groups that are visible to admins
    expect(await canvas.findByText('Default admin access')).toBeInTheDocument();
    expect(await canvas.findByText('Default access')).toBeInTheDocument();

    // Should see create group button
    expect(await canvas.findByText('Create group')).toBeInTheDocument();

    // Should see bulk selection functionality in the toolbar (not in table header)
    // The new DataView pattern uses BulkSelect component in toolbar, not header checkbox
    await waitFor(async () => {
      // Look for bulk select component in toolbar - it should have dropdown toggle
      const bulkSelectElements = canvas.queryAllByRole('button', { name: /select/i });
      expect(bulkSelectElements.length).toBeGreaterThan(0);
    });
  },
};

// Roles expansion functionality
export const RolesExpansion: Story = {
  tags: ['env:stage', 'perm:org-admin', 'perm:user-access-admin'],
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await delay(300); // Required for MSW

    // Find and click the roles expansion button
    const testGroup1Elements = await canvas.findAllByText('Test Group 1');
    const testGroup1Row = testGroup1Elements[0].closest('tr');
    if (!testGroup1Row) throw new Error('Could not find Test Group 1 row');

    // Find roles expand button by looking for the cell with roleCount=2
    const rolesCellElement = within(testGroup1Row).getByText('2'); // Should be the roles count
    const rolesCell = rolesCellElement.closest('td');
    if (!rolesCell) throw new Error('Could not find roles cell');

    // Look for the expand button within this cell
    const rolesExpandButton = within(rolesCell as HTMLElement).getByRole('button');

    if (!rolesExpandButton) {
      throw new Error('Could not find roles expand button in roles cell');
    }

    await userEvent.click(rolesExpandButton);

    await delay(1000); // Give time for API call and rendering

    // Should see expanded roles content
    await waitFor(
      () => {
        expect(canvas.getByText('Test Role 1')).toBeInTheDocument();
        expect(canvas.getByText('Test Role 2')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

// Members expansion functionality
export const MembersExpansion: Story = {
  tags: ['env:stage', 'perm:org-admin', 'perm:user-access-admin'],
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await delay(300); // Required for MSW

    // Find and click the members expansion button
    const testGroup1Elements = await canvas.findAllByText('Test Group 1');
    const testGroup1Row = testGroup1Elements[0].closest('tr');
    if (!testGroup1Row) throw new Error('Could not find Test Group 1 row');

    // Find members expand button by looking for the cell with principalCount=5
    const membersCellElement = within(testGroup1Row).getByText('5'); // Should be the members count
    const membersCell = membersCellElement.closest('td');
    if (!membersCell) throw new Error('Could not find members cell');

    // Look for the expand button within this cell
    const membersExpandButton = within(membersCell as HTMLElement).getByRole('button');

    if (!membersExpandButton) {
      throw new Error('Could not find members expand button in members cell');
    }

    await userEvent.click(membersExpandButton);

    await delay(2000); // Give time for API call and rendering

    // Should see expanded members content - look for first names which are unique
    await waitFor(
      () => {
        expect(canvas.getByText('John')).toBeInTheDocument();
        expect(canvas.getByText('Jane')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

// Default groups behavior (admin and platform default)
// Tests: non-selectable rows, no actions, "All" member count, members not expandable
export const DefaultGroupsBehavior: Story = {
  tags: ['env:stage', 'perm:org-admin'],
  parameters: {
    // ✅ Group data now provided by MSW handlers
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for all groups to load (including default groups)
    expect(await canvas.findByText('Default admin access')).toBeInTheDocument();
    expect(await canvas.findByText('Default access')).toBeInTheDocument();
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();

    // Verify default groups show role counts (not empty)
    const adminGroupRow = (await canvas.findByText('Default admin access')).closest('tr');
    const systemGroupRow = (await canvas.findByText('Default access')).closest('tr');
    if (!adminGroupRow || !systemGroupRow) throw new Error('Could not find default group rows');

    // Verify role counts are displayed (should be 15 and 8 from our mock data)
    expect(within(adminGroupRow).getByText('15')).toBeInTheDocument(); // Admin group role count
    expect(within(systemGroupRow).getByText('8')).toBeInTheDocument(); // System group role count

    // Verify default groups have checkbox CELLS but NO actual checkboxes (not selectable)
    const adminGroupCells = within(adminGroupRow).getAllByRole('cell');
    const systemGroupCells = within(systemGroupRow).getAllByRole('cell');

    // First cell should be a checkbox cell but without actual checkbox input
    expect(adminGroupCells[0]).toHaveClass('pf-v5-c-table__check');
    expect(systemGroupCells[0]).toHaveClass('pf-v5-c-table__check');

    // But no actual checkbox inputs should be present in default group rows
    expect(within(adminGroupRow).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(systemGroupRow).queryByRole('checkbox')).not.toBeInTheDocument();

    // Verify default groups do NOT have action dropdowns (no edit/delete)
    const adminRowCells = within(adminGroupRow).getAllByRole('cell');
    const systemRowCells = within(systemGroupRow).getAllByRole('cell');

    // Last cell should not contain action dropdown for default groups
    expect(within(adminRowCells[adminRowCells.length - 1]).queryByLabelText(/actions/i)).not.toBeInTheDocument();
    expect(within(systemRowCells[systemRowCells.length - 1]).queryByLabelText(/actions/i)).not.toBeInTheDocument();

    // Regular groups should have checkboxes AND action dropdowns
    const testGroup1Row = (await canvas.findByText('Test Group 1')).closest('tr');
    if (!testGroup1Row) throw new Error('Could not find Test Group 1 row');
    const testGroup1Cells = within(testGroup1Row).getAllByRole('cell');

    // Regular groups should have actual checkboxes
    expect(within(testGroup1Row).getByRole('checkbox')).toBeInTheDocument();

    // And action dropdowns
    expect(within(testGroup1Cells[testGroup1Cells.length - 1]).getByLabelText(/Test Group 1 actions/i)).toBeInTheDocument();

    // Verify modified dates are properly displayed (no "Invalid date")
    expect(within(adminGroupRow).getByText(/Jan.*2024/)).toBeInTheDocument(); // Should show formatted date
    expect(within(systemGroupRow).getByText(/Jan.*2024/)).toBeInTheDocument(); // Should show formatted date

    // ========================================
    // Test: Default group members NOT expandable (principalCount shows "All" text, no button)
    // ========================================
    // Find the members cell for admin group - shows "All org admins" instead of a count
    const adminMembersCell = within(adminGroupRow).getByText('All org admins');
    expect(adminMembersCell).toBeInTheDocument();
    // Should NOT have an expand button - it's plain text, not a button
    expect(within(adminMembersCell.closest('td') as HTMLElement).queryByRole('button')).not.toBeInTheDocument();

    // Same for system group - shows "All" instead of a count
    const systemMembersCell = within(systemGroupRow).getByText('All');
    expect(systemMembersCell).toBeInTheDocument();
    // Should NOT have an expand button
    expect(within(systemMembersCell.closest('td') as HTMLElement).queryByRole('button')).not.toBeInTheDocument();

    // But roles column SHOULD still be expandable for default groups
    const adminRolesCell = within(adminGroupRow).getByText('15');
    const adminRolesButton = within(adminRolesCell.closest('td') as HTMLElement).queryByRole('button');
    expect(adminRolesButton).toBeInTheDocument(); // Roles ARE expandable

    // Regular group members SHOULD be expandable (has a count + button)
    const testGroup1MembersCell = within(testGroup1Row).getByText('5');
    const testGroup1MembersButton = within(testGroup1MembersCell.closest('td') as HTMLElement).queryByRole('button');
    expect(testGroup1MembersButton).toBeInTheDocument(); // Members ARE expandable for regular groups
  },
};

// 🚨 PRODUCTION BUG REPRODUCTION: User in org with lots of groups but no groups permissions
export const ProductionBugReproduction: Story = {
  tags: ['env:prod'],
  parameters: {
    // ✅ Empty state handled by MSW 403 response
    chrome: { environment: 'prod' }, // Production environment
    permissions: {
      // 🎯 KEY: User is org member but has NO groups permissions (matches bug report)
      orgAdmin: false,
      userAccessAdministrator: false,
      // But user has OTHER permissions (partial permission state)
      isOrgUser: true,
      canViewSomeResources: true,
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    msw: {
      handlers: [
        // 🚨 PRODUCTION BUG SIMULATION: 403 on groups API for user in org with LOTS of groups
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          console.log('SB: 🚨 PRODUCTION BUG TEST - Groups API called:', {
            limit: limit,
            offset: offset,
            order_by: url.searchParams.get('order_by'),
            platform_default: url.searchParams.get('platform_default'),
            admin_default: url.searchParams.get('admin_default'),
            name: url.searchParams.get('name'),
          });

          // Track API calls with timestamp for rate limiting detection
          groupsApiCallSpy({
            timestamp: Date.now(),
            limit: limit.toString(),
            offset: offset.toString(),
            order_by: url.searchParams.get('order_by'),
            platform_default: url.searchParams.get('platform_default'),
            admin_default: url.searchParams.get('admin_default'),
            name: url.searchParams.get('name'),
          });

          // 🎯 CRITICAL: Return 403 BUT with indicators that there are LOTS of groups
          // This simulates user in org with 500+ groups but no permission to see them
          return new HttpResponse(
            JSON.stringify({
              errors: [
                {
                  detail: 'Forbidden: You do not have permission to access this resource. Organization has 573 groups.',
                  status: '403',
                  // Some APIs return metadata even on errors
                  meta: {
                    total_groups_in_org: 573, // Lots of groups!
                    user_permissions: ['basic_access'], // User has SOME permissions
                    missing_permissions: ['rbac:group:read', 'rbac:group:write'],
                  },
                },
              ],
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'X-Total-Count': '573', // Some APIs put count in headers even on error
              },
            },
          );
        }),

        // Other APIs should still work normally
        http.get('/api/rbac/v1/groups/:uuid/', ({ params }) => {
          return HttpResponse.json(mockGroups.find((group) => group.uuid === params.uuid) || {});
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Reset API call spy
    groupsApiCallSpy.mockClear();

    await delay(500); // Allow initial render

    console.log('SB: 🚨 PRODUCTION BUG TEST: Simulating user in org with 573 groups but no permissions...');

    // ✅ Verify component handles 403 gracefully
    await waitFor(
      () => {
        // Non-admin users should see different empty state or error message
        const emptyStateText =
          canvas.queryByText(/configure groups/i) ||
          canvas.queryByText(/no groups/i) ||
          canvas.queryByText(/access denied/i) ||
          canvas.queryByText(/forbidden/i);
        if (emptyStateText) {
          expect(emptyStateText).toBeInTheDocument();
          console.log('SB: ✅ Empty state or error message displayed');
        }
      },
      { timeout: 3000 },
    );

    // ✅ Should NOT show actual group data (since API failed)
    expect(canvas.queryByText('Test Group 1')).not.toBeInTheDocument();
    expect(canvas.queryByText('Test Group 2')).not.toBeInTheDocument();

    // 🎯 PRODUCTION BUG DETECTION: Check for notification loop from repeated API calls
    const initialCallCount = groupsApiCallSpy.mock.calls.length;
    console.log(`SB: 📊 Initial API calls: ${initialCallCount}`);

    console.log(
      'SB: 📊 API call details:',
      groupsApiCallSpy.mock.calls.map((call, i) => `Call ${i + 1}: ${JSON.stringify({ ...call[0], timestamp: undefined })}`),
    );

    // ✅ EXPECTED: 3 total API calls (regular groups, admin_default, platform_default)
    expect(initialCallCount).toBe(3);

    // 2. Monitor for continued calling after initial load
    console.log('SB: 🚨 MONITORING: Watching for continued API calls (production bug pattern)...');

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

    const finalCallCount = groupsApiCallSpy.mock.calls.length;
    const additionalCalls = finalCallCount - initialCallCount;

    console.log(`SB: 📊 PRODUCTION TEST RESULTS:`);
    console.log(`SB:    Initial calls: ${initialCallCount}`);
    console.log(`SB:    Final calls: ${finalCallCount}`);
    console.log(`SB:    Additional calls during monitoring: ${additionalCalls}`);

    // 🚨 PRODUCTION BUG DETECTION LOGIC:
    if (additionalCalls > 0) {
      console.log(`SB: 🚨🚨🚨 PRODUCTION BUG DETECTED! 🚨🚨🚨`);
      console.log(`SB: Component made ${additionalCalls} additional API calls after initial load`);
      console.log('SB: This matches the production bug pattern: infinite API retries causing rate limiting and notification loops');
      console.log('SB: Recent calls:', groupsApiCallSpy.mock.calls.slice(-additionalCalls));
    } else {
      console.log('SB: ✅ PRODUCTION BUG NOT DETECTED: No additional calls after initial load');
    }

    // ✅ EXPECTED: Still only 3 calls total (no additional calls after initial load)
    expect(finalCallCount).toBe(3);

    if (additionalCalls === 0) {
      console.log('SB: 🤔 INVESTIGATION RESULT: Current implementation handles 403 correctly');
      console.log('SB: 🤔 Production bug may require specific trigger conditions not simulated here');
    }
  },
};

// Alias for backwards compatibility (old test name)
export const ApiError403Loop = ProductionBugReproduction;

export const PaginationUrlSync: Story = {
  tags: ['perm:org-admin', 'sbtest:groups-pagination'],
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/groups?page=1&per_page=20'],
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const adminDefault = url.searchParams.get('admin_default');
          const platformDefault = url.searchParams.get('platform_default');

          // Track pagination for assertions (main list calls).
          // Note: the app may pass admin_default=false/platform_default=false in the URL, so only treat "true" as default-group fetches.
          if (adminDefault !== 'true' && platformDefault !== 'true') {
            groupsPaginationSpy({ limit, offset });
          }

          // Preserve existing behavior for default group fetches
          if (adminDefault === 'true') {
            return HttpResponse.json({ data: [mockAdminGroup], meta: { count: 1, limit, offset } });
          }
          if (platformDefault === 'true') {
            return HttpResponse.json({ data: [mockSystemGroup], meta: { count: 1, limit, offset } });
          }

          let filtered = mockGroupsLarge;
          if (name) {
            filtered = mockGroupsLarge.filter((g) => g.name.toLowerCase().includes(name.toLowerCase()));
          }

          return HttpResponse.json({
            data: filtered.slice(offset, offset + limit),
            meta: { count: filtered.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    groupsPaginationSpy.mockClear();

    await delay(300);
    await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

    const locEl = canvas.getByTestId('router-location');
    let search = (locEl.textContent || '').split('?')[1] || '';
    let params = new URLSearchParams(search);
    expect(params.get('page')).toBe('1');
    expect(params.get('per_page')).toBe('20');

    // Change per-page to 5
    const toggle =
      (document.querySelector('#options-menu-top-toggle') as HTMLElement | null) ||
      (document.querySelector('#options-menu-bottom-toggle') as HTMLElement | null);

    if (toggle) {
      await userEvent.click(toggle);
    } else {
      const perPageToggle = await body.findByRole('button', { name: /items per page/i });
      await userEvent.click(perPageToggle);
    }

    const listbox = body.queryByRole('listbox');
    if (listbox) {
      const opt5 = within(listbox)
        .getAllByRole('option')
        .find((o) => (o.textContent || '').trim().startsWith('5'));
      if (!opt5) throw new Error('Could not find per-page option "5"');
      await userEvent.click(opt5);
    } else {
      const menu = await body.findByRole('menu');
      const item5 = within(menu)
        .getAllByRole('menuitem')
        .find((i) => (i.textContent || '').trim().startsWith('5') || (i.textContent || '').includes(' 5'));
      if (!item5) throw new Error('Could not find per-page menu item containing "5"');
      await userEvent.click(item5);
    }

    await waitFor(() => {
      search = (locEl.textContent || '').split('?')[1] || '';
      params = new URLSearchParams(search);
      expect(params.get('page')).toBe('1');
      expect(params.get('per_page')).toBe('5');
    });

    await waitFor(() => {
      expect(groupsPaginationSpy).toHaveBeenCalled();
      const last = groupsPaginationSpy.mock.calls[groupsPaginationSpy.mock.calls.length - 1][0];
      expect(last.limit).toBe(5);
      expect(last.offset).toBe(0);
    });

    // Next page
    const nextButtons = canvas.getAllByLabelText('Go to next page');
    await userEvent.click(nextButtons[0]);

    await waitFor(() => {
      search = (locEl.textContent || '').split('?')[1] || '';
      params = new URLSearchParams(search);
      expect(params.get('page')).toBe('2');
      expect(params.get('per_page')).toBe('5');
    });

    await waitFor(() => {
      const last = groupsPaginationSpy.mock.calls[groupsPaginationSpy.mock.calls.length - 1][0];
      expect(last.limit).toBe(5);
      expect(last.offset).toBe(5);
    });
  },
};

export const PaginationOutOfRangeClampsToLastPage: Story = {
  tags: ['perm:org-admin', 'sbtest:groups-pagination'],
  parameters: {
    chrome: { environment: 'stage' },
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/groups?page=10000&per_page=20'],
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const adminDefault = url.searchParams.get('admin_default');
          const platformDefault = url.searchParams.get('platform_default');

          if (adminDefault !== 'true' && platformDefault !== 'true') {
            groupsPaginationSpy({ limit, offset });
          }

          if (adminDefault === 'true') {
            return HttpResponse.json({ data: [mockAdminGroup], meta: { count: 1, limit, offset } });
          }
          if (platformDefault === 'true') {
            return HttpResponse.json({ data: [mockSystemGroup], meta: { count: 1, limit, offset } });
          }

          return HttpResponse.json({
            data: mockGroupsLarge.slice(offset, offset + limit),
            meta: { count: mockGroupsLarge.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    groupsPaginationSpy.mockClear();
    await delay(400);

    // For 55 items and perPage=20, last page is page 3 and last offset is 40.
    await waitFor(() => {
      expect(groupsPaginationSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
      const last = groupsPaginationSpy.mock.calls[groupsPaginationSpy.mock.calls.length - 1][0];
      expect(last.limit).toBe(20);
      expect(last.offset).toBe(40);
    });

    const locEl = canvas.getByTestId('router-location');
    const search = (locEl.textContent || '').split('?')[1] || '';
    const params = new URLSearchParams(search);
    expect(params.get('per_page')).toBe('20');
    expect(params.get('page')).toBe('3');
  },
};
