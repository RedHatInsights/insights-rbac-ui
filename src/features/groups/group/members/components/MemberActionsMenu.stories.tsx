import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';

import { MemberActionsMenu } from './MemberActionsMenu';
import type { MemberTableRow } from '../types';

// Mock data
const mockSelectedRows: MemberTableRow[] = [
  {
    id: '1',
    row: [true, 'alice.johnson', 'alice.johnson@example.com', 'Johnson', 'Alice'],
    member: {
      username: 'alice.johnson',
      email: 'alice.johnson@example.com',
      first_name: 'Alice',
      last_name: 'Johnson',
      is_active: true,
    },
  },
  {
    id: '2',
    row: [false, 'bob.smith', 'bob.smith@example.com', 'Smith', 'Bob'],
    member: {
      username: 'bob.smith',
      email: 'bob.smith@example.com',
      first_name: 'Bob',
      last_name: 'Smith',
      is_active: false,
    },
  },
];

const meta: Meta<typeof MemberActionsMenu> = {
  component: MemberActionsMenu,
  parameters: {
    docs: {
      description: {
        component: `
**MemberActionsMenu**: Pure dropdown component for bulk member actions.

This component provides:
- **Add Members**: Always available action to add new members to the group
- **Remove Members**: Available when members are selected for bulk removal

The menu automatically enables/disables actions based on the current selection state.
All business logic is handled by parent components through callbacks.
        `,
      },
    },
  },
  argTypes: {
    selectedRows: {
      description: 'Array of currently selected member rows',
    },
    onRemoveMembers: {
      description: 'Callback when "Remove Members" action is triggered',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MemberActionsMenu>;

// Default state with no selection
export const NoSelection: Story = {
  args: {
    selectedRows: [],
    onRemoveMembers: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the kebab menu button
    const menuButton = canvas.getByLabelText('Kebab toggle');
    expect(menuButton).toBeInTheDocument();

    // Click to open the menu
    await userEvent.click(menuButton);

    // Should show "Remove" option disabled (no selection)
    const removeOption = await canvas.findByRole('menuitem', { name: 'Remove' });
    expect(removeOption).toBeInTheDocument();
    expect(removeOption).toHaveAttribute('disabled');
  },
};

// State with members selected
export const WithSelection: Story = {
  args: {
    selectedRows: mockSelectedRows,
    onRemoveMembers: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the kebab menu button
    const menuButton = canvas.getByLabelText('Kebab toggle');
    expect(menuButton).toBeInTheDocument();

    // Click to open the menu
    await userEvent.click(menuButton);

    // Should show "Remove" option enabled (has selection)
    const removeOption = await canvas.findByRole('menuitem', { name: 'Remove' });
    expect(removeOption).toBeInTheDocument();
    expect(removeOption).not.toHaveAttribute('disabled');
  },
};

// Interactive test - clicking remove members (with selection)
export const RemoveMembersInteraction: Story = {
  args: {
    selectedRows: mockSelectedRows,
    onRemoveMembers: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the menu
    const menuButton = canvas.getByLabelText('Kebab toggle');
    await userEvent.click(menuButton);

    // Click "Remove" option
    const removeOption = await canvas.findByRole('menuitem', { name: 'Remove' });
    await userEvent.click(removeOption);

    // Verify the callback was called with the member data (not full rows)
    expect(args.onRemoveMembers).toHaveBeenCalledWith(mockSelectedRows.map((row) => row.member));
  },
};

// Single selection
export const SingleSelection: Story = {
  args: {
    selectedRows: [mockSelectedRows[0]], // Only Alice selected
    onRemoveMembers: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the menu and verify remove option is available
    const menuButton = canvas.getByLabelText('Kebab toggle');
    await userEvent.click(menuButton);

    const removeOption = await canvas.findByRole('menuitem', { name: 'Remove' });
    expect(removeOption).not.toHaveAttribute('disabled');
  },
};
