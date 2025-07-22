import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { DefaultMembersCard } from './DefaultMembersCard';

const meta: Meta<typeof DefaultMembersCard> = {
  component: DefaultMembersCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A card component for displaying default group membership information. Features:
- Shows different messages for admin default vs platform default groups
- Centers content using PatternFly Bullseye layout
- Uses semantic heading level (h1) for accessibility
- Handles internationalization internally using react-intl
- Designed for default groups where all users or org admins are automatically members
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DefaultMembersCard>;

export const PlatformDefault: Story = {
  args: {
    isAdminDefault: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the correct message is displayed for platform default
    const message = await canvas.findByRole('heading', { level: 1 });
    await expect(message).toBeInTheDocument();
    await expect(message).toHaveTextContent('All users in this organization are members of this group.');
  },
};

export const AdminDefault: Story = {
  args: {
    isAdminDefault: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the correct message is displayed for admin default
    const message = await canvas.findByRole('heading', { level: 1 });
    await expect(message).toBeInTheDocument();
    await expect(message).toHaveTextContent('All organization administrators in this organization are members of this group.');
  },
};
