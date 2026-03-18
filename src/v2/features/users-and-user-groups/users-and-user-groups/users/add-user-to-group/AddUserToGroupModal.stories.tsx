import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { AddUserToGroupModal } from './AddUserToGroupModal';
import { groupsHandlers } from '../../../../../../shared/data/mocks/groups.handlers';
import { groupMembersHandlers } from '../../../../../../shared/data/mocks/groupMembers.handlers';

// Mock users data
const mockUsers = [
  { id: 'user1', username: 'john.doe', email: 'john.doe@example.com' },
  { id: 'user2', username: 'jane.smith', email: 'jane.smith@example.com' },
  { id: 'user3', username: 'bob.wilson', email: 'bob.wilson@example.com' },
];

// Mock groups data for the table (MockGroup format)
const mockGroupsForHandlers = [
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
- **Data Integration**: Uses addMembersToGroup mutations for each selected group
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
- Dispatches React Query mutations for group membership changes
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

interface InteractiveTemplateArgs extends React.ComponentProps<typeof AddUserToGroupModal> {
  isOpen: boolean;
}

// Interactive story template
const InteractiveTemplate = (args: InteractiveTemplateArgs) => {
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
      handlers: [...groupsHandlers(mockGroupsForHandlers)],
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
  play: async ({ step }) => {
    await step('Open modal and verify initial state', async () => {
      addMembersToGroupSpy.mockClear();

      const button = await screen.findByRole('button', { name: /open add to group modal/i });
      await userEvent.click(button);

      await waitFor(
        async () => {
          const body = within(document.body);
          await expect(body.queryByText('Add to user group')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const body = within(document.body);
      const addButton = body.getByRole('button', { name: /^add$/i });
      await expect(addButton).toBeDisabled();
    });
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
      handlers: [...groupsHandlers(mockGroupsForHandlers)],
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
  play: async ({ step }) => {
    await step('Open modal and verify initial state', async () => {
      addMembersToGroupSpy.mockClear();

      const button = await screen.findByRole('button', { name: /open add to group modal/i });
      await userEvent.click(button);

      await waitFor(
        async () => {
          const body = within(document.body);
          await expect(body.queryByText('Add to user group')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const body = within(document.body);
      const addButton = body.getByRole('button', { name: /^add$/i });
      await expect(addButton).toBeDisabled();
    });
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
        ...groupsHandlers(mockGroupsForHandlers),
        ...groupMembersHandlers(undefined, undefined, {
          onAddMembersWithRequest: addMembersToGroupSpy,
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
  play: async ({ step }) => {
    await step('Open modal and wait for groups to load', async () => {
      addMembersToGroupSpy.mockClear();

      const button = await screen.findByRole('button', { name: /open add to group modal/i });
      await userEvent.click(button);

      await waitFor(
        async () => {
          const body = within(document.body);
          await expect(body.queryByText('Add to user group')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      const body = within(document.body);
      const groupRow = await body.findByText('Administrators');
      await expect(groupRow).toBeInTheDocument();
    });

    await step('Select group and add', async () => {
      const body = within(document.body);

      const adminGroup = body.getByText('Administrators');
      const adminRow = adminGroup.closest('tr');
      await expect(adminRow).toBeInTheDocument();
      const adminCheckbox = within(adminRow as HTMLElement).getByRole('checkbox');
      await userEvent.click(adminCheckbox);

      const addButton = body.getByRole('button', { name: /^add$/i });
      await expect(addButton).not.toBeDisabled();

      await userEvent.click(addButton);

      await waitFor(async () => {
        await expect(addMembersToGroupSpy).toHaveBeenCalledWith(expect.any(Request), expect.objectContaining({ groupId: '1' }));
      });
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
  play: async ({ step }) => {
    await step('Verify modal is not visible', async () => {
      const canvas = within(document.body);
      await expect(canvas.queryByText(/add to user group/i)).not.toBeInTheDocument();
    });
  },
};
