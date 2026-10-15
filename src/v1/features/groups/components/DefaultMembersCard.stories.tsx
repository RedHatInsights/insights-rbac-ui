import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { queryAlert } from '../../../../test-utils/interactionHelpers';
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify platform default card', async () => {
      // Verify the alert is displayed for platform default (PF6 inline alerts use pf-v6-c-alert class)
      const alert = queryAlert(canvasElement, 'info');
      await expect(alert).toBeInTheDocument();
      await expect(canvas.findByText('All users in this organization are members of this group.')).resolves.toBeInTheDocument();
    });
  },
};

export const AdminDefault: Story = {
  args: {
    isAdminDefault: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify admin default card', async () => {
      // Verify the alert is displayed for admin default (PF6 inline alerts use pf-v6-c-alert class)
      const alert = queryAlert(canvasElement, 'info');
      await expect(alert).toBeInTheDocument();
      await expect(canvas.findByText('All organization administrators in this organization are members of this group.')).resolves.toBeInTheDocument();
    });
  },
};
