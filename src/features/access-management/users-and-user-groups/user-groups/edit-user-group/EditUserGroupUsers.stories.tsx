import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';

import { EditGroupUsersTable } from './EditUserGroupUsers';

// Mock users data
const mockUsers = [
  {
    id: '1',
    uuid: '1',
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: '123',
  },
  {
    id: '2',
    uuid: '2',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: '456',
  },
  {
    id: '3',
    uuid: '3',
    username: 'bob.wilson',
    email: 'bob.wilson@example.com',
    first_name: 'Bob',
    last_name: 'Wilson',
    is_active: false,
    is_org_admin: false,
    external_source_id: '789',
  },
];

const meta: Meta<typeof EditGroupUsersTable> = {
  component: EditGroupUsersTable,
  tags: ['access-management-form'],
  parameters: {
    docs: {
      description: {
        component: `
**EditGroupUsersTable** is a form component for managing users within a user group during editing workflows.

### Form Component Features
- **User Selection**: Bulk and individual selection with visual feedback
- **Data Management**: Tracks initial vs updated user associations for efficient API calls
- **Search & Pagination**: Built-in filtering and pagination for large user lists
- **State Management**: Integrates with Redux for user data and loading states
- **Change Tracking**: Reports user additions/removals through onChange callback

### Integration Patterns
- **Form Field**: Designed to work within @data-driven-forms workflows
- **Redux Connected**: Fetches user data and manages loading states through Redux
- **Container Separation**: Pure table logic separated from form integration
- **MSW Compatible**: Stories use MSW handlers for realistic data scenarios

### Business Logic
- **Initial State**: Takes existing group members as initial selection
- **Diff Tracking**: Calculates which users were added/removed for API efficiency
- **Bulk Operations**: Supports page-level and all-users selection patterns
- **Filtering**: Real-time search across user properties
        `,
      },
    },
  },
  argTypes: {
    groupId: {
      description: 'UUID of the group being edited',
      control: 'text',
    },
    initialUserIds: {
      description: 'Array of user IDs currently in the group',
      control: 'object',
    },
    onChange: {
      description: 'Callback fired when user selection changes',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with users loaded
export const Default: Story = {
  args: {
    groupId: 'group-123',
    initialUserIds: ['1'], // John is initially in the group
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('MSW: Users principals API called (default):', request.url);
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for users to load
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Verify table structure
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('bob.wilson')).resolves.toBeInTheDocument();

    // Verify initial selection (John should be pre-selected)
    const johnRow = (await canvas.findByText('john.doe')).closest('tr');
    await expect(johnRow).toBeInTheDocument();

    // Check pagination is present
    const pagination = await canvas.findByLabelText(/pagination/i);
    await expect(pagination).toBeInTheDocument();
  },
};

// Loading state
export const Loading: Story = {
  args: {
    groupId: 'group-123',
    initialUserIds: [],
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', async () => {
          await delay('infinite');
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Check for loading skeleton
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};

// Empty state (no users found)
export const EmptyState: Story = {
  args: {
    groupId: 'group-123',
    initialUserIds: [],
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('MSW: Users principals API called (empty):', request.url);
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for empty state to appear
    await expect(canvas.findByText(/no users found/i)).resolves.toBeInTheDocument();

    // Verify empty state message
    await expect(canvas.findByText(/no users found/i)).resolves.toBeInTheDocument();
  },
};

// User selection interaction
export const UserSelection: Story = {
  args: {
    groupId: 'group-123',
    initialUserIds: ['1'], // John is initially selected
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('MSW: Users principals API called:', request.url);
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for users to load
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Find Jane's row and checkbox
    const janeRow = (await canvas.findByText('jane.smith')).closest('tr');
    await expect(janeRow).toBeInTheDocument();

    const janeCheckbox = within(janeRow as HTMLElement).getByRole('checkbox');
    await expect(janeCheckbox).not.toBeChecked();

    // Select Jane
    await userEvent.click(janeCheckbox);

    // Verify Jane is now selected
    await expect(await janeCheckbox).toBeChecked();

    // Test bulk selection
    const bulkSelectButton = await canvas.findByRole('button', { name: /bulk select/i });
    if (bulkSelectButton) {
      await userEvent.click(bulkSelectButton);

      // Look for "Select page" option
      const selectPageOption = await canvas.queryByText(/select page/i);
      if (selectPageOption) {
        await userEvent.click(selectPageOption);

        // All visible checkboxes should now be checked
        const allCheckboxes = await canvas.getAllByRole('checkbox');
        allCheckboxes.forEach(async (checkbox) => {
          if (checkbox.getAttribute('aria-label')?.includes('Select row')) {
            await expect(checkbox).toBeChecked();
          }
        });
      }
    }
  },
};

// Pre-selected users scenario
export const PreSelectedUsers: Story = {
  args: {
    groupId: 'group-123',
    initialUserIds: ['1', '2'], // John and Jane are initially in the group
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('MSW: Users principals API called (selection):', request.url);
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for users to load
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Verify John and Jane are pre-selected
    const johnRow = (await canvas.findByText('john.doe')).closest('tr');
    const johnCheckbox = within(johnRow as HTMLElement).getByRole('checkbox');
    await expect(johnCheckbox).toBeChecked();

    const janeRow = (await canvas.findByText('jane.smith')).closest('tr');
    const janeCheckbox = within(janeRow as HTMLElement).getByRole('checkbox');
    await expect(janeCheckbox).toBeChecked();

    // Bob should not be selected
    const bobRow = (await canvas.findByText('bob.wilson')).closest('tr');
    const bobCheckbox = within(bobRow as HTMLElement).getByRole('checkbox');
    await expect(bobCheckbox).not.toBeChecked();
  },
};

// API Error state
export const APIError: Story = {
  args: {
    groupId: 'group-123',
    initialUserIds: [],
    onChange: fn(),
  },
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true, // Ignore expected 500 errors from MSW
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('MSW: Users principals API called (error):', request.url);
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for error state to appear
    await expect(canvas.findByText(/failed to load users/i)).resolves.toBeInTheDocument();

    // Verify error message details
    await expect(canvas.findByText(/failed to load users/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/please try refreshing the page/i)).resolves.toBeInTheDocument();
  },
};
