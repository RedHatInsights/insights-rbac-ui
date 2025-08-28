import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DefaultGroupRestore } from './DefaultGroupRestore';

const meta: Meta<typeof DefaultGroupRestore> = {
  component: DefaultGroupRestore,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A component for restoring default group access with informational popover. Features:
- Link-style button to trigger restore action
- Info icon with popover explaining the restore process
- Uses PatternFly Popover with specific positioning
- Handles internationalization internally using react-intl
- Designed for default access groups that can be restored to their original state
        `,
      },
    },
  },
  args: {
    onRestore: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof DefaultGroupRestore>;

export const InteractionTest: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify the restore button is displayed
    const restoreButton = await canvas.findByRole('button', { name: /restore to default/i });
    await expect(restoreButton).toBeInTheDocument();

    // Test clicking the restore button
    await userEvent.click(restoreButton);
    await expect(args.onRestore).toHaveBeenCalled();

    // Find and test the info icon
    const infoIcon = await canvas.findByRole('button', { name: /more information/i });
    await userEvent.click(infoIcon);

    // Verify popover content appears
    // Note: Using document.body because popover content is portaled
    const body = within(document.body);
    const popoverContent = await body.queryAllByText('Custom default access');
    await expect(popoverContent).toHaveLength(2);

    // Click elsewhere to close popover
    await userEvent.click(document.body);

    // Test restore button again to ensure it still works
    await userEvent.click(restoreButton);
    await expect(args.onRestore).toHaveBeenCalledTimes(2);
  },
};
