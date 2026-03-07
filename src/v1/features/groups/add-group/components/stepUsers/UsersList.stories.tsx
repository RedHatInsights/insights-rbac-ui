import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { usersHandlers } from '../../../../../../shared/data/mocks/users.handlers';
import type { Principal } from '../../../../../../shared/data/mocks/db';
import { UsersList } from './UsersList';
import type { User } from './types';

const usersApiSpy = fn();

const storyUsers: Principal[] = [
  {
    username: 'alice.doe',
    email: 'alice.doe@example.com',
    first_name: 'Alice',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: true,
    external_source_id: '201',
  },
  {
    username: 'bob.smith',
    email: 'bob.smith@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: false,
    external_source_id: '202',
  },
  {
    username: 'charlie.brown',
    email: 'charlie.brown@example.com',
    first_name: 'Charlie',
    last_name: 'Brown',
    is_active: false,
    is_org_admin: false,
    external_source_id: '203',
  },
  {
    username: 'diana.prince',
    email: 'diana.prince@example.com',
    first_name: 'Diana',
    last_name: 'Prince',
    is_active: true,
    is_org_admin: false,
    external_source_id: '204',
  },
  {
    username: 'eve.inactive',
    email: 'eve.inactive@example.com',
    first_name: 'Eve',
    last_name: 'Inactive',
    is_active: false,
    is_org_admin: false,
    external_source_id: '205',
  },
  {
    username: 'frank.admin',
    email: 'frank.admin@company.com',
    first_name: 'Frank',
    last_name: 'Admin',
    is_active: true,
    is_org_admin: true,
    external_source_id: '206',
  },
  {
    username: 'grace.user',
    email: 'grace.user@company.com',
    first_name: 'Grace',
    last_name: 'User',
    is_active: false,
    is_org_admin: false,
    external_source_id: '207',
  },
];

