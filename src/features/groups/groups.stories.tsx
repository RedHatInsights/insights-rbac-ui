import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import Groups from './Groups';

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

// Mock route components for testing nested routes
const MockAddGroup: React.FC = () => {
  const context = useOutletContext() as any;
  return (
    <div data-testid="add-group-route">
      <h2>Add Group Modal</h2>
      <div data-testid="context-data">
        <div>OrderBy: {context?.['add-group']?.orderBy}</div>
        <div>PostMethod: {typeof context?.['add-group']?.postMethod}</div>
      </div>
      <button data-testid="call-post-method" onClick={() => context?.['add-group']?.postMethod?.({ test: 'config' })}>
        Call Post Method
      </button>
    </div>
  );
};

const MockEditGroup: React.FC = () => {
  const context = useOutletContext() as any;
  const cancelRoute = context?.['edit/:groupId']?.cancelRoute;
  const submitRoute = context?.['edit/:groupId']?.submitRoute;

  return (
    <div data-testid="edit-group-route">
      <h2>Edit Group Modal</h2>
      <div data-testid="context-data">
        <div>CancelRoute: {typeof cancelRoute === 'object' ? JSON.stringify(cancelRoute) : cancelRoute}</div>
        <div>SubmitRoute: {typeof submitRoute === 'object' ? JSON.stringify(submitRoute) : submitRoute}</div>
        <div>PostMethod: {typeof context?.['edit/:groupId']?.postMethod}</div>
      </div>
      <button data-testid="call-post-method" onClick={() => context?.['edit/:groupId']?.postMethod?.({ test: 'config' })}>
        Call Post Method
      </button>
    </div>
  );
};

const MockRemoveGroup: React.FC = () => {
  const context = useOutletContext() as any;
  const cancelRoute = context?.['remove-group/:groupId']?.cancelRoute;
  const submitRoute = context?.['remove-group/:groupId']?.submitRoute;

  return (
    <div data-testid="remove-group-route">
      <h2>Remove Group Modal</h2>
      <div data-testid="context-data">
        <div>CancelRoute: {typeof cancelRoute === 'object' ? JSON.stringify(cancelRoute) : cancelRoute}</div>
        <div>SubmitRoute: {typeof submitRoute === 'object' ? JSON.stringify(submitRoute) : submitRoute}</div>
        <div>PostMethod: {typeof context?.['remove-group/:groupId']?.postMethod}</div>
      </div>
      <button data-testid="call-post-method" onClick={() => context?.['remove-group/:groupId']?.postMethod?.(['group-1'], { test: 'config' })}>
        Call Post Method
      </button>
    </div>
  );
};

// Mock data for expanded rows
const mockRolesForGroup = [
  {
    uuid: 'role-1',
    name: 'Advisor Administrator',
    description: 'Full access to Advisor',
    modified: '2024-01-05T00:00:00Z',
  },
  {
    uuid: 'role-2',
    name: 'Compliance Viewer',
    description: 'View-only access to Compliance',
    modified: '2024-01-06T00:00:00Z',
  },
];

