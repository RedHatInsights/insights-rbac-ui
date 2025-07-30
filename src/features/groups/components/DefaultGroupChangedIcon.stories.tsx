import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { DefaultGroupChangedIcon } from './DefaultGroupChangedIcon';

const meta: Meta<typeof DefaultGroupChangedIcon> = {
  component: DefaultGroupChangedIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A specialized icon component for groups that have changed from their default state. Features:
- Displays group name with an info icon
- Shows popover with explanatory message when icon is clicked
- Uses PatternFly Popover component for consistent UX
- Handles internationalization internally using react-intl
- Specifically designed for default access groups that have been modified
        `,
      },
    },
  },
  args: {
    name: 'Default access',
  },
};

export default meta;

type Story = StoryObj<typeof DefaultGroupChangedIcon>;

export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the icon component renders with text label
    await expect(canvas.findByText('Default access')).resolves.toBeInTheDocument();

    // Find and click the info icon to open popover
    const infoIcon = await canvas.findByRole('button');
    await userEvent.click(infoIcon);

    // Verify popover content appears
    // Note: Using document.body because popover content is portaled
    // The text is fragmented by bold tags, so we look for a part that should be together
    const body = within(document.body);
    const popoverContent = await body.findByText('Custom default access');
    await expect(popoverContent).toBeInTheDocument();

    // Click elsewhere to close (click on the group name)
    const groupName = await canvas.findByText('Default access');
    await userEvent.click(groupName);

    // Click icon again to reopen
    await userEvent.click(infoIcon);
    const reopenedContent = await body.findByText('Custom default access');
    await expect(reopenedContent).toBeInTheDocument();
  },
};
