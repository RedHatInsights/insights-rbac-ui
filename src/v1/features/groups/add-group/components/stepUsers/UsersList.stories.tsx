import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { queryByOuiaId } from '../../../../../../test-utils/interactionHelpers';
import { findSortButton } from '../../../../../../test-utils/tableHelpers';
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify users table and data', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(await canvas.findByText(storyUsers[0].username)).toBeInTheDocument();
      expect(await canvas.findByText(storyUsers[1].username)).toBeInTheDocument();

      const activeLabels = await canvas.findAllByText('Active');
      expect(activeLabels.length).toBeGreaterThan(0);
    });
  },
};

export const SelectUsers: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Select user and verify onSelect', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await canvas.findByText(storyUsers[0].username);

      const checkboxes = await canvas.findAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(args.onSelect).toHaveBeenCalled();
      });

      expect(await canvas.findByTestId('selected-users')).toBeInTheDocument();
    });
  },
};

export const FilterByUsername: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Apply username filter and verify', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await canvas.findByText(storyUsers[0].username);

      const filterInput = await canvas.findByPlaceholderText(/filter by username/i);
      await userEvent.type(filterInput, 'alice');

      await waitFor(
        () => {
          expect(usersApiSpy).toHaveBeenCalled();
          const lastCall = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0];
          expect(lastCall.username).toBe('alice');
        },
        { timeout: 2000 },
      );

      expect(await canvas.findByText(storyUsers[0].username)).toBeInTheDocument();
    });
  },
};

export const FilterByStatus: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Switch to Status filter and select Inactive', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await canvas.findByText(storyUsers[0].username);

      const filterContainer = queryByOuiaId(canvasElement, 'DataViewFilters');
      expect(filterContainer).toBeTruthy();
      const filterCanvas = within(filterContainer as HTMLElement);

      const filterTypeButtons = filterCanvas.getAllByRole('button');
      const filterDropdownButton = filterTypeButtons.find((btn) => btn.textContent?.includes('Username'));
      expect(filterDropdownButton).toBeTruthy();
      await userEvent.click(filterDropdownButton!);

      const statusOption = await within(document.body).findByRole('menuitem', { name: /status/i });
      await userEvent.click(statusOption);

      const statusFilterToggle = queryByOuiaId(canvasElement, 'DataViewCheckboxFilter-toggle') as HTMLElement;
      expect(statusFilterToggle).toBeTruthy();
      await userEvent.click(statusFilterToggle);

      const inactiveMenuItem = await within(document.body).findByRole('menuitem', { name: /inactive/i });
      const inactiveCheckbox = within(inactiveMenuItem).getByRole('checkbox');
      await userEvent.click(inactiveCheckbox);

      await waitFor(
        () => {
          expect(usersApiSpy).toHaveBeenCalled();
          const lastCall = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0];
          expect(lastCall.status).toBe('all');
        },
        { timeout: 2000 },
      );

      expect(await canvas.findByText(storyUsers[2].username)).toBeInTheDocument();
    });
  },
};

export const SortByUsername: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial ascending sort', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await canvas.findByText(storyUsers[0].username);

      const getUsernames = () => {
        const table = canvas.queryByRole('grid');
        if (!table) return [];
        const rows = within(table).queryAllByRole('row');
        const dataRows = rows.slice(1);
        return dataRows.map((row) => within(row).queryAllByRole('cell')[2]?.textContent?.trim()).filter(Boolean);
      };

      let usernames = getUsernames();
      expect(usernames[0]).toBe(storyUsers[0].username);

      const sortButton = await findSortButton(canvas, /username/i);
      expect(sortButton).toBeInTheDocument();

      await userEvent.click(sortButton);

      await waitFor(
        () => {
          usernames = getUsernames();
          expect(usernames[0]).toBe(storyUsers[5].username);
        },
        { timeout: 3000 },
      );
    });

    await step('Click sort again for ascending', async () => {
      const getUsernames = () => {
        const table = canvas.queryByRole('grid');
        if (!table) return [];
        const rows = within(table).queryAllByRole('row');
        const dataRows = rows.slice(1);
        return dataRows.map((row) => within(row).queryAllByRole('cell')[2]?.textContent?.trim()).filter(Boolean);
      };

      const sortButton2 = await findSortButton(canvas, /username/i);
      await userEvent.click(sortButton2);

      await waitFor(
        () => {
          const usernames = getUsernames();
          expect(usernames[0]).toBe(storyUsers[0].username);
        },
        { timeout: 3000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(/no users match your search/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  },
};

export const WithInitialSelection: Story = {
  args: {
    onSelect: fn(),
    initialSelectedUsers: [storyUsers[0], storyUsers[1]],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial selection displayed', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByRole('grid')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const selectedDisplay = await canvas.findByTestId('selected-users');
      expect(selectedDisplay).toHaveTextContent(storyUsers[0].username);
      expect(selectedDisplay).toHaveTextContent(storyUsers[1].username);
    });
  },
};
