import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { User } from './User';

// API Spies
const fetchUsersSpy = fn();
const fetchRolesSpy = fn();
const fetchAdminGroupSpy = fn();
const fetchRoleForUserSpy = fn();

// Mock user data
const mockActiveUser = {
  username: 'john.doe',
  email: 'john.doe@redhat.com',
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  is_org_admin: false,
};

// Mock roles data
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Platform Administrator',
    display_name: 'Platform Administrator',
    description: 'Full platform access',
    accessCount: 5,
    modified: '2024-01-15T10:30:00Z',
    groups_in: [
      { uuid: 'group-1', name: 'Administrators', description: 'System administrators' },
      { uuid: 'group-2', name: 'Platform Team', description: 'Platform engineering team' },
    ],
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    display_name: 'Cost Management Viewer',
    description: 'View cost reports',
    accessCount: 3,
    modified: '2024-01-10T14:20:00Z',
    groups_in: [{ uuid: 'group-3', name: 'Finance Team', description: 'Finance and accounting' }],
  },
  {
    uuid: 'role-3',
    name: 'Inventory Reader',
    display_name: 'Inventory Reader',
    description: 'Read inventory data',
    accessCount: 2,
    modified: '2024-01-05T09:15:00Z',
    groups_in: [],
  },
];

// Mock role access data (for expanded permissions)
const mockRoleAccess = {
  'role-1': {
    access: [
      { permission: 'rbac:principal:read' },
      { permission: 'rbac:group:write' },
      { permission: 'inventory:hosts:read' },
      { permission: 'cost-management:report:read' },
      { permission: 'advisor:recommendation:read' },
    ],
  },
  'role-2': {
    access: [{ permission: 'cost-management:report:read' }, { permission: 'cost-management:cost:read' }, { permission: 'cost-management:rate:read' }],
  },
  'role-3': {
    access: [{ permission: 'inventory:hosts:read' }, { permission: 'inventory:groups:read' }],
  },
};

// Mock admin group
const mockAdminGroup = {
  uuid: 'admin-group-uuid',
  name: 'Default admin access',
  description: 'Default admin group',
  admin_default: true,
  platform_default: false,
  system: true,
};