const mockMembersForGroup = [
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

// MSW handlers for API mocking
const handlers = [
  http.get('/api/rbac/v1/groups/', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const name = url.searchParams.get('name') || '';
    const adminDefault = url.searchParams.get('admin_default');
    const platformDefault = url.searchParams.get('platform_default');
    const orderBy = url.searchParams.get('order_by') || 'name';

    // Call the spy with API parameters for testing
    groupsApiCallSpy({
      limit: limit.toString(),
      offset: offset.toString(),
      name,
      admin_default: adminDefault,
      platform_default: platformDefault,
      order_by: orderBy,
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

    // Apply sorting
    if (orderBy.includes('name')) {
      filteredGroups.sort((a, b) => {
        const direction = orderBy.startsWith('-') ? -1 : 1;
        return direction * a.name.localeCompare(b.name);
      });
    } else if (orderBy.includes('modified')) {
      filteredGroups.sort((a, b) => {
        const direction = orderBy.startsWith('-') ? -1 : 1;
        return direction * (new Date(a.modified).getTime() - new Date(b.modified).getTime());
      });
    }

    const data = filteredGroups.slice(offset, offset + limit);

    return HttpResponse.json({
      data,
      meta: {
        count: filteredGroups.length,
        limit,
        offset,
      },
    });
  }),

  // Handlers for row expansion data
  http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
    return HttpResponse.json({
      data: mockRolesForGroup,
      meta: { count: mockRolesForGroup.length, limit: 100, offset: 0 },
    });
  }),

  http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
    return HttpResponse.json({
      data: mockMembersForGroup,
      meta: { count: mockMembersForGroup.length, limit: 100, offset: 0 },
    });
  }),

  http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
    if (params.groupId === 'admin-group') {
      return HttpResponse.json(mockAdminGroup);
    }
    if (params.groupId === 'system-group') {
      return HttpResponse.json(mockSystemGroup);
    }
    const group = mockGroups.find((g) => g.uuid === params.groupId);
    return group ? HttpResponse.json(group) : HttpResponse.json(null, { status: 404 });
  }),

  http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
    return HttpResponse.json({
      data: [
        { uuid: 'role-1', name: 'Test Role 1', description: 'First test role' },
        { uuid: 'role-2', name: 'Test Role 2', description: 'Second test role' },
      ],
      meta: { count: 2, limit: 100, offset: 0 },
    });
  }),

  http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
    return HttpResponse.json({
      data: mockMembersForGroup,
      meta: { count: mockMembersForGroup.length, limit: 100, offset: 0 },
    });
  }),

  http.delete('/api/rbac/v1/groups/:groupId/', () => {
    return HttpResponse.json({}, { status: 204 });
  }),
];

