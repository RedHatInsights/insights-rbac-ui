import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { UserGroupsSelectionTable } from './UserGroupsSelectionTable';
import { groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import { DEFAULT_GROUPS, GROUP_PLATFORM_ADMINS, USER_JANE, USER_JOHN } from '../../../../../shared/data/mocks/seed';
import { TEST_TIMEOUTS } from '../../../../../test-utils/testUtils';
import { findCompoundExpandButton } from '../../../../../test-utils/tableHelpers';

const FIRST_GROUP = GROUP_PLATFORM_ADMINS;

const selectableGroups = DEFAULT_GROUPS.filter((g) => !g.platform_default && !g.admin_default).map((g) => ({
  uuid: g.uuid,
  name: g.name,
  description: g.description,
  principalCount: typeof g.principalCount === 'number' ? g.principalCount : 0,
  platform_default: g.platform_default,
  admin_default: g.admin_default,
}));

const onGroupSelectionSpy = fn();

const meta: Meta<typeof UserGroupsSelectionTable> = {
  component: UserGroupsSelectionTable,
  args: {
    groups: selectableGroups,
    selectedGroups: [],
    onGroupSelection: onGroupSelectionSpy,
  },
  parameters: {
    msw: {
      handlers: [...groupMembersHandlers()],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserGroupsSelectionTable>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Table renders with group data', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(FIRST_GROUP.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};

export const CompoundExpansion: Story = {
  name: 'Expand members',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Wait for table to render', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(FIRST_GROUP.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Click members count to expand', async () => {
      const expandButton = findCompoundExpandButton(canvas, FIRST_GROUP.name, 'Members');
      await user.click(expandButton);
    });

    const johnFullName = `${USER_JOHN.first_name} ${USER_JOHN.last_name}`;
    const janeFullName = `${USER_JANE.first_name} ${USER_JANE.last_name}`;

    await step('Expanded area shows member names fetched on demand', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(johnFullName)).toBeInTheDocument();
          expect(canvas.queryByText(janeFullName)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Click again to collapse', async () => {
      const expandButton = findCompoundExpandButton(canvas, FIRST_GROUP.name, 'Members');
      await user.click(expandButton);

      await waitFor(() => {
        expect(canvas.queryByText(johnFullName)).not.toBeInTheDocument();
      });
    });
  },
};
