import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../../../test-utils/testUtils';
import { findSortButton } from '../../../../test-utils/tableHelpers';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MyGroups } from './MyGroups';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { groupRolesHandlers } from '../../../../shared/data/mocks/groupRoles.handlers';
import { GROUP_SUPPORT_TEAM, GROUP_SYSTEM_DEFAULT } from '../../../../shared/data/mocks/seed';

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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default my groups', async () => {
      await expect(canvas.findByLabelText('My groups')).resolves.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Wait for data to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Sort descending', async () => {
      const sortButton = await findSortButton(canvas, /group name/i);
      await user.click(sortButton);
      await waitFor(
        () => {
          const rows = canvas.getAllByRole('row');
          expect(rows[1]).toHaveTextContent(new RegExp(GROUP_SUPPORT_TEAM.name, 'i'));
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
    });

    await step('Sort ascending', async () => {
      const sortButton = await findSortButton(canvas, /group name/i);
      await user.click(sortButton);
      await waitFor(
        () => {
          const rows = canvas.getAllByRole('row');
          expect(rows[1]).toHaveTextContent(new RegExp(GROUP_SYSTEM_DEFAULT.name, 'i'));
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
    });
  },
};
