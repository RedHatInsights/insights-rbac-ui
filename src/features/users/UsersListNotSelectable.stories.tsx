import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter, MemoryRouter, useLocation } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import UsersListNotSelectable from './UsersListNotSelectable';

// Spy function to track API calls
const fetchUsersSpy = fn();
// NOTE: Present on master but currently unused in this story file.
// Keeping commented out for now to avoid lint failures; can be re-enabled when we add
// explicit filter/sort API spy assertions.
// const filterSpy = fn();
// const sortSpy = fn();
const usersPaginationSpy = fn();

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
    is_active: true,
    is_org_admin: false,
    external_source_id: 345678,
  },
  {
    id: '4',
    username: 'alice.inactive',
    email: 'alice.inactive@redhat.com',
    first_name: 'Alice',
    last_name: 'Inactive',
    is_active: false,
    is_org_admin: false,
    external_source_id: 456789,
  },
];

const mockUsersLarge = Array.from({ length: 55 }, (_v, idx) => {
  const i = idx + 1;
  return {
    id: String(i),
    username: `user${i}`,
    email: `user${i}@example.com`,
    first_name: `First${i}`,
    last_name: `Last${i}`,
    is_active: true,
    is_org_admin: false,
    external_source_id: i,
  };
});

// Standard args for the component
const defaultArgs = {
  userLinks: true,
  usesMetaInURL: true,
  props: {
    isSelectable: false, // Component is UsersListNotSelectable - no row selection
    isCompact: false,
  },
};

// Router decorator for components that use navigation.
// If a story provides `parameters.routerInitialEntries`, use MemoryRouter (safe for Storybook iframe);
// otherwise use BrowserRouter (default behavior).
const withRouter = (Story: any, context: any) => {
  const initialEntries = context?.parameters?.routerInitialEntries as string[] | undefined;
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) =>
    initialEntries ? <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter> : <BrowserRouter>{children}</BrowserRouter>;

  return (
    <Wrapper>
      <div style={{ minHeight: '600px' }}>
        <RouterLocationSpy />
        <Story />
      </div>
    </Wrapper>
  );
};

