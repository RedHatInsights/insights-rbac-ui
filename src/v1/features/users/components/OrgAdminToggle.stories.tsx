import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { OrgAdminToggle } from './OrgAdminToggle';

const meta: Meta<typeof OrgAdminToggle> = {
  component: OrgAdminToggle,
  parameters: {
    docs: {
      description: {
        component:
          'A toggle switch for managing organization administrator status. Replaces the previous dropdown with a PatternFly Switch for a cleaner, more accessible UI.',
      },
    },
  },
  argTypes: {
    isOrgAdmin: {
      description: 'Whether the user is currently an organization administrator',
      control: { type: 'boolean' },
    },
    username: {
      description: 'Username of the user whose org admin status is being managed',
      control: { type: 'text' },
    },
    isDisabled: {
      description: 'Whether the toggle is disabled (e.g., for current user, non-admin viewer, or inactive user)',
      control: { type: 'boolean' },
    },
    isLoading: {
      description: 'Whether the toggle is in a loading state',
      control: { type: 'boolean' },
    },
    onToggle: {
      description: 'Callback function called when org admin status changes. Receives (isOrgAdmin: boolean, username: string)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrgAdminToggle>;

const mockUsername = 'john.doe';

export const OrgAdminUser: Story = {
  args: {
    isOrgAdmin: true,
    username: mockUsername,
    isDisabled: false,
    isLoading: false,
    onToggle: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle off to revoke org admin', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle org admin for ${mockUsername}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeChecked();
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(false, mockUsername));
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'User who is currently an organization administrator. Switch is checked. Clicking it revokes org admin and calls onToggle(false, username).',
      },
    },
  },
};

export const RegularUser: Story = {
  args: {
    isOrgAdmin: false,
    username: mockUsername,
    isDisabled: false,
    isLoading: false,
    onToggle: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle on to grant org admin', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle org admin for ${mockUsername}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).not.toBeChecked();
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(true, mockUsername));
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Regular user who is not an organization administrator. Switch is unchecked. Clicking it grants org admin and calls onToggle(true, username).',
      },
    },
  },
};

export const DisabledState: Story = {
  args: {
    isOrgAdmin: true,
    username: 'current.user',
    isDisabled: true,
    isLoading: false,
    onToggle: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify disabled state', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: /toggle org admin for current\.user/i,
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeDisabled();

      await expect(args.onToggle).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state — typically when the viewer is not an org admin, the target user is inactive, or the viewer is looking at their own account.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    isOrgAdmin: false,
    username: mockUsername,
    isDisabled: false,
    isLoading: true,
    onToggle: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle org admin for ${mockUsername}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state — switch is disabled while an org admin status change is in progress.',
      },
    },
  },
};