const meta: Meta<typeof Groups> = {
  component: Groups,
  tags: ['groups'], // NO autodocs on meta - using single autodocs pattern
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers,
    },
  },
  decorators: [
    (Story, { parameters }) => {
      const initialEntries = parameters.routerInitialEntries || ['/groups'];
      return (
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/groups" element={<Story />}>
              <Route path="add-group" element={<MockAddGroup />} />
              <Route path="edit/:groupId" element={<MockEditGroup />} />
              <Route path="remove-group/:groupId" element={<MockRemoveGroup />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Groups>;

// Default story with autodocs and comprehensive directory
export const Default: Story = {
  tags: ['autodocs'], // ONLY story with autodocs
  parameters: {
    docs: {
      description: {
        story: `
**Groups Container**: Complete groups management interface with data fetching, filtering, sorting, bulk operations, and role/member expansion.

This container manages all group-related functionality including:
- Real API orchestration via Redux actions
- Data filtering by name and type
- Sorting by name, description, member count
- Bulk selection and operations (edit/delete)
- Expandable rows for roles and members
- Default groups behavior (admin/platform)
- Modal routing for add/edit/remove operations

## Test Stories Directory

The following stories test specific scenarios and user interactions:

- **[Loading](?path=/story/features-groups-groups--loading)**: Tests loading state with infinite API delay
- **[NonAdminUserView](?path=/story/features-groups-groups--non-admin-user-view)**: Tests non-admin user permissions and limitations
- **[AdminUserView](?path=/story/features-groups-groups--admin-user-view)**: Tests admin user permissions and capabilities
- **[BulkSelectionAndActions](?path=/story/features-groups-groups--bulk-selection-and-actions)**: Tests bulk selection and action menu
- **[RolesExpansion](?path=/story/features-groups-groups--roles-expansion)**: Tests expandable roles functionality
- **[MembersExpansion](?path=/story/features-groups-groups--members-expansion)**: Tests expandable members functionality
- **[FilteringInteraction](?path=/story/features-groups-groups--filtering-interaction)**: Tests search and filtering behavior
- **[SortingInteraction](?path=/story/features-groups-groups--sorting-interaction)**: Tests column sorting functionality
- **[ToolbarActionsState](?path=/story/features-groups-groups--toolbar-actions-state)**: Tests toolbar state management
- **[DefaultGroupsBehavior](?path=/story/features-groups-groups--default-groups-behavior)**: Tests admin and platform default groups
- **[AddGroupRoute](?path=/story/features-groups-groups--add-group-route)**: Tests add group modal routing
- **[EditGroupRoute](?path=/story/features-groups-groups--edit-group-route)**: Tests edit group modal routing
- **[RemoveGroupRoute](?path=/story/features-groups-groups--remove-group-route)**: Tests remove group modal routing

### API Integration
All stories use MSW handlers to test real API orchestration with Redux, simulating:
- GET /api/rbac/v1/groups/ for group listings
- API parameter handling (pagination, filtering, sorting)
- Real Redux action dispatching and state updates
        `,
      },
    },
    permissions: { orgAdmin: true, userAccessAdministrator: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that container loads and displays groups
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Test that toolbar and controls are available
    expect(await canvas.findByText('Create group')).toBeInTheDocument();
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Test that admin permissions show admin-specific features
    expect(await canvas.findByRole('button', { name: /Group bulk actions/i })).toBeInTheDocument();
  },
};

// Basic loading state
export const Loading: Story = {
  parameters: {
    permissions: { orgAdmin: false, userAccessAdministrator: false },
    msw: {
      handlers: [
        // Never resolve to keep component in loading state - tests real Redux loading orchestration
        http.get('/api/rbac/v1/groups/', async () => {
          await delay('infinite');
          return HttpResponse.json({ data: [], meta: { count: 0, limit: 20, offset: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    // Verify loading state - skeleton should be present during infinite API delay
    await waitFor(() => {
      expect(canvasElement.querySelector('.pf-v5-c-skeleton')).toBeInTheDocument();
    });
  },
};

// Non-admin user view (read-only)
export const NonAdminUserView: Story = {
  parameters: {
    permissions: { orgAdmin: false, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for data to load, then verify only regular groups are displayed (no default groups for non-admin)
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Verify that default groups are NOT shown to non-admin users
    expect(canvas.queryByText('Default admin access')).not.toBeInTheDocument();
    expect(canvas.queryByText('Default access')).not.toBeInTheDocument();

    // CRITICAL: Verify API parameters exclude default groups for non-admin users
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      const lastCall = groupsApiCallSpy.mock.calls[groupsApiCallSpy.mock.calls.length - 1][0];
      // Non-admin users should explicitly exclude default groups
      expect(lastCall.admin_default).toBe('false');
      expect(lastCall.platform_default).toBe('false');
    });

    // Verify no checkboxes for selection (non-admin)
    const checkboxes = canvas.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // Verify no Create Group button
    const createButton = canvas.queryByRole('button', { name: /create group/i });
    expect(createButton).not.toBeInTheDocument();

    // Verify no action dropdowns
    const actionButtons = canvas.queryAllByRole('button', { name: /actions/i });
    expect(actionButtons).toHaveLength(0);
  },
};

// Admin user view with full functionality
export const AdminUserView: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for data to load, then verify all groups are displayed (regular + default groups for admin)
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();
    expect(await canvas.findByText('Default admin access')).toBeInTheDocument();
    expect(await canvas.findByText('Default access')).toBeInTheDocument();

    // Verify Create Group button is present (confirms admin permissions work)
    const createButton = await canvas.findByRole('button', { name: /create group/i });
    expect(createButton).toBeInTheDocument();

    // CRITICAL: Verify that admin users get separate API calls for default groups
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      // Should have multiple calls: regular groups + admin default + platform default
      const calls = groupsApiCallSpy.mock.calls;

      // Find calls for default groups
      const adminDefaultCall = calls.find((call) => call[0].admin_default === 'true');
      const platformDefaultCall = calls.find((call) => call[0].platform_default === 'true');

      expect(adminDefaultCall).toBeDefined();
      expect(platformDefaultCall).toBeDefined();
    });

    // Wait for table to fully render, then verify bulk select for selection (admin view)
    const bulkSelectCheckbox = await canvas.findByLabelText(/select page/i);
    expect(bulkSelectCheckbox).toBeInTheDocument();

    // Verify row action dropdowns exist for regular groups
    const actionButtons = canvas.queryAllByLabelText(/Group row actions/i);
    expect(actionButtons.length).toBeGreaterThan(0);
  },
};

// Test row selection and bulk actions
export const BulkSelectionAndActions: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for data to load
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Find and click the bulk select checkbox to select all
    const bulkSelectCheckbox = await canvas.findByLabelText(/select page/i);
    await userEvent.click(bulkSelectCheckbox);

    // Wait for bulk actions toolbar to appear and click it
    const bulkActionsKebab = await canvas.findByLabelText(/Group bulk actions/i);
    expect(bulkActionsKebab).toBeInTheDocument();
    await userEvent.click(bulkActionsKebab);

    // Verify bulk action options
    const editOption = await canvas.findByRole('menuitem', { name: /edit/i });
    const deleteOption = await canvas.findByRole('menuitem', { name: /delete/i });
    expect(editOption).toBeInTheDocument();
    expect(deleteOption).toBeInTheDocument();
  },
};

// Test roles expansion functionality
export const RolesExpansion: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for data to load
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Find the specific row for Test Group 2 and click its roles button
    const testGroup2Row = (await canvas.findByText('Test Group 2')).closest('tr');
    if (!testGroup2Row) throw new Error('Could not find Test Group 2 row');
    const rolesButton = within(testGroup2Row).getByRole('button', { name: /2/ });
    await userEvent.click(rolesButton);

    // Test that the expanded role shows nested roles table
    await waitFor(async () => {
      const tbody = rolesButton.closest('tbody');
      const table = tbody?.querySelector('table');
      if (!table) throw new Error('Could not find expanded roles table');
      const expandedRow = within(table);

      // Verify nested table headers
      expect(await expandedRow.findByText('Role name')).toBeInTheDocument();
      expect(await expandedRow.findByText('Description')).toBeInTheDocument();
      expect(await expandedRow.findByText('Last modified')).toBeInTheDocument();

      // Verify role data appears in expanded view
      expect(await expandedRow.findByText('Advisor Administrator')).toBeInTheDocument();
      expect(await expandedRow.findByText('Compliance Viewer')).toBeInTheDocument();
    });
  },
};

// Test members expansion functionality
export const MembersExpansion: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for data to load
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Find the specific row for Test Group 2 and locate the members column
    const testGroup2Row = (await canvas.findByText('Test Group 2')).closest('tr');
    if (!testGroup2Row) throw new Error('Could not find Test Group 2 row');

    // Find the members cell button - it should be expandable with a button inside
    const membersButton = within(testGroup2Row).getByRole('button', { name: /8/ });
    expect(membersButton).toBeInTheDocument();

    // Click the members button to expand
    await userEvent.click(membersButton);

    // Wait for the members table to appear and verify its content
    // Find the expanded members table using its aria-label
    const membersTable = await canvas.findByLabelText('Members for Test Group 2');
    expect(membersTable).toBeInTheDocument();

    // Verify all expected column headers are present
    expect(await within(membersTable).findByText('Org. Admin')).toBeInTheDocument();
    expect(await within(membersTable).findByText('First name')).toBeInTheDocument();
    expect(await within(membersTable).findByText('Last name')).toBeInTheDocument();
    expect(await within(membersTable).findByText('Username')).toBeInTheDocument();
    expect(await within(membersTable).findByText('Email')).toBeInTheDocument();
    expect(await within(membersTable).findByText('Status')).toBeInTheDocument();

    // Verify member data appears in the expanded table
    expect(await within(membersTable).findByText('John')).toBeInTheDocument();
    expect(await within(membersTable).findByText('Doe')).toBeInTheDocument();
    // Email appears in both Username and Email columns, so use getAllByText
    const johnEmails = await within(membersTable).findAllByText('john.doe@example.com');
    expect(johnEmails.length).toBe(2); // Should appear in both Username and Email columns

    expect(await within(membersTable).findByText('Jane')).toBeInTheDocument();
    expect(await within(membersTable).findByText('Smith')).toBeInTheDocument();
    const janeEmails = await within(membersTable).findAllByText('jane.smith@example.com');
    expect(janeEmails.length).toBe(2); // Should appear in both Username and Email columns

    // Verify org admin status and active status are displayed
    const yesTexts = await within(membersTable).findAllByText('Yes');
    const noTexts = await within(membersTable).findAllByText('No');
    const activeTexts = await within(membersTable).findAllByText('Active');

    expect(yesTexts.length).toBe(1); // John is org admin
    expect(noTexts.length).toBe(1); // Jane is not org admin
    expect(activeTexts.length).toBe(2); // Both are active
  },
};

// Test filtering functionality
export const FilteringInteraction: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    msw: {
      handlers: [
        ...handlers,
        // Override the main handler to test filtering
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name') || '';

          // Call the spy with API parameters
          groupsApiCallSpy({
            name,
            limit: url.searchParams.get('limit'),
            offset: url.searchParams.get('offset'),
            order_by: url.searchParams.get('order_by'),
          });

          // Return filtered mock data based on name parameter
          let filteredGroups = mockGroups;
          if (name) {
            filteredGroups = mockGroups.filter((group) => group.name.toLowerCase().includes(name.toLowerCase()));
          }

          return HttpResponse.json({
            data: filteredGroups,
            meta: {
              count: filteredGroups.length,
              limit: parseInt(url.searchParams.get('limit') || '20'),
              offset: parseInt(url.searchParams.get('offset') || '0'),
            },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Initial load should call API without filter
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      const lastCall = groupsApiCallSpy.mock.calls[groupsApiCallSpy.mock.calls.length - 1][0];
      expect(lastCall.name).toBe('');
    });

    // Wait for data to load
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Find and use the name filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by name/i);

    // Reset spy before testing filter
    groupsApiCallSpy.mockClear();

    // Type in filter
    await userEvent.type(filterInput, 'Test Group 1');

    // Verify filter API call (debounced)
    await waitFor(
      () => {
        expect(groupsApiCallSpy).toHaveBeenCalled();
        const lastCall = groupsApiCallSpy.mock.calls[groupsApiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.name).toBe('Test Group 1');
      },
      { timeout: 2000 }, // Account for debounce
    );
  },
};

