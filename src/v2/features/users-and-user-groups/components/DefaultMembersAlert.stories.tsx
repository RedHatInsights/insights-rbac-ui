import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DefaultMembersAlert } from './DefaultMembersAlert';

const meta = {
  title: 'V2/Users and User Groups/Components/DefaultMembersAlert',
  component: DefaultMembersAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Alert shown in default groups to indicate all users/org admins are automatic members.',
      },
    },
  },
} satisfies Meta<typeof DefaultMembersAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Alert for platform_default group (Default access)
 * Shows that all users are automatically members.
 */
export const PlatformDefaultGroup: Story = {
  args: {
    isAdminDefault: false,
  },
};

/**
 * Alert for admin_default group (Default admin access)
 * Shows that all org admins are automatically members.
 */
export const AdminDefaultGroup: Story = {
  args: {
    isAdminDefault: true,
  },
};