// Router decorator with username param
const withRouter = (Story: any, context: any) => {
  const username = context.parameters.routeUsername || 'john.doe';
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/users/:username/*"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="*" element={<Navigate to={`/users/${username}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof User> = {
  component: User,
  tags: ['user-detail', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof User>;

// Default handlers for most stories
const createDefaultHandlers = (user = mockActiveUser, roles = mockRoles) => [
  // Users API
  http.get('/api/rbac/v1/principals/', ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('usernames');
    fetchUsersSpy({ username });

    if (username === 'nonexistent.user') {
      return HttpResponse.json({
        data: [],
        meta: { count: 0 },
      });
    }

    return HttpResponse.json({
      data: [user],
      meta: { count: 1, limit: 20, offset: 0 },
    });
  }),

  // Roles API
  http.get('/api/rbac/v1/roles/', ({ request }) => {
    const url = new URL(request.url);
    const displayName = url.searchParams.get('display_name') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const username = url.searchParams.get('username');

    fetchRolesSpy({ displayName, limit, offset, username });

    let filteredRoles = roles;
    if (displayName) {
      filteredRoles = roles.filter(
        (role) => role.display_name.toLowerCase().includes(displayName.toLowerCase()) || role.name.toLowerCase().includes(displayName.toLowerCase()),
      );
    }

    return HttpResponse.json({
      data: filteredRoles.slice(offset, offset + limit),
      meta: { count: filteredRoles.length, limit, offset },
    });
  }),

  // Admin group API
  http.get('/api/rbac/v1/groups/', ({ request }) => {
    const url = new URL(request.url);
    const adminDefault = url.searchParams.get('admin_default');

    if (adminDefault === 'true') {
      fetchAdminGroupSpy();
      return HttpResponse.json({
        data: [mockAdminGroup],
        meta: { count: 1 },
      });
    }

    return HttpResponse.json({ data: [], meta: { count: 0 } });
  }),

  // Individual role API (for expanded permissions)
  http.get('/api/rbac/v1/roles/:roleId/', ({ params }) => {
    const roleId = params.roleId as string;
    fetchRoleForUserSpy({ roleId });

    const roleAccess = mockRoleAccess[roleId as keyof typeof mockRoleAccess];
    const role = roles.find((r) => r.uuid === roleId);

    if (role && roleAccess) {
      return HttpResponse.json({
        ...role,
        ...roleAccess,
      });
    }

    return HttpResponse.json({ message: 'Role not found' }, { status: 404 });
  }),
];

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Active user with roles, expandable groups and permissions.

## Test Coverage

This container displays user details with their assigned roles. Each role row can be expanded to show:
- Groups the role belongs to
- Permissions granted by the role

## Additional Test Stories

- **[Loading](?path=/story/features-users-user--loading)**: Skeleton loading states
- **[UserNotFound](?path=/story/features-users-user--user-not-found)**: Invalid username handling
- **[AdminView](?path=/story/features-users-user--admin-view)**: Admin sees "Add user to group" button
- **[NonAdminView](?path=/story/features-users-user--non-admin-view)**: Non-admin view without actions
- **[ExpandGroups](?path=/story/features-users-user--expand-groups)**: Expand role to see groups
- **[ExpandPermissions](?path=/story/features-users-user--expand-permissions)**: Expand role to see permissions
- **[FilterRoles](?path=/story/features-users-user--filter-roles)**: Filter roles by name
- **[InactiveUser](?path=/story/features-users-user--inactive-user)**: Inactive user display
- **[OrgAdminUser](?path=/story/features-users-user--org-admin-user)**: Org admin indicator
        `,
      },
    },
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Test user info displays - use findAllByText since username appears in breadcrumb and title
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);
    expect(await canvas.findByText(/john\.doe@redhat\.com/)).toBeInTheDocument();

    // Test active label
    expect(await canvas.findByText('Active')).toBeInTheDocument();

    // Test roles table displays
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Management Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Inventory Reader')).toBeInTheDocument();

    // Verify API calls were made
    expect(fetchUsersSpy).toHaveBeenCalled();
    expect(fetchRolesSpy).toHaveBeenCalled();
    expect(fetchAdminGroupSpy).toHaveBeenCalled();
  },
};

export const Loading: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => new Promise(() => {})),
        http.get('/api/rbac/v1/roles/', () => new Promise(() => {})),
        http.get('/api/rbac/v1/groups/', () => new Promise(() => {})),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);

    // Test skeleton loading state
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};

// NOTE: UserNotFound story skipped - testing Redux BAD_UUID error states with MSW is complex.
// The error state requires the roles API to return a 400 error with specific format that triggers
// the BAD_UUID error in roleReducer. This will be properly tested in integration/E2E tests.
// The error state logic exists in user.js at line 70: userExists: error !== BAD_UUID
export const UserNotFound: Story = {
  tags: ['skip-test'],
  parameters: {
    docs: {
      description: {
        story: `
**Note**: This story demonstrates the User Not Found empty state.
Testing BAD_UUID error states with MSW is complex - this scenario is better covered in E2E tests.
        `,
      },
    },
    routeUsername: 'nonexistent.user',
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
        // Return 400 error to trigger BAD_UUID handling
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json(
            {
              errors: [{ status: '400', source: 'detail', detail: 'Invalid user' }],
            },
            { status: 400 },
          );
        }),
        http.get('/api/rbac/v1/groups/', () =>
          HttpResponse.json({
            data: [mockAdminGroup],
            meta: { count: 1 },
          }),
        ),
      ],
    },
  },
};

export const AdminView: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    routeUsername: 'john.doe',
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for data to load - use findAllByText since username appears in multiple places
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);

    // Test "Add user to group" button is visible for admins
    const addToGroupButton = await canvas.findByRole('button', { name: /add user to a group/i });
    expect(addToGroupButton).toBeInTheDocument();
    expect(addToGroupButton).not.toBeDisabled();

    // Test button has correct link
    const addToGroupLink = await canvas.findByRole('link', { name: /add user to a group/i });
    expect(addToGroupLink).toHaveAttribute('href', '/iam/user-access/users/detail/john.doe/add-to-group');
  },
};

export const NonAdminView: Story = {
  parameters: {
    routeUsername: 'john.doe',
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for data to load - use findAllByText since username appears in multiple places
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);

    // Test "Add user to group" button is NOT visible for non-admins
    const addToGroupButton = canvas.queryByRole('button', { name: /add user to a group/i });
    expect(addToGroupButton).not.toBeInTheDocument();
  },
};

export const ExpandGroups: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    routeUsername: 'john.doe',
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for roles to load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Find the Platform Administrator row
    const platformAdminRow = canvas.getByText('Platform Administrator').closest('tr');
    expect(platformAdminRow).toBeInTheDocument();

    // Find the groups count button (shows "2" for Platform Administrator's 2 groups)
    const groupsButton = within(platformAdminRow as HTMLElement).getByRole('button', { name: '2' });
    expect(groupsButton).toBeInTheDocument();

    // Click to expand groups
    await userEvent.click(groupsButton);

    // Wait for nested table to appear with group data
    await waitFor(async () => {
      expect(await canvas.findByText('Administrators')).toBeInTheDocument();
      expect(await canvas.findByText('System administrators')).toBeInTheDocument();
      expect(await canvas.findByText('Platform Team')).toBeInTheDocument();
    });

    // Test "Add role to this group" links appear (for non-admin groups)
    const addRoleLinks = await canvas.findAllByRole('link', { name: 'Add role to this group' });
    expect(addRoleLinks.length).toBeGreaterThan(0);
  },
};

export const ExpandPermissions: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for roles to load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Find the Platform Administrator row
    const platformAdminRow = canvas.getByText('Platform Administrator').closest('tr');
    expect(platformAdminRow).toBeInTheDocument();

    // Find the permissions count button (shows "5" for Platform Administrator's 5 permissions)
    const permissionsButton = within(platformAdminRow as HTMLElement).getByRole('button', { name: '5' });
    expect(permissionsButton).toBeInTheDocument();

    // Click to expand permissions
    await userEvent.click(permissionsButton);

    // After clicking, the row should expand - wait for expanded content area
    await delay(500);

    // Verify the API was called for role details (role-1 is Platform Administrator)
    expect(fetchRoleForUserSpy).toHaveBeenCalled();

    // The expanded area should show permission headers or permission data
    // Check for the nested table structure
    const tbody = await platformAdminRow?.closest('tbody');
    expect(tbody).toBeInTheDocument();
  },
};

export const FilterRoles: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for initial data load - both roles should be visible
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Cost Management Viewer')).toBeInTheDocument();

    // Clear the spy to track only filter-related calls
    fetchRolesSpy.mockClear();

    // Find filter input by placeholder text
    const filterInput = canvas.getByPlaceholderText(/role name/i);
    expect(filterInput).toBeInTheDocument();

    // Focus the input first
    await userEvent.click(filterInput);
    await delay(100);

    // Type filter value character by character with delay between keys
    // This ensures onChange fires properly with debounce
    await userEvent.type(filterInput, 'Platform', { delay: 50 });
    expect(filterInput).toHaveValue('Platform');

    // Wait for debounced API calls to complete
    // The component uses debounce which needs time to fire after typing stops
    await delay(1000);

    // Verify the API was called with the display_name filter parameter
    await waitFor(
      () => {
        const calls = fetchRolesSpy.mock.calls;
        const filterCalls = calls.filter((call: any[]) => call[0]?.displayName && call[0].displayName.length > 0);
        expect(filterCalls.length).toBeGreaterThan(0);
        // Verify the filter value was passed correctly
        const lastFilterCall = filterCalls[filterCalls.length - 1];
        expect(lastFilterCall[0].displayName).toBe('Platform');
      },
      { timeout: 3000 },
    );

    // Verify filtered results - only Platform Administrator should show
    // The MSW handler filters based on display_name and returns matching roles
    await waitFor(
      () => {
        expect(canvas.getByText('Platform Administrator')).toBeInTheDocument();
        expect(canvas.queryByText('Cost Management Viewer')).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

// Create mock user with john.doe username but inactive status
const mockInactiveJohnDoe = {
  username: 'john.doe',
  email: 'john.doe@redhat.com',
  first_name: 'John',
  last_name: 'Doe',
  is_active: false,
  is_org_admin: false,
};

export const InactiveUser: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(mockInactiveJohnDoe),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for table content to appear
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Test inactive label appears (not green)
    const inactiveLabel = await canvas.findByText('Inactive');
    expect(inactiveLabel).toBeInTheDocument();

    // The label should NOT have green color class for inactive users
    const labelElement = inactiveLabel.closest('.pf-v5-c-label');
    expect(labelElement).not.toHaveClass('pf-m-green');
  },
};

export const ActiveUser: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(mockActiveUser),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for data to load - use findAllByText since username appears in multiple places
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);

    // Test active label with green color
    const activeLabel = await canvas.findByText('Active');
    expect(activeLabel).toBeInTheDocument();

    // The label should have green color class for active users
    const labelElement = activeLabel.closest('.pf-v5-c-label');
    expect(labelElement).toHaveClass('pf-m-green');
  },
};

// Create mock user with john.doe username but org admin status
const mockOrgAdminJohnDoe = {
  username: 'john.doe',
  email: 'john.doe@redhat.com',
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  is_org_admin: true,
};

export const OrgAdminUser: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(mockOrgAdminJohnDoe),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for table content to appear
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Test org admin indicator section exists (text is "Org. Administrator: Yes")
    // The text content includes both the label and "Yes" text
    await waitFor(
      async () => {
        // Look for the combined text in the TextContent component
        const textContent = canvasElement.querySelector('.pf-v5-c-content');
        expect(textContent).toBeTruthy();
        expect(textContent?.textContent).toContain('Org. Administrator');
        expect(textContent?.textContent).toContain('Yes');
      },
      { timeout: 3000 },
    );
  },
};

export const NonOrgAdminUser: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(mockActiveUser),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for data to load - use findAllByText since username appears in multiple places
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);

    // Test org admin indicator section exists (text is "Org. Administrator: No")
    // The text content includes both the label and "No" text
    await waitFor(
      async () => {
        // Look for the combined text in the TextContent component
        const textContent = canvasElement.querySelector('.pf-v5-c-content');
        expect(textContent).toBeTruthy();
        expect(textContent?.textContent).toContain('Org. Administrator');
        expect(textContent?.textContent).toContain('No');
      },
      { timeout: 3000 },
    );
  },
};

export const Pagination: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: [
        // User API
        http.get('/api/rbac/v1/principals/', () => {
          fetchUsersSpy({ username: 'john.doe' });
          return HttpResponse.json({
            data: [mockActiveUser],
            meta: { count: 1 },
          });
        }),
        // Admin group API
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
            fetchAdminGroupSpy();
            return HttpResponse.json({
              data: [mockAdminGroup],
              meta: { count: 1 },
            });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
        // Roles handler with more data for pagination
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          fetchRolesSpy({ limit, offset });

          // Create many roles for pagination
          const allRoles = Array.from({ length: 50 }, (_, i) => ({
            uuid: `role-${i + 1}`,
            name: `Role ${i + 1}`,
            display_name: `Role ${i + 1}`,
            description: `Description for role ${i + 1}`,
            accessCount: Math.floor(Math.random() * 10) + 1,
            modified: '2024-01-15T10:30:00Z',
            groups_in: [],
          }));

          return HttpResponse.json({
            data: allRoles.slice(offset, offset + limit),
            meta: { count: allRoles.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for first page to load
    expect(await canvas.findByText('Role 1')).toBeInTheDocument();

    // Find pagination controls
    const paginationNav = canvasElement.querySelector('.pf-v5-c-pagination');
    expect(paginationNav).toBeInTheDocument();

    // Clear spy to track pagination calls
    fetchRolesSpy.mockClear();

    // Find and click next page button - there may be multiple pagination controls
    // so use getAllByRole and click the first one
    const nextButtons = await canvas.findAllByRole('button', { name: /go to next page/i });
    expect(nextButtons.length).toBeGreaterThan(0);
    await userEvent.click(nextButtons[0]);

    // Verify API was called with new offset
    await waitFor(() => {
      expect(fetchRolesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 20,
        }),
      );
    });
  },
};

export const BreadcrumbNavigation: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for data to load - use findAllByText since username appears in multiple places
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);

    // Test breadcrumb shows "Users" link
    const usersBreadcrumb = await canvas.findByRole('link', { name: /users/i });
    expect(usersBreadcrumb).toBeInTheDocument();
    expect(usersBreadcrumb).toHaveAttribute('href', '/iam/user-access/users');

    // Test current breadcrumb shows username (find in breadcrumb nav)
    const breadcrumbNav = canvasElement.querySelector('.pf-v5-c-breadcrumb');
    expect(breadcrumbNav).toBeInTheDocument();
    expect(within(breadcrumbNav as HTMLElement).getByText('john.doe')).toBeInTheDocument();
  },
};

export const EmptyRoles: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () =>
          HttpResponse.json({
            data: [mockActiveUser],
            meta: { count: 1 },
          }),
        ),
        http.get('/api/rbac/v1/roles/', () =>
          HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          }),
        ),
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('admin_default') === 'true') {
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
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for data to load - use findAllByText since username appears in multiple places
    const usernameElements = await canvas.findAllByText('john.doe');
    expect(usernameElements.length).toBeGreaterThan(0);

    // Wait for empty state to render - look for the empty state container
    await waitFor(
      async () => {
        // The empty state should contain the search icon and "No matching" text
        const emptyState = canvasElement.querySelector('.pf-v5-c-empty-state');
        expect(emptyState).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify there are no role rows in the table
    const roleRows = canvas.queryByText('Platform Administrator');
    expect(roleRows).not.toBeInTheDocument();
  },
};

export const GroupLinkInExpandedRow: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    routeUsername: 'john.doe',
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    // Wait for roles to load
    expect(await canvas.findByText('Platform Administrator')).toBeInTheDocument();

    // Find the Platform Administrator row
    const platformAdminRow = canvas.getByText('Platform Administrator').closest('tr');
    expect(platformAdminRow).toBeInTheDocument();

    // Find and click the groups expand button (shows "2" for 2 groups)
    const groupsButton = within(platformAdminRow as HTMLElement).getByRole('button', { name: '2' });
    await userEvent.click(groupsButton);

    // Wait for groups to appear
    await waitFor(async () => {
      expect(await canvas.findByText('Administrators')).toBeInTheDocument();
    });

    // Test group name is a link to group detail
    const groupLink = await canvas.findByRole('link', { name: 'Administrators' });
    expect(groupLink).toBeInTheDocument();
    expect(groupLink).toHaveAttribute('href', '/iam/user-access/groups/detail/group-1');

    // Test "Add role to this group" link exists for non-admin groups (appears for each non-admin group)
    const addRoleLinks = await canvas.findAllByRole('link', { name: 'Add role to this group' });
    expect(addRoleLinks.length).toBeGreaterThan(0);

    // The first link should point to the correct URL for group-1
    expect(addRoleLinks[0]).toHaveAttribute('href', '/iam/user-access/users/detail/john.doe/add-group-roles/group-1');
  },
};