// Test sorting functionality
export const SortingInteraction: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    msw: {
      handlers: [
        ...handlers,
        // Override the main handler to test sorting
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);

          // Call the spy with API parameters
          groupsApiCallSpy({
            order_by: url.searchParams.get('order_by'),
            limit: url.searchParams.get('limit'),
            offset: url.searchParams.get('offset'),
          });

          return HttpResponse.json({
            data: mockGroups,
            meta: {
              count: mockGroups.length,
              limit: parseInt(url.searchParams.get('limit') || '20'),
              offset: parseInt(url.searchParams.get('offset') || '0'),
            },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Initial load should call API with default sorting
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      const lastCall = groupsApiCallSpy.mock.calls[groupsApiCallSpy.mock.calls.length - 1][0];
      expect(lastCall.order_by).toBe('name');
    });

    // Wait for data to load
    expect(await canvas.findByText('Test Group 2')).toBeInTheDocument();

    // Test clicking Name column header for descending sort
    const nameHeader = await canvas.findByRole('columnheader', { name: /name/i });
    const nameButton = await within(nameHeader).findByRole('button');

    await userEvent.click(nameButton);

    // Wait for API call and verify descending sort
    await waitFor(
      () => {
        expect(groupsApiCallSpy).toHaveBeenCalled();
        const calls = groupsApiCallSpy.mock.calls;
        // Check if any recent call has the expected sort order (not just the very last one)
        const recentCalls = calls.slice(-5); // Check last 5 calls
        const hasDescendingSort = recentCalls.some((call) => call[0].order_by === '-name');
        expect(hasDescendingSort).toBe(true);
      },
      { timeout: 2000 },
    );

    // Test clicking Last Modified column header
    const modifiedHeader = await canvas.findByRole('columnheader', { name: /last modified/i });
    const modifiedButton = await within(modifiedHeader).findByRole('button');

    await userEvent.click(modifiedButton);

    // Wait for API call and verify modified sort
    await waitFor(
      () => {
        expect(groupsApiCallSpy).toHaveBeenCalled();
        const calls = groupsApiCallSpy.mock.calls;
        // Check if any recent call has the expected sort order (not just the very last one)
        const recentCalls = calls.slice(-5); // Check last 5 calls
        const hasModifiedSort = recentCalls.some((call) => call[0].order_by === 'modified');
        expect(hasModifiedSort).toBe(true);
      },
      { timeout: 2000 },
    );
  },
};

