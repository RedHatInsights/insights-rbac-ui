import type { Meta, StoryObj } from '@storybook/react';
import { DefaultServiceAccountsAlert } from './DefaultServiceAccountsAlert';

const meta = {
  title: 'V2/Users and User Groups/Components/DefaultServiceAccountsAlert',
  component: DefaultServiceAccountsAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Security compliance alert explaining that service accounts are not automatically included in default groups.',
      },
    },
  },
} satisfies Meta<typeof DefaultServiceAccountsAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Alert for platform_default group (Default access)
 * Explains service accounts are not included in Default access group.
 */
export const PlatformDefaultGroup: Story = {
  args: {
    isPlatformDefault: true,
  },
};

/**
 * Alert for admin_default group (Default admin access)
 * Explains service accounts are not included in Default admin access group.
 */
export const AdminDefaultGroup: Story = {
  args: {
    isPlatformDefault: false,
  },
};
