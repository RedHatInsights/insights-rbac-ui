import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady, waitForDrawer } from '../../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../../../test-utils/testUtils';
import { findSortButton } from '../../../../test-utils/tableHelpers';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MyGroups } from './MyGroups';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { roleBindingsHandlers } from '../../../data/mocks/roleBindings.handlers';
import type { MockRoleBinding } from '../../../data/mocks/roleBindings.fixtures';
import { GROUP_PLATFORM_ADMINS, GROUP_SUPPORT_TEAM, GROUP_SYSTEM_DEFAULT } from '../../../../shared/data/mocks/seed';
import { V2_ROLE_WORKSPACE_ADMIN, WS_PRODUCTION } from '../../../data/mocks/seed';

const meta: Meta<typeof MyGroups> = {
  component: MyGroups,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...groupsHandlers(), ...roleBindingsHandlers()],
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
          const rows = canvas.queryAllByRole('row');
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
          const rows = canvas.queryAllByRole('row');
          expect(rows[1]).toHaveTextContent(new RegExp(GROUP_SYSTEM_DEFAULT.name, 'i'));
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
    });
  },
};

const DRAWER_BINDING: MockRoleBinding = {
  id: 'binding-drawer-1',
  role_id: V2_ROLE_WORKSPACE_ADMIN.id!,
  role_name: V2_ROLE_WORKSPACE_ADMIN.name!,
  subject_type: 'group',
  subject_id: GROUP_PLATFORM_ADMINS.uuid,
  resource_id: WS_PRODUCTION.id!,
  resource_type: 'workspace',
  created: '2024-06-01T00:00:00Z',
};

/**
 * Opens the drawer for a group and verifies V2 role binding data.
 */
export const DrawerShowsRoleBindings: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers(), ...roleBindingsHandlers([DRAWER_BINDING])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Wait for data to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Click Platform Admins row to open drawer', async () => {
      const row = await canvas.findByText(GROUP_PLATFORM_ADMINS.name);
      await user.click(row);
    });

    await step('Verify drawer shows role binding data', async () => {
      const drawer = await waitForDrawer();
      await expect(drawer.findByText(GROUP_PLATFORM_ADMINS.name)).resolves.toBeInTheDocument();
      await expect(drawer.findByText(DRAWER_BINDING.role_name)).resolves.toBeInTheDocument();
      await expect(drawer.findByText(DRAWER_BINDING.resource_id)).resolves.toBeInTheDocument();
    });
  },
};
