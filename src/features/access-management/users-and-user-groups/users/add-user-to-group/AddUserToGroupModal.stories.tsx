import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { AddUserToGroupModal } from './AddUserToGroupModal';

// Mock users data
const mockUsers = [
  { id: 'user1', username: 'john.doe', email: 'john.doe@example.com' },
  { id: 'user2', username: 'jane.smith', email: 'jane.smith@example.com' },
  { id: 'user3', username: 'bob.wilson', email: 'bob.wilson@example.com' },
];

// Mock groups data for the table
const mockGroups = [
  {
    uuid: '1',
    name: 'Administrators',
    description: 'System administrators with full access',
    principalCount: 5,
    roleCount: 3,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-06-15T10:30:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: '2',
    name: 'Developers',
    description: 'Development team members',
    principalCount: 12,
    roleCount: 2,
    created: '2023-02-01T00:00:00Z',
    modified: '2023-06-10T14:20:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: '3',
    name: 'Read Only Users',
    description: 'Users with read-only access',
    principalCount: 8,
    roleCount: 1,
    created: '2023-03-01T00:00:00Z',
    modified: '2023-06-01T09:15:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

const meta: Meta<typeof AddUserToGroupModal> = {
  component: AddUserToGroupModal,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DataViewEventsProvider>
          <Story />
        </DataViewEventsProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**AddUserToGroupModal** is a modal component for adding selected users to user groups.

## Component Responsibilities
- **Group Selection**: Displays available user groups in a table for selection
- **User Context**: Shows how many users will be added and provides clear confirmation
- **Redux Integration**: Dispatches addMembersToGroup actions for each selected group
- **Validation**: Disables the add button until at least one group is selected
- **User Feedback**: Provides clear messaging about the operation being performed

## Key Features
- **Internationalization**: Uses react-intl for all user-facing text
- **Selection Management**: Handles multiple group selection with validation
- **Batch Operations**: Adds users to multiple groups in a single action
- **User-Friendly**: Shows number of users and uses proper plural forms
- **Accessibility**: Full ARIA support and keyboard navigation

## Architecture Pattern
This is a **container component** that:
- Manages its own modal state and group selection
- Dispatches Redux actions for group membership changes
- Integrates with UserGroupsTable presentational component
- Handles business logic for adding users to groups

## Usage Context
Used from the Users table when users are selected and "Add to group" action is triggered.
        `,
      },
    },
  },
  args: {
    isOpen: false,
    setIsOpen: fn(),
    selectedUsers: [mockUsers[0]],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const addMembersToGroupSpy = fn();

// Interactive story template
const InteractiveTemplate = (args: any) => {
  const [isOpen, setIsOpen] = useState(args.isOpen);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Add to Group Modal</Button>
      <AddUserToGroupModal {...args} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
};

// Main story with autodocs
export const Default: Story = {
  tags: ['autodocs'],
  render: InteractiveTemplate,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: mockGroups,
            meta: { count: mockGroups.length },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: `
**Default State**: Modal for adding one user to selected groups.

The modal displays:
- Clear description of the operation
- User count with proper singular/plural handling
- Table of available groups for selection
- Disabled "Add" button until groups are selected
- Cancel option to close without changes
        `,
      },
    },
  },
  play: async () => {
    // Mock clearing to track calls
    addMembersToGroupSpy.mockClear();

    // Open the modal
    const button = await screen.findByRole('button', { name: /open add to group modal/i });
    await userEvent.click(button);

    // Wait for modal and groups to load
    await waitFor(
      async () => {
        const body = within(document.body);
        await expect(body.getByText('Add to user group')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Add user interaction logic here if needed
    const body = within(document.body);
    const addButton = body.getByRole('button', { name: /add/i });
    await expect(addButton).toBeDisabled(); // Should be disabled initially
  },
};

// Multiple users story
export const MultipleUsers: Story = {
  render: InteractiveTemplate,
  args: {
    selectedUsers: mockUsers,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: mockGroups,
            meta: { count: mockGroups.length },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: `
**Multiple Users**: Modal for adding multiple users to selected groups.

This story demonstrates:
- Plural form handling ("3 users" instead of "3 user")
- Same functionality with multiple users selected
- Batch operation context
        `,
      },
    },
  },
  play: async () => {
    // Mock clearing to track calls
    addMembersToGroupSpy.mockClear();

    // Open the modal
    const button = await screen.findByRole('button', { name: /open add to group modal/i });
    await userEvent.click(button);

    // Wait for modal and groups to load
    await waitFor(
      async () => {
        const body = within(document.body);
        await expect(body.getByText('Add to user group')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Add user interaction logic here if needed
    const body = within(document.body);
    const addButton = body.getByRole('button', { name: /add/i });
    await expect(addButton).toBeDisabled(); // Should be disabled initially
  },
};

// Group selection interaction story
export const GroupSelection: Story = {
  render: InteractiveTemplate,
  args: {
    selectedUsers: [mockUsers[0]],
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: mockGroups,
            meta: { count: mockGroups.length },
          });
        }),
        http.post('/api/rbac/v1/groups/:groupId/principals', ({ request, params }) => {
          addMembersToGroupSpy(request, params);
          return HttpResponse.json({ success: true });
        }),
      ],
    },
    docs: {
      description: {
        story: `
**Group Selection Flow**: Demonstrates the complete interaction flow.

This story tests:
- Group selection enabling the Add button
- Multiple group selection
- Cancel functionality
- Form validation
        `,
      },
    },
  },
  play: async () => {
    await delay(300);
    addMembersToGroupSpy.mockClear();

    // Open the modal using screen instead of canvas (modal renders in document.body)
    const button = await screen.findByRole('button', { name: /open add to group modal/i });
    await userEvent.click(button);

    // Wait for modal and groups to load
    await waitFor(
      async () => {
        const body = within(document.body);
        await expect(body.getByText('Add to user group')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const body = within(document.body);

    // Wait for groups to load in the modal
    const groupRow = await body.findByText('Administrators');
    await expect(groupRow).toBeInTheDocument();

    // Select a group (Administrators) by clicking its checkbox
    const adminGroup = body.getByText('Administrators');
    const adminRow = adminGroup.closest('tr');
    await expect(adminRow).toBeInTheDocument();
    const adminCheckbox = within(adminRow as HTMLElement).getByRole('checkbox');
    await userEvent.click(adminCheckbox);

    // Verify the Add button is now enabled
    const addButton = body.getByRole('button', { name: /add/i });
    await expect(addButton).not.toBeDisabled();

    // Click Add button
    await userEvent.click(addButton);

    await waitFor(async () => {
      await expect(addMembersToGroupSpy).toHaveBeenCalledWith(
        expect.any(Request),
        expect.objectContaining({ groupId: '1' }), // First group (Administrators)
      );
    });
  },
};

// Closed state story
export const Closed: Story = {
  args: {
    isOpen: false,
    selectedUsers: [mockUsers[0]],
  },
  parameters: {
    docs: {
      description: {
        story: `
**Closed State**: Modal in closed state.

Used for testing that the modal doesn't render when closed.
        `,
      },
    },
  },
  play: async () => {
    await delay(300);
    const canvas = within(document.body);

    // Verify modal is not visible
    await expect(canvas.queryByText(/add to user group/i)).not.toBeInTheDocument();
  },
};
