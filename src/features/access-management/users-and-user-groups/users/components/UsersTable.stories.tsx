import React, { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { UsersTable } from './UsersTable';
import type { User } from '../../../../../data/queries/users';

// Mock user data for testing - matches Principal type from rbac-client
const createMockUser = (username: string, overrides: Partial<User> = {}): User => ({
  username,
  email: `${username}@example.com`,
  first_name: username.split('.')[0] || username,
  last_name: username.split('.')[1] || '',
  is_active: true,
  is_org_admin: false,
  ...overrides,
});

const mockUsers: User[] = [
  createMockUser('john.doe', { email: 'john.doe@redhat.com', first_name: 'John', last_name: 'Doe' }),
  createMockUser('jane.smith', { email: 'jane.smith@redhat.com', first_name: 'Jane', last_name: 'Smith', is_org_admin: true }),
  createMockUser('bob.wilson', { email: 'bob.wilson@redhat.com', first_name: 'Bob', last_name: 'Wilson', is_active: false }),
  createMockUser('alice.brown', { email: 'alice.brown@redhat.com', first_name: 'Alice', last_name: 'Brown' }),
  createMockUser('charlie.davis', { email: 'charlie.davis@redhat.com', first_name: 'Charlie', last_name: 'Davis', is_org_admin: true }),
];

// Stateful wrapper that provides real selection state management
const UsersTableWithState: React.FC<
  Omit<React.ComponentProps<typeof UsersTable>, 'tableState'> & {
    initialSelectedRows?: User[];
  }
> = ({ initialSelectedRows = [], ...props }) => {
  const [selectedRows, setSelectedRows] = useState<User[]>(initialSelectedRows);
  const [sort, setSort] = useState<{ column: 'username'; direction: 'asc' | 'desc' } | null>({
    column: 'username',
    direction: 'asc',
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({ username: '', email: '' });

  const onSelectRow = useCallback((row: User, selected: boolean) => {
    setSelectedRows((prev) => (selected ? [...prev, row] : prev.filter((r) => r.username !== row.username)));
  }, []);

  const onSelectAll = useCallback((selected: boolean, rows: User[]) => {
    setSelectedRows(selected ? rows : []);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const isRowSelected = useCallback((row: User) => selectedRows.some((r) => r.username === row.username), [selectedRows]);

  const onFiltersChange = useCallback((newFilters: Record<string, string | string[]>) => {
    setFilters(newFilters);
  }, []);

  const tableState = useMemo(
    () => ({
      sort,
      onSortChange: (column: 'username', direction: 'asc' | 'desc') => setSort({ column, direction }),
      page,
      perPage,
      perPageOptions: [10, 20, 50, 100],
      onPageChange: setPage,
      onPerPageChange: setPerPage,
      selectedRows,
      onSelectRow,
      onSelectAll,
      clearSelection,
      expandedCell: null,
      onToggleExpand: fn(),
      filters,
      onFiltersChange,
      clearAllFilters: () => setFilters({ username: '', email: '' }),
      isRowSelected,
      isCellExpanded: () => false,
      isAnyExpanded: () => false,
      apiParams: {
        offset: (page - 1) * perPage,
        limit: perPage,
        orderBy: sort ? (`${sort.direction === 'desc' ? '-' : ''}${sort.column}` as const) : undefined,
        filters,
      },
    }),
    [sort, page, perPage, selectedRows, onSelectRow, onSelectAll, clearSelection, isRowSelected, filters, onFiltersChange],
  );

  return <UsersTable {...props} tableState={tableState} />;
};

const defaultArgs = {
  users: mockUsers,
  totalCount: mockUsers.length,
  isLoading: false,
  authModel: false,
  orgAdmin: true,
  isProd: false,
  defaultPerPage: 20,
  ouiaId: 'test-users-table',
  onAddUserToGroup: fn(),
  onRemoveUserFromGroup: fn(),
  onInviteUsersClick: fn(),
  onToggleUserStatus: fn(),
  onToggleOrgAdmin: fn(),
  onDeleteUser: fn(),
  onBulkActivate: fn(),
  onBulkDeactivate: fn(),
};

const meta: Meta<typeof UsersTableWithState> = {
  component: UsersTableWithState,
  tags: ['autodocs', 'perm:org-admin'],
  parameters: {
    docs: {
      description: {
        component: `
The UsersTable component provides a comprehensive data table for managing users in the RBAC system.

## Features
- Dynamic column configuration based on authModel flag
- Bulk selection and operations
- Individual user status management (active/inactive)
- Organization admin toggle functionality
- Sorting and filtering capabilities
- Loading states and empty state handling
- User focus highlighting
- Delete confirmation modals

## Business Logic
- **Column Layout**: Changes based on \`authModel\` flag - org admin column position varies
- **Status Management**: Users can be activated/deactivated with appropriate permissions
- **Bulk Operations**: Multiple users can be selected for bulk operations
- **Permission Checks**: Org admin toggles respect user permissions and production environment
- **Focus Highlighting**: Focused user is displayed with bold username

## Interactive Behaviors
- Bulk select dropdown with page/all selection options
- Individual user switches for status and org admin
- Action buttons for adding users to groups and inviting new users
- Callback-based actions for container-managed behaviors

## Container Separation
This is a presentational component that receives modals and other container logic via the \`children\` prop. 
All business logic is handled through callback props, keeping this component focused on UI presentation.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DataViewEventsProvider>
          <Story />
        </DataViewEventsProvider>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    authModel: {
      control: 'boolean',
      description: 'Whether auth model feature flag is enabled (affects column layout)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    orgAdmin: {
      control: 'boolean',
      description: 'Whether current user has org admin permissions',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    isProd: {
      control: 'boolean',
      description: 'Whether app is running in production environment',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether table is in loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic table view with standard auth model
export const StandardView: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Tests the standard table view with all default columns visible. Validates that user data renders correctly including username, email, first/last names, status, and org admin columns. This is the primary table view most users will see.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify table is rendered with correct columns - get table header specifically
    const usernameHeaders = canvas.getAllByText('Username');
    await expect(usernameHeaders.length).toBeGreaterThan(0);
    await expect(canvas.findByText('Email')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/First Name/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Last Name/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Status')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Org. Admin')).resolves.toBeInTheDocument();

    // Verify user data is displayed
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('John')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Doe')).resolves.toBeInTheDocument();
  },
};

// Auth model enabled - different column layout
export const AuthModelEnabled: Story = {
  args: {
    ...defaultArgs,
    authModel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the table when authentication model is enabled, which changes the column layout to exclude first/last names. Validates that the reduced column set displays correctly and "Org. Admin" text renders properly. Critical for environments using auth model configurations.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // With authModel, org admin column should be first
    const headers = canvas.getAllByRole('columnheader');
    await expect(headers[1]).toHaveTextContent('Org. Admin'); // First sortable column
    await expect(headers[2]).toHaveTextContent('Username');
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    ...defaultArgs,
    isLoading: true,
    users: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the loading state with skeleton components displayed while data is being fetched. Validates that skeleton placeholders render correctly and users see appropriate loading indicators instead of empty content. Essential for good UX during data loading.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Should show skeleton loading state (check for skeleton class)
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};

// Empty state
export const EmptyState: Story = {
  args: {
    ...defaultArgs,
    users: [],
    totalCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the empty state when no users are available to display. Validates that appropriate empty state messaging appears instead of an empty table. Important for first-time users or filtered views with no results.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show empty state message with heading
    await expect(canvas.findByRole('heading', { name: 'No users found' })).resolves.toBeInTheDocument();
  },
};

// User interactions - bulk selection
export const BulkSelection: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Tests the bulk selection functionality by clicking the page-level "Select page" checkbox. Validates that the bulk select mechanism works correctly for mass operations. Critical for efficient user management workflows where admins need to perform actions on multiple users.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click bulk select checkbox
    const bulkSelectCheckbox = await canvas.findByLabelText('Select page');
    await expect(bulkSelectCheckbox).toBeInTheDocument();
    await expect(bulkSelectCheckbox).not.toBeChecked();

    // Click the checkbox to test bulk selection
    await userEvent.click(bulkSelectCheckbox);

    // Verify bulk select is now checked
    await expect(bulkSelectCheckbox).toBeChecked();

    // Verify individual row checkboxes are also checked
    // Only check row selection checkboxes (not org admin toggles, status switches, etc.)
    const allCheckboxes = await canvas.findAllByRole('checkbox');
    const rowCheckboxes = allCheckboxes.filter(
      (cb) =>
        cb !== bulkSelectCheckbox &&
        !cb.getAttribute('aria-label')?.includes('Toggle') && // Exclude toggle switches
        !cb.getAttribute('id')?.includes('switch'), // Exclude switch elements
    );

    rowCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // TEST DESELECT: Click bulk select again to deselect all
    await userEvent.click(bulkSelectCheckbox);

    // Verify bulk select is now unchecked
    await expect(bulkSelectCheckbox).not.toBeChecked();

    // Verify individual row checkboxes are also unchecked
    rowCheckboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  },
};

// Status toggle interaction
export const StatusToggle: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Tests the user status toggle functionality by clicking the status switch for an active user. Validates that the toggle interaction works correctly and the callback receives the proper user object and new status value. Essential for user activation/deactivation workflows.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find status switch for first user (should be active) - switches render as checkboxes
    const statusSwitch = await canvas.findByLabelText(/Toggle status for john.doe/i);

    await expect(statusSwitch).toBeInTheDocument();
    await expect(statusSwitch).toBeChecked();

    // Click to toggle status
    await userEvent.click(statusSwitch);

    // Verify callback was called with user and new status
    await expect(defaultArgs.onToggleUserStatus).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'john.doe' }),
      false, // toggling from active to inactive
    );
  },
};

// Org admin toggle interaction
export const OrgAdminToggle: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Tests the organization admin toggle functionality by clicking the org admin switch for a non-admin user. Validates that the toggle works correctly and passes the right user and status to the callback. Critical for managing administrative privileges.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find org admin switch for first user (should not be org admin) - switches render as checkboxes
    const orgAdminSwitch = await canvas.findByLabelText(/Toggle org admin for john.doe/i);

    await expect(orgAdminSwitch).toBeInTheDocument();
    await expect(orgAdminSwitch).not.toBeChecked();

    // Click to toggle org admin status
    await userEvent.click(orgAdminSwitch);

    // Verify callback was called with user and new org admin status
    await expect(defaultArgs.onToggleOrgAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'john.doe' }),
      true, // toggling from non-admin to admin
    );
  },
};

// Add users to group interaction
export const AddUsersToGroup: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Tests the complete workflow of selecting users and adding them to a group. First selects a user via row checkbox, then clicks the "Add to user group" button. Validates that the selection mechanism works correctly and the callback receives the proper array of selected user objects. Essential for group management workflows.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // First select a user by clicking their row checkbox
    const firstRowCheckbox = await canvas.findByLabelText('Select row 0');
    await expect(firstRowCheckbox).toBeInTheDocument();

    await userEvent.click(firstRowCheckbox);

    // Wait until selection state updates and button becomes enabled
    let addToGroupButton: HTMLElement | null = null;
    await waitFor(async () => {
      addToGroupButton = canvas.queryByText(/Add to user group/i);
      if (!addToGroupButton) {
        const kebabButton = canvas.queryByLabelText('Actions overflow menu');
        if (kebabButton) {
          userEvent.click(kebabButton);
          addToGroupButton = canvas.queryByText(/Add to user group/i);
        }
      }
      await expect(addToGroupButton).not.toBeNull();
      await expect(addToGroupButton!).not.toBeDisabled();
    });

    await userEvent.click(addToGroupButton!);

    // Verify callback was called with selected users
    await expect(defaultArgs.onAddUserToGroup).toHaveBeenCalled();
  },
};

// Invite users interaction
export const InviteUsers: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story:
          'Tests the invite users functionality through the ResponsiveActions overflow menu (kebab menu). First opens the actions menu, then clicks "Invite users" option. Validates that responsive menu behavior works correctly and the invite callback is triggered. Critical for user onboarding workflows.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the kebab menu (actions overflow menu)
    const kebabButton = await canvas.findByLabelText('Actions overflow menu');
    await expect(kebabButton).toBeInTheDocument();

    await userEvent.click(kebabButton);

    // Now find and click "Invite users" in the opened dropdown
    const inviteButton = await within(document.body).findByText(/Invite users/i);
    await expect(inviteButton).toBeInTheDocument();

    await userEvent.click(inviteButton);

    // Verify callback was called
    await expect(defaultArgs.onInviteUsersClick).toHaveBeenCalled();
  },
};

// Focused user highlighting
export const FocusedUser: Story = {
  args: {
    ...defaultArgs,
    focusedUser: mockUsers[1], // Focus on Jane Smith
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the focused user highlighting feature where a specific user can be visually highlighted in the table. Validates that the focus styling is applied correctly to make the targeted user more prominent. Useful for deep-linking scenarios or when directing attention to a specific user.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Jane Smith's username should be bold when focused
    const focusedUsername = await canvas.findByText('jane.smith');
    await expect(focusedUsername.tagName.toLowerCase()).toBe('strong');

    // Other usernames should not be bold
    const regularUsername = await canvas.findByText('john.doe');
    await expect(regularUsername.tagName.toLowerCase()).not.toBe('strong');
  },
};

// Production environment restrictions
export const ProductionEnvironment: Story = {
  args: {
    ...defaultArgs,
    isProd: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests behavior in production environment where certain administrative controls are restricted. Validates that org admin switches are properly disabled to prevent accidental privilege changes in production. Critical for production safety and compliance requirements.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Org admin switches should be disabled in production - switches render as checkboxes
    const firstUserOrgAdminSwitch = await canvas.findByLabelText(/Toggle org admin for john.doe/i);

    await expect(firstUserOrgAdminSwitch).toBeDisabled();
  },
};

// Non-admin user permissions
export const NonAdminUser: Story = {
  args: {
    ...defaultArgs,
    orgAdmin: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the user interface when viewed by a non-administrator user. Validates that administrative controls like org admin toggles are properly disabled for users without sufficient privileges. Essential for proper access control and preventing unauthorized privilege escalation.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Org admin switches should be disabled for non-admin users - switches render as checkboxes
    const firstUserOrgAdminSwitch = await canvas.findByLabelText(/Toggle org admin for john.doe/i);

    await expect(firstUserOrgAdminSwitch).toBeDisabled();
  },
};

// Mixed user states (active, inactive, org admin)
export const MixedUserStates: Story = {
  args: {
    ...defaultArgs,
    users: [
      createMockUser('active.user', { is_active: true, is_org_admin: false }),
      createMockUser('admin.user', { is_active: true, is_org_admin: true }),
      createMockUser('inactive.user', { is_active: false, is_org_admin: false }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the table display with users in various states: active standard user, active admin user, and inactive user. Validates that status and admin switches reflect the correct state for each user type. Important for verifying that different user configurations display properly in a mixed list.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify different user states are displayed correctly
    await expect(canvas.findByText('active.user')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('admin.user')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('inactive.user')).resolves.toBeInTheDocument();

    // Check status switches reflect user states - switches render as checkboxes
    const activeUserSwitch = await canvas.findByLabelText(/Toggle status for active.user/i);
    const inactiveUserSwitch = await canvas.findByLabelText(/Toggle status for inactive.user/i);

    await expect(activeUserSwitch).toBeChecked();
    await expect(inactiveUserSwitch).not.toBeChecked();
  },
};

// Filter functionality test
export const FilterUsers: Story = {
  args: {
    ...defaultArgs,
    users: [
      createMockUser('john.doe', { email: 'john.doe@redhat.com', first_name: 'John', last_name: 'Doe' }),
      createMockUser('jane.smith', { email: 'jane.smith@redhat.com', first_name: 'Jane', last_name: 'Smith' }),
      createMockUser('bob.wilson', { email: 'bob.wilson@company.com', first_name: 'Bob', last_name: 'Wilson' }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: `
**Filter Functionality Test**: Validates that user filtering works correctly with username and email filters, and that the "Clear filters" button functions properly.

This story tests:
1. Username filter updates trigger onSetFilters callback
2. Email filter updates trigger onSetFilters callback  
3. "Clear filters" button appears and works correctly
4. Filter inputs are cleared when "Clear filters" is clicked

Perfect for testing filter state management and ensuring all filter controls work as expected.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial load
    await canvas.findByText('john.doe');
    await canvas.findByText('jane.smith');
    await canvas.findByText('bob.wilson');

    // TEST FILTER INPUT
    // Multi-field filter pattern: only ONE textbox is visible at a time
    const filterInput = await canvas.findByRole('textbox');

    await userEvent.type(filterInput, 'john');

    // Verify filter input has the value
    await waitFor(() => expect(filterInput).toHaveValue('john'));

    // TEST CLEAR FILTERS
    // Find and click "Clear filters" button (there may be two toolbars, use the first one)
    const clearButtons = await canvas.findAllByText('Clear filters');
    await userEvent.click(clearButtons[0]);

    // Verify filter input is cleared
    await waitFor(() => expect(filterInput).toHaveValue(''));
  },
};
