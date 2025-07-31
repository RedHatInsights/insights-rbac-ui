import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DefaultInfoPopover } from './DefaultInfoPopover';

const meta: Meta<typeof DefaultInfoPopover> = {
  component: DefaultInfoPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A reusable informational popover component featuring a question circle icon. Features:
- Click to show/hide popover with informational content
- Fixed position to the right
- Automatic click-outside to close behavior
- Accessible with proper ARIA attributes
- Visual state indication with icon-active class
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DefaultInfoPopover>;

export const Default: Story = {
  args: {
    id: 'default-popover',
    uuid: 'test-uuid-123',
    bodyContent: 'This is helpful information about the default access group that users inherit.',
  },
};
