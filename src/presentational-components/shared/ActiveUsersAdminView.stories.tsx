import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { ActiveUsersAdminView } from './ActiveUsersAdminView';

const meta = {
  component: ActiveUsersAdminView,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    prefix: '',
  },
} satisfies Meta<typeof ActiveUsersAdminView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {};
