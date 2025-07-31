import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { DefaultServiceAccountsCard } from './DefaultServiceAccountsCard';

const meta: Meta<typeof DefaultServiceAccountsCard> = {
  component: DefaultServiceAccountsCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A card component for displaying default group service account restrictions. Features:
- Shows different messages for platform default vs admin default groups
- Centers content using PatternFly Bullseye layout
- Uses semantic heading level (h1) for accessibility
- Handles internationalization internally using react-intl
- Designed for default groups where service accounts cannot be added
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DefaultServiceAccountsCard>;

export const PlatformDefault: Story = {
  args: {
    isPlatformDefault: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the correct message is displayed for platform default
    const message = await canvas.findByRole('heading', { level: 1 });
    await expect(message).toBeInTheDocument();
    await expect(message).toHaveTextContent(
      'In adherence to security guidelines, service accounts are not automatically included in the default access group. To grant access, it is necessary to manually add them to the appropriate user access groups.',
    );
  },
};

export const AdminDefault: Story = {
  args: {
    isPlatformDefault: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the correct message is displayed for admin default
    const message = await canvas.findByRole('heading', { level: 1 });
    await expect(message).toBeInTheDocument();
    await expect(message).toHaveTextContent(
      'In adherence to security guidelines, service accounts are not automatically included in the default admin access group. To grant access, it is necessary to manually add them to the appropriate user access groups.',
    );
  },
};