// Default MSW handler for users API - includes filtering, sorting, and pagination
const createDefaultUsersHandler = (users = mockUsers) =>
  http.get('/api/rbac/v1/principals/', ({ request }) => {
    fetchUsersSpy(request);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    const usernameFilter = url.searchParams.get('usernames') || '';
    const emailFilter = url.searchParams.get('email') || '';
    const status = url.searchParams.get('status') || '';

    let filteredUsers = [...users];

    // Filter by username
    if (usernameFilter) {
      filteredUsers = filteredUsers.filter((u) => u.username.toLowerCase().includes(usernameFilter.toLowerCase()));
    }

    // Filter by email
    if (emailFilter) {
      filteredUsers = filteredUsers.filter((u) => u.email.toLowerCase().includes(emailFilter.toLowerCase()));
    }

    // Filter by status
    if (status === 'enabled') {
      filteredUsers = filteredUsers.filter((u) => u.is_active);
    } else if (status === 'disabled') {
      filteredUsers = filteredUsers.filter((u) => !u.is_active);
    }

    // Sort users by username
    filteredUsers.sort((a, b) => {
      const comparison = a.username.localeCompare(b.username);
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return HttpResponse.json({
      data: filteredUsers.slice(offset, offset + limit),
      meta: {
        count: filteredUsers.length,
        limit,
        offset,
      },
    });
  });

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
    // Default MSW handlers for all stories
    msw: {
      handlers: [
        createDefaultUsersHandler(),
        http.put('/api/rbac/v1/users/:userId/', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
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
    // Uses default MSW handlers from meta
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
    // Uses default MSW handlers from meta (includes filtering and sorting)
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

    // Wait for filtered results - only john.doe should be visible
    await waitFor(() => {
      expect(canvas.getByText('john.doe')).toBeInTheDocument();
      expect(canvas.queryByText('jane.admin')).not.toBeInTheDocument();
    });

    // Test 2: Filter by "admin"
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, 'admin');

    // Wait for filtered results - only jane.admin should be visible
    await waitFor(() => {
      expect(canvas.getByText('jane.admin')).toBeInTheDocument();
      expect(canvas.queryByText('john.doe')).not.toBeInTheDocument();
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
        story: 'Tests Username column sorting functionality - verifies data is sorted correctly.',
      },
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    // Uses default MSW handlers from meta (includes sorting)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('SB: 🧪 SORTING: Starting username column sorting test');

    // Wait for initial data load (sorted ascending by default)
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();

    // Helper function to get usernames from table - re-queries DOM each time
    const getUsernames = () => {
      const rows = canvasElement.querySelectorAll('table tbody tr');
      return Array.from(rows)
        .map((row) => row.querySelector('td:nth-child(2)')?.textContent?.trim())
        .filter(Boolean);
    };

    // Verify initial sort is ascending (bob < jane < john alphabetically)
    let usernames = getUsernames();
    expect(usernames[0]).toBe('bob.smith');

    // Helper to find the sort button - re-queries DOM each time
    const getSortButton = async () => {
      const header = await canvas.findByRole('columnheader', { name: /username/i });
      return within(header).findByRole('button');
    };

    // Wait for table to be fully interactive
    const sortButton = await getSortButton();
    expect(sortButton).toBeInTheDocument();

    // Click to sort descending
    await userEvent.click(sortButton);

    // Wait for data to re-sort and verify descending order
    await waitFor(
      () => {
        usernames = getUsernames();
        expect(usernames[0]).toBe('john.doe'); // john > jane > bob alphabetically
      },
      { timeout: 3000 },
    );

    // Re-find the button after table re-render and click again to sort ascending
    const sortButton2 = await getSortButton();
    await userEvent.click(sortButton2);

    // Verify ascending order again
    await waitFor(
      () => {
        usernames = getUsernames();
        expect(usernames[0]).toBe('bob.smith');
      },
      { timeout: 3000 },
    );

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
    // Uses default MSW handlers from meta - default filter is Active, so only active users shown
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    console.log('SB: 🧪 TABLE CONTENT: Starting table content test');

    // Wait for initial data load
    const table = await canvas.findByRole('grid', { name: /users table/i });
    expect(table).toBeInTheDocument();

    // Test user data is rendered correctly (only active users shown due to default filter)
    expect(await canvas.findByText('john.doe')).toBeInTheDocument();
    expect(await canvas.findByText('jane.admin')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();

    // alice.inactive is not shown because the default filter is Active
    expect(canvas.queryByText('alice.inactive')).not.toBeInTheDocument();

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

    // Test org admin indicators (Yes/No) - only 3 active users shown
    const yesTexts = await canvas.findAllByText('Yes');
    const noTexts = await canvas.findAllByText('No');
    expect(yesTexts).toHaveLength(1); // jane.admin is org admin
    expect(noTexts).toHaveLength(2); // john.doe and bob.smith are not

    // Test status labels - all shown users are Active
    // Note: "Active" also appears in the filter, so we check for at least 3 (the users) + 1 (filter label)
    const activeLabels = await canvas.findAllByText('Active');
    expect(activeLabels.length).toBeGreaterThanOrEqual(3); // john.doe, jane.admin, bob.smith + filter checkbox

    console.log('SB: 🧪 TABLE CONTENT: Table content test completed');
  },
};

export const PaginationUrlSync: Story = {
  tags: ['perm:org-admin', 'sbtest:users-pagination'],
  args: defaultArgs,
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/iam/user-access/users?page=1&per_page=20'],
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          usersPaginationSpy({ limit, offset });

          return HttpResponse.json({
            data: mockUsersLarge.slice(offset, offset + limit),
            meta: { count: mockUsersLarge.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    usersPaginationSpy.mockClear();

    await delay(500);
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
      expect(usersPaginationSpy).toHaveBeenCalled();
      const last = usersPaginationSpy.mock.calls[usersPaginationSpy.mock.calls.length - 1][0];
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
      const last = usersPaginationSpy.mock.calls[usersPaginationSpy.mock.calls.length - 1][0];
      expect(last.limit).toBe(5);
      expect(last.offset).toBe(5);
    });
  },
};

export const PaginationOutOfRangeClampsToLastPage: Story = {
  tags: ['perm:org-admin', 'sbtest:users-pagination'],
  args: defaultArgs,
  parameters: {
    permissions: { orgAdmin: true, userAccessAdministrator: false },
    routerInitialEntries: ['/iam/user-access/users?page=10000&per_page=20'],
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          usersPaginationSpy({ limit, offset });

          return HttpResponse.json({
            data: mockUsersLarge.slice(offset, offset + limit),
            meta: { count: mockUsersLarge.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    usersPaginationSpy.mockClear();
    await delay(600);

    // For 55 items and perPage=20, last page is page 3 and last offset is 40.
    await waitFor(
      () => {
        // Depending on timing, the "invalid offset" request may happen before play() starts.
        // The stable signal we want is: the final request should use the last-page offset.
        expect(usersPaginationSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
        const last = usersPaginationSpy.mock.calls[usersPaginationSpy.mock.calls.length - 1][0];
        expect(last.limit).toBe(20);
        expect(last.offset).toBe(40);
      },
      { timeout: 5000 },
    );

    const locEl = canvas.getByTestId('router-location');
    const search = (locEl.textContent || '').split('?')[1] || '';
    const params = new URLSearchParams(search);
    expect(params.get('per_page')).toBe('20');
    expect(params.get('page')).toBe('3');
  },
};
