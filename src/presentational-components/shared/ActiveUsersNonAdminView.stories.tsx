import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { ActiveUsersNonAdminView } from './ActiveUsersNonAdminView';

const meta = {
  component: ActiveUsersNonAdminView,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof ActiveUsersNonAdminView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {},
};