// Test toolbar actions enabled/disabled state based on row selection business logic:
// - Edit: enabled only when exactly 1 row is selected
// - Delete: enabled when any rows are selected (1 or more)
export const ToolbarActionsState: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for data to load
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();

    // Initially, bulk actions should be disabled (no rows selected)
    const bulkActionsKebab = await canvas.findByLabelText(/Group bulk actions/i);

    // Click to open bulk actions menu
    await userEvent.click(bulkActionsKebab);

    // Verify Edit and Delete options are present but DISABLED when no rows selected
    const editOption = await canvas.findByText('Edit');
    const deleteOption = await canvas.findByText('Delete');
    expect(editOption).toBeInTheDocument();
    expect(deleteOption).toBeInTheDocument();

    // Check that they are disabled (button should have disabled attribute or aria-disabled)
    const editButton = editOption.closest('button');
    const deleteButton = deleteOption.closest('button');
    expect(editButton).toHaveAttribute('disabled');
    expect(deleteButton).toHaveAttribute('disabled');

    // Close the menu by clicking outside
    await userEvent.click(canvasElement);

    // Now select a row to enable bulk actions
    const testGroup1Row = (await canvas.findByText('Test Group 1')).closest('tr');
    if (!testGroup1Row) throw new Error('Could not find Test Group 1 row');

    const rowCheckbox = within(testGroup1Row).getByRole('checkbox');
    await userEvent.click(rowCheckbox);

    // Open bulk actions menu again
    await userEvent.click(bulkActionsKebab);

    // Actions should now be ENABLED (1 row selected: Edit=enabled, Delete=enabled)
    const editOptionAfter = await canvas.findByText('Edit');
    const deleteOptionAfter = await canvas.findByText('Delete');
    expect(editOptionAfter).toBeInTheDocument();
    expect(deleteOptionAfter).toBeInTheDocument();

    // Check that they are now enabled (no disabled attribute)
    const editButtonAfter = editOptionAfter.closest('button');
    const deleteButtonAfter = deleteOptionAfter.closest('button');
    expect(editButtonAfter).not.toHaveAttribute('disabled');
    expect(deleteButtonAfter).not.toHaveAttribute('disabled');

    // Verify that row selection state is maintained
    expect(rowCheckbox).toBeChecked();

    // Close menu and test multiple selection scenario (Edit should be disabled, Delete enabled)
    await userEvent.click(canvasElement);

    // Select a second row to test multiple selection
    const testGroup2Row = (await canvas.findByText('Test Group 2')).closest('tr');
    if (!testGroup2Row) throw new Error('Could not find Test Group 2 row');
    const rowCheckbox2 = within(testGroup2Row).getByRole('checkbox');
    await userEvent.click(rowCheckbox2);

    // Open bulk actions menu with multiple rows selected
    await userEvent.click(bulkActionsKebab);

    // With 2 rows selected: Edit should be disabled (only works with 1), Delete should be enabled
    const editOptionMultiple = await canvas.findByText('Edit');
    const deleteOptionMultiple = await canvas.findByText('Delete');

    const editButtonMultiple = editOptionMultiple.closest('button');
    const deleteButtonMultiple = deleteOptionMultiple.closest('button');
    expect(editButtonMultiple).toHaveAttribute('disabled'); // Edit disabled with multiple rows
    expect(deleteButtonMultiple).not.toHaveAttribute('disabled'); // Delete enabled with multiple rows
  },
};

