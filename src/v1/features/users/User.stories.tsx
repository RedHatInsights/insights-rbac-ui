import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectLoadingVisible, queryBreadcrumb, queryEmptyState, queryPagination } from '../../../test-utils/interactionHelpers';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { User } from './User';
import { usersHandlers, usersLoadingHandlers } from '../../../shared/data/mocks/users.handlers';
import type { Principal } from '../../../shared/data/mocks/db';
import { v1RolesErrorHandlers, v1RolesHandlers, v1RolesLoadingHandlers } from '../../data/mocks/roles.handlers';
import { groupsHandlers, groupsLoadingHandlers } from '../../../shared/data/mocks/groups.handlers';
import type { GroupOut } from '../../../shared/data/mocks/db';

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
const withRouter = (Story: React.ComponentType, context: { parameters?: { routeUsername?: string } }) => {
  const username = context.parameters?.routeUsername || 'john.doe';
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

// Build roles with access for expanded permissions
const rolesWithAccess = mockRoles.map((r) => ({
  ...r,
  access: mockRoleAccess[r.uuid as keyof typeof mockRoleAccess]?.access ?? [],
}));

// Default handlers for most stories
const createDefaultHandlers = (user = mockActiveUser, _roles = mockRoles) => [
  ...usersHandlers(user.username === 'nonexistent.user' ? [] : [user as unknown as Principal], {
    onList: (params) => fetchUsersSpy({ username: params?.get?.('usernames') ?? undefined }),
  }),
  ...v1RolesHandlers(rolesWithAccess as unknown as Parameters<typeof v1RolesHandlers>[0], {
    returnAllForUsername: true,
    onList: (params) =>
      fetchRolesSpy({
        displayName: params?.get?.('display_name') ?? '',
        limit: parseInt(params?.get?.('limit') ?? '20'),
        offset: parseInt(params?.get?.('offset') ?? '0'),
        username: params?.get?.('username') ?? undefined,
      }),
    onGet: (roleId) => fetchRoleForUserSpy({ roleId }),
  }),
  ...groupsHandlers([mockAdminGroup as unknown as GroupOut], {
    onAdminDefaultRequest: () => fetchAdminGroupSpy(),
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial render', async () => {
      const usernameElements = await canvas.findAllByText(mockActiveUser.username);
      await expect(usernameElements.length).toBeGreaterThan(0);
      await expect(await canvas.findByText(new RegExp(mockActiveUser.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();

      await expect(await canvas.findByText('Active')).toBeInTheDocument();

      await expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();
      await expect(await canvas.findByText(mockRoles[1].display_name)).toBeInTheDocument();
      await expect(await canvas.findByText(mockRoles[2].display_name)).toBeInTheDocument();

      await expect(fetchUsersSpy).toHaveBeenCalled();
      await expect(fetchRolesSpy).toHaveBeenCalled();
      await expect(fetchAdminGroupSpy).toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: [...usersLoadingHandlers(), ...v1RolesLoadingHandlers(), ...groupsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expectLoadingVisible(canvasElement);
    });
  },
};

/**
 * UserNotFound - Tests empty state when user doesn't exist
 *
 * The roles API returns a 400 error with `source: 'detail'` which triggers
 * BAD_UUID handling in roleReducer. The component then shows "User not found" empty state.
 */
export const UserNotFound: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**User Not Found**: Demonstrates the empty state when navigating to a non-existent user.

The roles API returns a 400 error which triggers BAD_UUID handling, causing the component
to display the "User not found" empty state with a back button.
        `,
      },
    },
    routeUsername: 'nonexistent.user',
    msw: {
      handlers: [...usersHandlers([]), ...v1RolesErrorHandlers(400), ...groupsHandlers([mockAdminGroup as unknown as GroupOut])],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const notFoundTitle = await canvas.findByText('User not found');
    await expect(notFoundTitle).toBeInTheDocument();
    await expect(await canvas.findByText(/does not exist/i)).toBeInTheDocument();

    const backButton = await canvas.findByRole('button', { name: /back to previous page/i });
    await expect(backButton).toBeInTheDocument();
  },
};

export const AdminView: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    routeUsername: 'john.doe',
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify admin view with add to group button', async () => {
      await canvas.findAllByText(mockActiveUser.username);

      const addToGroupButton = await canvas.findByRole('button', { name: /add user to a group/i });
      await expect(addToGroupButton).not.toBeDisabled();

      const addToGroupLink = await canvas.findByRole('link', { name: /add user to a group/i });
      await expect(addToGroupLink).toHaveAttribute('href', `/iam/user-access/users/detail/${mockActiveUser.username}/add-to-group`);
    });
  },
};

export const NonAdminView: Story = {
  parameters: {
    routeUsername: 'john.doe',
    orgAdmin: false,
    permissions: [],
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findAllByText(mockActiveUser.username);

    const addToGroupButton = canvas.queryByRole('button', { name: /add user to a group/i });
    await expect(addToGroupButton).not.toBeInTheDocument();
  },
};

export const ExpandGroups: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    routeUsername: 'john.doe',
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText(mockRoles[0].display_name);

    const platformAdminRow = canvas.getByText(mockRoles[0].display_name).closest('tr')!;
    const groupsButton = within(platformAdminRow).getByRole('button', { name: '2' });
    await userEvent.click(groupsButton);

    await expect(await canvas.findByText(mockRoles[0].groups_in[0].name)).toBeInTheDocument();
    await expect(await canvas.findByText(mockRoles[0].groups_in[0].description)).toBeInTheDocument();
    await expect(await canvas.findByText(mockRoles[0].groups_in[1].name)).toBeInTheDocument();

    const addRoleLinks = await canvas.findAllByRole('link', { name: 'Add role to this group' });
    await expect(addRoleLinks.length).toBeGreaterThan(0);
  },
};

export const ExpandPermissions: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Expand permissions and verify content', async () => {
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();

      const platformAdminRow = canvas.getByText(mockRoles[0].display_name).closest('tr');
      expect(platformAdminRow).toBeInTheDocument();

      // Find the permissions count button (shows "5" for Platform Administrator's 5 permissions)
      const permissionsButton = within(platformAdminRow as HTMLElement).getByRole('button', { name: '5' });
      expect(permissionsButton).toBeInTheDocument();

      // Click to expand permissions
      await userEvent.click(permissionsButton);

      // After clicking, wait for expanded content and API call
      await waitFor(() => {
        expect(fetchRoleForUserSpy).toHaveBeenCalled();
      });
      const tbody = platformAdminRow?.closest('tbody');
      expect(tbody).toBeInTheDocument();
    });
  },
};

export const FilterRoles: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for initial data and apply filter', async () => {
      // Wait for initial data load - both roles should be visible
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();
      expect(await canvas.findByText(mockRoles[1].display_name)).toBeInTheDocument();

      // Clear the spy to track only filter-related calls
      fetchRolesSpy.mockClear();

      // Find filter input by placeholder text
      const filterInput = canvas.getByPlaceholderText(/role name/i);
      expect(filterInput).toBeInTheDocument();

      // Focus the input first
      await userEvent.click(filterInput);

      // Type filter value character by character with delay between keys
      // This ensures onChange fires properly with debounce
      await userEvent.type(filterInput, 'Platform', { delay: 50 });
      expect(filterInput).toHaveValue('Platform');

      // Verify the API was called with the display_name filter parameter
      await waitFor(
        () => {
          const calls = fetchRolesSpy.mock.calls;
          const filterCalls = calls.filter((call: unknown[]) => {
            const arg = call[0] as { displayName?: string } | undefined;
            return arg?.displayName && arg.displayName.length > 0;
          });
          expect(filterCalls.length).toBeGreaterThan(0);
          // Verify the filter value was passed correctly
          const lastFilterCall = filterCalls[filterCalls.length - 1];
          expect(lastFilterCall[0].displayName).toBe('Platform');
        },
        { timeout: 3000 },
      );

      await waitFor(
        () => {
          expect(canvas.queryByText(mockRoles[0].display_name)).toBeInTheDocument();
          expect(canvas.queryByText(mockRoles[1].display_name)).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify inactive user display', async () => {
      // Wait for table content to appear
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();

      const inactiveLabel = await canvas.findByText('Inactive');
      expect(inactiveLabel).toBeInTheDocument();

      // The label should NOT have green color class for inactive users
      const labelElement = inactiveLabel.closest('.pf-v6-c-label');
      expect(labelElement).not.toHaveClass('pf-m-green');
    });
  },
};

export const ActiveUser: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(mockActiveUser),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify active user display', async () => {
      // Wait for data to load - use findAllByText since username appears in multiple places
      const usernameElements = await canvas.findAllByText(mockActiveUser.username);
      expect(usernameElements.length).toBeGreaterThan(0);

      const activeLabel = await canvas.findByText('Active');
      expect(activeLabel).toBeInTheDocument();

      // The label should have green color class for active users
      const labelElement = activeLabel.closest('.pf-v6-c-label');
      expect(labelElement).toHaveClass('pf-m-green');
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify org admin user display', async () => {
      // Wait for table content to appear
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();

      await waitFor(
        async () => {
          expect(await canvas.findByText(/Org\. Administrator.*Yes/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  },
};

export const NonOrgAdminUser: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: createDefaultHandlers(mockActiveUser),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify non-org admin user display', async () => {
      // Wait for data to load - use findAllByText since username appears in multiple places
      const usernameElements = await canvas.findAllByText(mockActiveUser.username);
      expect(usernameElements.length).toBeGreaterThan(0);

      await waitFor(
        async () => {
          // Find the text containing "Org. Administrator" and "No"
          expect(await canvas.findByText(/Org\. Administrator.*No/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  },
};

export const Pagination: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: [
        ...usersHandlers([mockActiveUser as unknown as Principal], { onList: () => fetchUsersSpy({ username: 'john.doe' }) }),
        ...groupsHandlers([mockAdminGroup as unknown as GroupOut], { onAdminDefaultRequest: () => fetchAdminGroupSpy() }),
        ...v1RolesHandlers(
          Array.from({ length: 50 }, (_, i) => ({
            uuid: `role-${i + 1}`,
            name: `Role ${i + 1}`,
            display_name: `Role ${i + 1}`,
            description: `Description for role ${i + 1}`,
            accessCount: Math.floor(Math.random() * 10) + 1,
            policyCount: 1,
            modified: '2024-01-15T10:30:00Z',
            groups_in: [],
            system: false,
            platform_default: false,
            admin_default: false,
            created: '2024-01-01',
            applications: ['rbac'],
          })) as Parameters<typeof v1RolesHandlers>[0],
          {
            returnAllForUsername: true,
            onList: (params) => fetchRolesSpy({ limit: parseInt(params?.get?.('limit') ?? '20'), offset: parseInt(params?.get?.('offset') ?? '0') }),
          },
        ),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial page and pagination', async () => {
      // Wait for first page to load
      await expect(await canvas.findByText('Role 1')).toBeInTheDocument();

      // Find pagination controls
      const paginationNav = queryPagination(canvasElement);
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify breadcrumb navigation', async () => {
      const usernameElements = await canvas.findAllByText(mockActiveUser.username);
      expect(usernameElements.length).toBeGreaterThan(0);

      const usersBreadcrumb = await canvas.findByRole('link', { name: /users/i });
      expect(usersBreadcrumb).toBeInTheDocument();
      expect(usersBreadcrumb).toHaveAttribute('href', '/iam/user-access/users');

      const breadcrumbNav = queryBreadcrumb(canvasElement);
      expect(breadcrumbNav).toBeInTheDocument();
      expect(within(breadcrumbNav as HTMLElement).getByText(mockActiveUser.username)).toBeInTheDocument();
    });
  },
};

export const EmptyRoles: Story = {
  parameters: {
    routeUsername: 'john.doe',
    msw: {
      handlers: [
        ...usersHandlers([mockActiveUser as unknown as Principal]),
        ...v1RolesHandlers([]),
        ...groupsHandlers([mockAdminGroup as unknown as GroupOut]),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty roles state', async () => {
      // Wait for data to load - use findAllByText since username appears in multiple places
      const usernameElements = await canvas.findAllByText(mockActiveUser.username);
      expect(usernameElements.length).toBeGreaterThan(0);

      await waitFor(
        async () => {
          const emptyState = queryEmptyState(canvasElement);
          expect(emptyState).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Verify there are no role rows in the table
      const roleRows = canvas.queryByText(mockRoles[0].display_name);
      expect(roleRows).not.toBeInTheDocument();
    });
  },
};

export const GroupLinkInExpandedRow: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    routeUsername: 'john.doe',
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Expand groups and verify group link', async () => {
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();

      const platformAdminRow = canvas.getByText(mockRoles[0].display_name).closest('tr');
      expect(platformAdminRow).toBeInTheDocument();

      // Find and click the groups expand button (shows "2" for 2 groups)
      const groupsButton = within(platformAdminRow as HTMLElement).getByRole('button', { name: '2' });
      await userEvent.click(groupsButton);

      // Wait for groups to appear
      await waitFor(async () => {
        expect(await canvas.findByText(mockRoles[0].groups_in[0].name)).toBeInTheDocument();
      });

      const groupLink = await canvas.findByRole('link', { name: mockRoles[0].groups_in[0].name });
      expect(groupLink).toBeInTheDocument();
      expect(groupLink).toHaveAttribute('href', '/iam/user-access/groups/detail/group-1');

      // Test "Add role to this group" link exists for non-admin groups (appears for each non-admin group)
      const addRoleLinks = await canvas.findAllByRole('link', { name: 'Add role to this group' });
      expect(addRoleLinks.length).toBeGreaterThan(0);

      // The first link should point to the correct URL for group-1
      expect(addRoleLinks[0]).toHaveAttribute(
        'href',
        `/iam/user-access/users/detail/${mockActiveUser.username}/add-group-roles/${mockRoles[0].groups_in[0].uuid}`,
      );
    });
  },
};
