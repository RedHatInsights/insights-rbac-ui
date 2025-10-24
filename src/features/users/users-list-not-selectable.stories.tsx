import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import UsersListNotSelectable from './users-list-not-selectable';

// Spy functions to track API calls
const fetchUsersSpy = fn();
const filterSpy = fn();
const sortSpy = fn();

// Mock user data
const mockUsers = [
  {
    id: '1',
    username: 'john.doe',
    email: 'john.doe@redhat.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: 123456,
  },
  {
    id: '2',
    username: 'jane.admin',
    email: 'jane.admin@redhat.com',
    first_name: 'Jane',
    last_name: 'Admin',
    is_active: true,
    is_org_admin: true,
    external_source_id: 789012,
  },
  {
    id: '3',
    username: 'bob.smith',
    email: 'bob.smith@redhat.com',
    first_name: 'Bob',
    last_name: 'Smith',
    is_active: false,
    is_org_admin: false,
    external_source_id: 345678,
  },
];

// Standard args for the component
const defaultArgs = {
  userLinks: true,
  usesMetaInURL: true,
  props: {
    isSelectable: false, // Component is UsersListNotSelectable - no row selection
    isCompact: false,
  },
};

// Router decorator for components that use navigation
const withRouter = (Story: any) => (
  <BrowserRouter>
    <div style={{ minHeight: '600px' }}>
      <Story />
    </div>
  </BrowserRouter>
);

