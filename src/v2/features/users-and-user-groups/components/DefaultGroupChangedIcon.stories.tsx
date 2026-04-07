import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DefaultGroupChangedIcon } from './DefaultGroupChangedIcon';

const meta = {
  title: 'V2/Users and User Groups/Components/DefaultGroupChangedIcon',
  component: DefaultGroupChangedIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a group name with an info icon for customized default groups. The popover explains that the group has been customized and is no longer system-managed.',
      },
    },
  },
} satisfies Meta<typeof DefaultGroupChangedIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Group name with info icon for a customized default group.
 * Shows when platform_default=true AND system=false.
 */
export const CustomizedDefaultGroup: Story = {
  args: {
    name: 'Custom default access',
  },
};

/**
 * Example with longer group name
 */
export const LongGroupName: Story = {
  args: {
    name: 'Custom default access with a very long name that might wrap',
  },
};