// Wrapper to capture selection changes
const UsersListWrapper: React.FC<{ onSelect?: (users: User[]) => void; initialSelectedUsers?: User[] }> = ({
  onSelect = () => {},
  initialSelectedUsers = [],
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>(initialSelectedUsers);

  const handleSelect = (users: User[]) => {
    setSelectedUsers(users);
    onSelect(users);
  };

  return (
    <div style={{ padding: '20px' }}>
      <UsersList usesMetaInURL={false} displayNarrow={false} initialSelectedUsers={selectedUsers} onSelect={handleSelect} />
      {selectedUsers.length > 0 && (
        <div data-testid="selected-users" style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Selected ({selectedUsers.length}):</strong> {selectedUsers.map((u) => u.username).join(', ')}
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof UsersListWrapper> = {
  title: 'Features/Groups/AddGroup/UsersList',
  component: UsersListWrapper,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
## UsersList Component

The UsersList component displays a list of users for selection in the Add Group wizard.

### Features
- **Selection**: Multi-select checkboxes for user selection
- **Filtering**: Filter by username, email, and status (Active/Inactive)
- **Pagination**: Support for large user lists
- **Status Display**: Shows Active/Inactive status for each user
        `,
      },
    },
    msw: {
      handlers: [
        ...usersHandlers(storyUsers, {
          onList: (params) =>
            usersApiSpy({
              username: params.get('usernames'),
              email: params.get('email'),
              status: params.get('status'),
              limit: params.get('limit'),
              offset: params.get('offset'),
              sort_order: params.get('sort_order'),
            }),
        }),
      ],
    },
  },
  beforeEach: () => {
    usersApiSpy.mockClear();
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to render with users
    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify users are displayed
    expect(await canvas.findByText(storyUsers[0].username)).toBeInTheDocument();
    expect(await canvas.findByText(storyUsers[1].username)).toBeInTheDocument();

    // Verify status column shows Active/Inactive
    const activeLabels = await canvas.findAllByText('Active');
    expect(activeLabels.length).toBeGreaterThan(0);
  },
};

export const SelectUsers: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for table to render
    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Wait for users to load
    await canvas.findByText(storyUsers[0].username);

    // Find and click first user's checkbox
    const checkboxes = await canvas.findAllByRole('checkbox');
    // First checkbox is bulk select, second is first row
    await userEvent.click(checkboxes[1]);

    // Verify onSelect was called
    await waitFor(() => {
      expect(args.onSelect).toHaveBeenCalled();
    });

    // Verify selected users display
    expect(await canvas.findByTestId('selected-users')).toBeInTheDocument();
  },
};

export const FilterByUsername: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to render
    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await canvas.findByText(storyUsers[0].username);

    // Find username filter input and type
    const filterInput = await canvas.findByPlaceholderText(/filter by username/i);
    await userEvent.type(filterInput, 'alice');

    // Wait for filter to apply (debounced)
    await waitFor(
      () => {
        expect(usersApiSpy).toHaveBeenCalled();
        const lastCall = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0];
        expect(lastCall.username).toBe('alice');
      },
      { timeout: 2000 },
    );

    // Verify filtered results
    expect(await canvas.findByText(storyUsers[0].username)).toBeInTheDocument();
  },
};

export const FilterByStatus: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to render
    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await canvas.findByText(storyUsers[0].username);

    // Find filter container and switch to Status filter
    const filterContainer = canvasElement.querySelector('[data-ouia-component-id="DataViewFilters"]');
    expect(filterContainer).toBeTruthy();
    const filterCanvas = within(filterContainer as HTMLElement);

    // Find the filter type dropdown button (shows current filter type)
    const filterTypeButtons = filterCanvas.getAllByRole('button');
    const filterDropdownButton = filterTypeButtons.find((btn) => btn.textContent?.includes('Username'));
    expect(filterDropdownButton).toBeTruthy();
    await userEvent.click(filterDropdownButton!);

    // Select "Status" from the dropdown menu
    const statusOption = await within(document.body).findByRole('menuitem', { name: /status/i });
    await userEvent.click(statusOption);

    // Open status filter checkbox dropdown (uses DataViewCheckboxFilter)
    const statusFilterToggle = canvasElement.querySelector('[data-ouia-component-id="DataViewCheckboxFilter-toggle"]') as HTMLElement;
    expect(statusFilterToggle).toBeTruthy();
    await userEvent.click(statusFilterToggle);

    // Select "Inactive" checkbox from the dropdown menu
    const inactiveMenuItem = await within(document.body).findByRole('menuitem', { name: /inactive/i });
    const inactiveCheckbox = within(inactiveMenuItem).getByRole('checkbox');
    await userEvent.click(inactiveCheckbox);

    // Wait for filter to apply - both Active and Inactive are now selected, which maps to 'all'
    await waitFor(
      () => {
        expect(usersApiSpy).toHaveBeenCalled();
        const lastCall = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0];
        expect(lastCall.status).toBe('all');
      },
      { timeout: 2000 },
    );

    // Verify inactive users are shown
    expect(await canvas.findByText(storyUsers[2].username)).toBeInTheDocument();
  },
};

export const SortByUsername: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to render with data sorted ascending by default
    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Wait for data to load
    await canvas.findByText(storyUsers[0].username);

    // Helper function to get usernames from table - re-queries DOM each time
    // Note: td:nth-child(3) because columns are: checkbox, orgAdmin, username, ...
    const getUsernames = () => {
      const rows = canvasElement.querySelectorAll('table tbody tr');
      return Array.from(rows)
        .map((row) => row.querySelector('td:nth-child(3)')?.textContent?.trim())
        .filter(Boolean);
    };

    // Verify initial sort is ascending (alice < bob < charlie alphabetically)
    let usernames = getUsernames();
    expect(usernames[0]).toBe(storyUsers[0].username);

    // Helper to find the sort button
    const getSortButton = async () => {
      const header = await canvas.findByRole('columnheader', { name: /username/i });
      return within(header).findByRole('button');
    };

    // Find and click the username column header to sort
    const sortButton = await getSortButton();
    expect(sortButton).toBeInTheDocument();

    // Click to sort descending
    await userEvent.click(sortButton);

    // Wait for data to re-sort and verify descending order
    // Note: Default filter is 'Active', so only active users are shown: alice, bob, diana, frank
    // When sorted descending: frank > diana > bob > alice
    await waitFor(
      () => {
        usernames = getUsernames();
        expect(usernames[0]).toBe(storyUsers[5].username);
      },
      { timeout: 3000 },
    );

    // Re-find the button and click again to sort ascending
    const sortButton2 = await getSortButton();
    await userEvent.click(sortButton2);

    // Verify ascending order again
    await waitFor(
      () => {
        usernames = getUsernames();
        expect(usernames[0]).toBe(storyUsers[0].username);
      },
      { timeout: 3000 },
    );
  },
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [...usersHandlers([])],
    },
  },
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for empty state to render - shows "No users match your search" because Active filter is set by default
    await waitFor(
      () => {
        expect(canvas.getByText(/no users match your search/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

export const WithInitialSelection: Story = {
  args: {
    onSelect: fn(),
    initialSelectedUsers: [storyUsers[0], storyUsers[1]],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to render
    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify selected users display shows initial selection
    const selectedDisplay = await canvas.findByTestId('selected-users');
    expect(selectedDisplay).toHaveTextContent(storyUsers[0].username);
    expect(selectedDisplay).toHaveTextContent(storyUsers[1].username);
  },
};