const meta: Meta<typeof UsersListNotSelectable> = {
  component: UsersListNotSelectable,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
**UsersListNotSelectable** is a container component that manages the users list at \`/iam/user-access/users\`.

## Container Responsibilities
- **Redux State Management**: Manages user data, filters, pagination through Redux
- **API Orchestration**: Dispatches \`fetchUsers\` action on component mount
- **Permission Context**: Uses \`orgAdmin\` from PermissionsContext for access control
- **URL Synchronization**: Manages pagination and filters in URL parameters
- **User Management**: Handles user status changes, bulk operations

## Known Issue (TO BE FIXED)
This component currently makes unauthorized API calls for non-admin users, causing 403 error toast spam.
The stories below test both the bug scenario and expected behavior after fix.
        `,
      },
    },
  },
  argTypes: {
    userLinks: {
      control: 'boolean',
      description: 'Whether usernames should be rendered as links to user detail pages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    usesMetaInURL: {
      control: 'boolean',
      description: 'Whether to store pagination and filters in URL parameters',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminUserWithUsers: Story = {
  tags: ['autodocs', 'perm:org-admin'],
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: `
**Admin User View**: Tests complete users management interface for organization administrators.

## Additional Test Stories

For testing specific scenarios and the permission bug, see these additional stories:

- **[NonAdminUserUnauthorizedCalls](?path=/story/features-users-users-list-not-selectable--non-admin-user-unauthorized-calls)**: Tests the BUG - non-admin users trigger unauthorized API calls
- **[LoadingState](?path=/story/features-users-users-list-not-selectable--loading-state)**: Tests container behavior during API loading
- **[EmptyUsers](?path=/story/features-users-users-list-not-selectable--empty-users)**: Tests container response to empty user data

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
        // Users API (principals endpoint) - successful response for admin users
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('SB: 🔍 MSW: Principals API called by admin user');
          fetchUsersSpy(request);
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);

          return HttpResponse.json({
            data: mockUsers.slice(offset, offset + limit),
            meta: {
              count: mockUsers.length,
              limit,
              offset,
            },
          });
        }),

        // User status update API
        http.put('/api/rbac/v1/users/:userId/', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for container to load data through Redux
    expect(await canvas.findByText('john.doe')).toBeInTheDocument();
    expect(await canvas.findByText('jane.admin')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();

    // Debug: Check spy call count
    console.log('SB: 🔍 Total spy calls so far:', fetchUsersSpy.mock.calls.length);

    // Verify admin users trigger API calls (expected behavior)
    // Note: Since component makes API call on mount, spy should already have been called
    expect(fetchUsersSpy).toHaveBeenCalled();

    // Verify users table is displayed with data
    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify user data is rendered through Redux state
    const tableContent = within(table);
    expect(await tableContent.findByText('john.doe')).toBeInTheDocument();
    expect(await tableContent.findByText('john.doe@redhat.com')).toBeInTheDocument();
    expect(await tableContent.findByText('John')).toBeInTheDocument();
    expect(await tableContent.findByText('Doe')).toBeInTheDocument();
  },
};

export const NonAdminUserUnauthorizedCalls: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: `
**BUG REPLICATION**: This story demonstrates the unauthorized API call issue for non-admin users.

## Current Behavior (BUG)
Non-admin users accessing \`/iam/user-access/users\` trigger unauthorized API calls that result in 403 errors and toast spam.

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
        // Users API - returns 403 for non-admin users (simulates the production bug)
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          fetchUsersSpy(request);
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
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to mount and potentially make API calls
    await delay(300);

    console.log('SB: 🐛 BUG TEST: Non-admin user spy calls:', fetchUsersSpy.mock.calls.length);

    // 🐛 BUG DEMONSTRATION: This test currently FAILS because unauthorized API calls are made
    // This proves the bug exists - non-admin users trigger API calls when they shouldn't
    expect(fetchUsersSpy).not.toHaveBeenCalled();

    // After fix: Verify NotAuthorized component is shown instead of making API calls
    expect(await canvas.findByText(/You do not have access to User Access Administration/i)).toBeInTheDocument();

    console.log('SB: 🧪 NON-ADMIN: NotAuthorized component shown, no unauthorized API calls made');
  },
};

export const LoadingState: Story = {
  tags: ['perm:org-admin'],
  args: defaultArgs,
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
        http.get('/api/rbac/v1/principals/', async () => {
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

export const EmptyUsers: Story = {
  tags: ['perm:org-admin'],
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests container handling of empty user data from Redux.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Return empty data
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show empty state message for no users
    await expect(canvas.findByText(/No matching users found/i)).resolves.toBeInTheDocument();
  },
};

export const AdminUserWithUsersFiltering: Story = {
  tags: ['perm:org-admin'],
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests username filtering functionality with spy verification.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          const url = new URL(request.url);
          const usernames = url.searchParams.get('usernames');

          console.log('SB: 🔍 MSW: Users API called with usernames filter:', usernames);
          fetchUsersSpy(request);

          if (usernames) {
            filterSpy(usernames);
          }

          // Return filtered results (in real app, server would filter)
          const filteredUsers = usernames ? mockUsers.filter((user) => user.username.includes(usernames)) : mockUsers;

          return HttpResponse.json({
            data: filteredUsers,
            meta: { count: filteredUsers.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('SB: 🧪 FILTERING: Starting username filtering test');

    // Wait for initial data load
    expect(await canvas.findByText('john.doe')).toBeInTheDocument();

    // Find filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by username/i);
    expect(filterInput).toBeInTheDocument();

    // Test 1: Filter by "john"
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'john');

    await waitFor(() => {
      expect(filterSpy).toHaveBeenCalledWith('john');
    });

    // Test 2: Filter by "admin"
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'admin');

    await waitFor(() => {
      expect(filterSpy).toHaveBeenCalledWith('admin');
    });

    // Test 3: Clear filter
    await userEvent.clear(filterInput);

    console.log('SB: 🧪 FILTERING: Username filtering test completed');
  },
};

export const AdminUserWithUsersSorting: Story = {
  tags: ['perm:org-admin'],
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests Username column sorting functionality with spy verification.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          const url = new URL(request.url);
          const sortOrder = url.searchParams.get('sort_order');

          console.log('SB: 🔍 MSW: Users API called with sort_order:', sortOrder);
          fetchUsersSpy(request);

          if (sortOrder) {
            sortSpy(sortOrder);
          }

          // Return users (sorting would be handled server-side in real app)
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('SB: 🧪 SORTING: Starting username column sorting test');

    // Wait for initial data load
    expect(await canvas.findByText('john.doe')).toBeInTheDocument();

    // Wait for table to be fully interactive - ensure sorting button is available
    let usernameColumnHeader: HTMLElement;
    let usernameButton: HTMLElement;
    await waitFor(async () => {
      usernameColumnHeader = await canvas.findByRole('columnheader', { name: /username/i });
      usernameButton = await within(usernameColumnHeader).findByRole('button');
      expect(usernameButton).toBeInTheDocument();
    });

    // Test sorting by Username column (default sorted ascending)
    console.log('SB: 🧪 Testing Username column sorting...');

    // Reset spy
    sortSpy.mockClear();

    // Click to sort descending (reverses default ascending)
    await userEvent.click(usernameButton!);

    // Verify sort API was called with descending sort
    await waitFor(() => {
      expect(sortSpy).toHaveBeenCalledWith('desc');
    });

    // Re-find the button after table re-render
    await waitFor(async () => {
      usernameColumnHeader = await canvas.findByRole('columnheader', { name: /username/i });
      usernameButton = await within(usernameColumnHeader).findByRole('button');
      expect(usernameButton).toBeInTheDocument();
    });

    // Reset spy
    sortSpy.mockClear();

    // Click again to sort ascending
    await userEvent.click(usernameButton!);

    // Verify sort API was called with ascending sort
    await waitFor(() => {
      expect(sortSpy).toHaveBeenCalledWith('asc');
    });

    console.log('SB: 🧪 SORTING: Username column sorting test completed');
  },
};

export const AdminUserWithUsersTableContent: Story = {
  tags: ['perm:org-admin'],
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests table content rendering including org admin indicators and status labels.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => {
          fetchUsersSpy();
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('SB: 🧪 TABLE CONTENT: Starting table content test');

    // Wait for initial data load
    const table = await canvas.findByRole('grid', { name: /users table/i });
    expect(table).toBeInTheDocument();

    // Test user data is rendered correctly
    expect(await canvas.findByText('john.doe')).toBeInTheDocument();
    expect(await canvas.findByText('jane.admin')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();

    // Test email addresses
    expect(await canvas.findByText('john.doe@redhat.com')).toBeInTheDocument();
    expect(await canvas.findByText('jane.admin@redhat.com')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith@redhat.com')).toBeInTheDocument();

    // Test names
    expect(await canvas.findByText('John')).toBeInTheDocument();
    expect(await canvas.findByText('Jane')).toBeInTheDocument();
    expect(await canvas.findByText('Bob')).toBeInTheDocument();
    expect(await canvas.findByText('Doe')).toBeInTheDocument();
    expect(await canvas.findByText('Admin')).toBeInTheDocument();
    expect(await canvas.findByText('Smith')).toBeInTheDocument();

    // Test org admin indicators (Yes/No)
    const yesTexts = await canvas.findAllByText('Yes');
    const noTexts = await canvas.findAllByText('No');
    expect(yesTexts).toHaveLength(1); // jane.admin is org admin
    expect(noTexts).toHaveLength(2); // john.doe and bob.smith are not

    // Test status labels
    const activeLabels = await canvas.findAllByText('Active');
    const inactiveLabels = await canvas.findAllByText('Inactive');
    expect(activeLabels).toHaveLength(2); // john.doe and jane.admin
    expect(inactiveLabels).toHaveLength(1); // bob.smith

    console.log('SB: 🧪 TABLE CONTENT: Table content test completed');
  },
};
