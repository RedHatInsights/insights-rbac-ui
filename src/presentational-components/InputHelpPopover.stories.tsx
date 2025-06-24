import type { Meta, StoryObj } from '@storybook/react-webpack5';

import InputHelpPopover from './InputHelpPopover';

const meta = {
  component: InputHelpPopover,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof InputHelpPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    headerContent: 'Header',
    bodyContent: 'Body',
  },
};