// Test default groups behavior (selectable but filtered out, no row actions)
export const DefaultGroupsBehavior: Story = {
  parameters: {
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
    expect(within(adminRowCells[adminRowCells.length - 1]).queryByLabelText(/Group row actions/i)).not.toBeInTheDocument();
    expect(within(systemRowCells[systemRowCells.length - 1]).queryByLabelText(/Group row actions/i)).not.toBeInTheDocument();

    // Regular groups should have checkboxes AND action dropdowns
    const testGroup1Row = (await canvas.findByText('Test Group 1')).closest('tr');
    if (!testGroup1Row) throw new Error('Could not find Test Group 1 row');
    const testGroup1Cells = within(testGroup1Row).getAllByRole('cell');

    // Regular groups should have actual checkboxes
    expect(within(testGroup1Row).getByRole('checkbox')).toBeInTheDocument();

    // And action dropdowns
    expect(within(testGroup1Cells[testGroup1Cells.length - 1]).getByLabelText(/Group row actions/i)).toBeInTheDocument();

    // Verify modified dates are properly displayed (no "Invalid date")
    expect(within(adminGroupRow).getByText(/Jan.*2024/)).toBeInTheDocument(); // Should show formatted date
    expect(within(systemGroupRow).getByText(/Jan.*2024/)).toBeInTheDocument(); // Should show formatted date
  },
};

