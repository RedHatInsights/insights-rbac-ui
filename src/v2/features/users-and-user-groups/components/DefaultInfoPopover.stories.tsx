import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DefaultInfoPopover } from './DefaultInfoPopover';

const meta = {
  title: 'V2/Users and User Groups/Components/DefaultInfoPopover',
  component: DefaultInfoPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Keyboard-accessible info popover displayed next to default group names in the table. Opens on click or keyboard activation.',
      },
    },
  },
} satisfies Meta<typeof DefaultInfoPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Popover for platform_default group (Default access)
 * Shows info about inherited roles for all users.
 */
export const PlatformDefaultGroup: Story = {
  args: {
    id: 'default-group-popover',
    uuid: 'platform-default-uuid',
    bodyContent: 'All users in this organization inherit roles assigned to this group.',
    ariaLabel: 'Default group information',
  },
};

/**
 * Popover for admin_default group (Default admin access)
 * Shows info about inherited roles for org admins.
 */
export const AdminDefaultGroup: Story = {
  args: {
    id: 'default-admin-group-popover',
    uuid: 'admin-default-uuid',
    bodyContent: 'All org admins in this organization inherit roles assigned to this group.',
    ariaLabel: 'Admin default group information',
  },
};
