import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { DefaultServiceAccountsAlert } from './DefaultServiceAccountsAlert';

const meta: Meta<typeof DefaultServiceAccountsAlert> = {
  component: DefaultServiceAccountsAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An info alert for displaying default group service account restrictions. Features:
- Shows different messages for platform default vs admin default groups
- Uses PatternFly's inline Alert component with info variant
- Handles internationalization internally using react-intl
- Designed for default groups where service accounts cannot be added
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DefaultServiceAccountsAlert>;

export const PlatformDefault: Story = {
  args: {
    isPlatformDefault: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the correct message is displayed for platform default
    const message = await canvas.findByText(
      /In adherence to security guidelines, service accounts are not automatically included in the default access group/i,
    );
    await expect(message).toBeInTheDocument();
  },
};

export const AdminDefault: Story = {
  args: {
    isPlatformDefault: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the correct message is displayed for admin default
    const message = await canvas.findByText(
      /In adherence to security guidelines, service accounts are not automatically included in the default admin access group/i,
    );
    await expect(message).toBeInTheDocument();
  },
};