// Test routing functionality - Add Group route
export const AddGroupRoute: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/groups/add-group'],
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for main groups data to load
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();

    // Verify that the add group route is rendered
    expect(await canvas.findByTestId('add-group-route')).toBeInTheDocument();
    expect(await canvas.findByText('Add Group Modal')).toBeInTheDocument();

    // Verify context data is passed correctly
    const contextData = await canvas.findByTestId('context-data');
    expect(within(contextData).getByText(/OrderBy: name/)).toBeInTheDocument();
    expect(within(contextData).getByText(/PostMethod: function/)).toBeInTheDocument();

    // Test calling the postMethod
    const postMethodButton = await canvas.findByTestId('call-post-method');

    // Clear the API spy before testing
    groupsApiCallSpy.mockClear();

    // Click the button to trigger postMethod
    await userEvent.click(postMethodButton);

    // Verify that the postMethod triggers a new API call and clears filters
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      const calls = groupsApiCallSpy.mock.calls;
      const recentCalls = calls.slice(-3); // Check last few calls for the new one
      const hasNewCall = recentCalls.some((call) => call[0].name === ''); // Filter cleared
      expect(hasNewCall).toBe(true);
    });
  },
};

// Test routing functionality - Edit Group route
export const EditGroupRoute: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/groups/edit/group-1'],
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for main groups data to load
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();

    // Verify that the edit group route is rendered
    expect(await canvas.findByTestId('edit-group-route')).toBeInTheDocument();
    expect(await canvas.findByText('Edit Group Modal')).toBeInTheDocument();

    // Verify context data is passed correctly - the essential functionality
    const contextData = await canvas.findByTestId('context-data');
    expect(within(contextData).getByText(/CancelRoute:/)).toBeInTheDocument();
    expect(within(contextData).getByText(/SubmitRoute:/)).toBeInTheDocument();
    expect(within(contextData).getByText(/PostMethod: function/)).toBeInTheDocument();
    // Most importantly, verify the postMethod button works
    const postMethodButton = await canvas.findByTestId('call-post-method');
    expect(postMethodButton).toBeInTheDocument();

    // Clear the API spy before testing
    groupsApiCallSpy.mockClear();

    // Click the button to trigger postMethod
    await userEvent.click(postMethodButton);

    // Verify that the postMethod triggers a new API call and clears filters
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      const calls = groupsApiCallSpy.mock.calls;
      const recentCalls = calls.slice(-3); // Check last few calls for the new one
      const hasNewCall = recentCalls.some((call) => call[0].name === ''); // Filter cleared
      expect(hasNewCall).toBe(true);
    });
  },
};

// Test routing functionality - Remove Group route
export const RemoveGroupRoute: Story = {
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/groups/remove-group/group-1'],
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Wait for main groups data to load
    expect(await canvas.findByText('Test Group 1')).toBeInTheDocument();

    // Verify that the remove group route is rendered
    expect(await canvas.findByTestId('remove-group-route')).toBeInTheDocument();
    expect(await canvas.findByText('Remove Group Modal')).toBeInTheDocument();

    // Verify context data is passed correctly - the essential functionality
    const contextData = await canvas.findByTestId('context-data');
    expect(within(contextData).getByText(/CancelRoute:/)).toBeInTheDocument();
    expect(within(contextData).getByText(/SubmitRoute:/)).toBeInTheDocument();
    expect(within(contextData).getByText(/PostMethod: function/)).toBeInTheDocument();
    // Most importantly, verify the postMethod button works
    const postMethodButton = await canvas.findByTestId('call-post-method');
    expect(postMethodButton).toBeInTheDocument();

    // Clear the API spy before testing
    groupsApiCallSpy.mockClear();

    // Click the button to trigger postMethod
    await userEvent.click(postMethodButton);

    // Verify that the postMethod triggers a new API call and clears filters
    await waitFor(() => {
      expect(groupsApiCallSpy).toHaveBeenCalled();
      const calls = groupsApiCallSpy.mock.calls;
      const recentCalls = calls.slice(-3); // Check last few calls for the new one
      const hasNewCall = recentCalls.some((call) => call[0].name === ''); // Filter cleared
      expect(hasNewCall).toBe(true);
    });
  },
};
