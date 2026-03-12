import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MyGroups } from './MyGroups';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { groupRolesHandlers } from '../../../../shared/data/mocks/groupRoles.handlers';

const meta: Meta<typeof MyGroups> = {
  component: MyGroups,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...groupsHandlers(), ...groupRolesHandlers()],
    },
    docs: {
      description: {
        component: `
"My groups" tab — shows groups the current user belongs to.

Clicking a row opens a drawer with the group's assigned roles and their workspace assignments.

### Design References

<img src="/mocks/my-access/My Access-1.png" alt="My Access groups tab" width="400" />
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MyGroups>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByLabelText('My groups')).resolves.toBeInTheDocument();
  },
};

/**
 * Tests sorting functionality for the Group Name column.
 *
 * Verifies that:
 * - The Group Name column header is sortable (has sort button)
 * - Clicking the sort button toggles between ascending and descending order
 * - The data is correctly sorted after each click
 */
export const SortByName: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for table to load
    const table = await canvas.findByLabelText('My groups');
    await expect(table).toBeInTheDocument();

    // Find the "Group Name" column header sort button
    const nameHeader = await canvas.findByRole('button', { name: /group name/i });
    await expect(nameHeader).toBeInTheDocument();

    // Initially sorted ascending by name (default)
    // Groups in seed data: "Default admin access", "Default access", "Engineering", "Platform Admins", "Support Team"
    let rows = await canvas.findAllByRole('row');
    // Skip header row (index 0), check data rows
    expect(rows.length).toBeGreaterThan(1);

    // Click to sort descending
    await user.click(nameHeader);
    await waitFor(async () => {
      rows = await canvas.findAllByRole('row');
      const firstDataRow = rows[1]; // Skip header
      // After descending sort, "Support Team" should be first
      expect(firstDataRow).toHaveTextContent(/support team/i);
    });

    // Click again to sort ascending
    await user.click(nameHeader);
    await waitFor(async () => {
      rows = await canvas.findAllByRole('row');
      const firstDataRow = rows[1]; // Skip header
      // After ascending sort, "Default access" or "Default admin access" should be first (alphabetically)
      expect(firstDataRow).toHaveTextContent(/default/i);
    });
  },
};
