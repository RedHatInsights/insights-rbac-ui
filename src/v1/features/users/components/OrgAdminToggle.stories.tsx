import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { OrgAdminToggle } from './OrgAdminToggle';

const mockUsername = 'john.doe';

const meta: Meta<typeof OrgAdminToggle> = {
  component: OrgAdminToggle,
  tags: ['autodocs', 'sbtest:org-admin-toggle'],
  parameters: {
    docs: {
      description: {
        component:
          'A PatternFly Switch for toggling organization administrator status. Disabled when the viewer is not an org admin, the target user is inactive, or a mutation is in progress.',
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
      description: 'Whether the switch is disabled (non-admin viewer, inactive user, or current user)',
      control: { type: 'boolean' },
    },
    isLoading: {
      description: 'Whether the switch is in a loading state',
      control: { type: 'boolean' },
    },
    onToggle: {
      description: 'Callback function called when org admin status changes. Receives (isOrgAdmin: boolean, username: string)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrgAdminToggle>;

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

    await step('Demote org admin via switch', async () => {
      const toggle = await canvas.findByRole('switch', { name: new RegExp(`toggle org admin for ${mockUsername}`, 'i') });
      await expect(toggle).toBeChecked();
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(false, mockUsername));
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'User who is currently an organization administrator. Switch is on and clicking it demotes them to a regular user.',
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

    await step('Promote regular user to org admin via switch', async () => {
      const toggle = await canvas.findByRole('switch', { name: new RegExp(`toggle org admin for ${mockUsername}`, 'i') });
      await expect(toggle).not.toBeChecked();
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(true, mockUsername));
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Regular user who is not an organization administrator. Switch is off and clicking it grants org admin.',
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
      const toggle = await canvas.findByRole('switch', { name: /toggle org admin for current.user/i });
      await expect(toggle).toBeDisabled();
      await expect(args.onToggle).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state used when the viewer is not an org admin, the target user is inactive, or the current user cannot change their own org admin status.',
      },
    },
  },
};

export const InactiveUser: Story = {
  args: {
    isOrgAdmin: false,
    username: mockUsername,
    isDisabled: true,
    isLoading: false,
    onToggle: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify inactive user switch is disabled', async () => {
      const toggle = await canvas.findByRole('switch', { name: new RegExp(`toggle org admin for ${mockUsername}`, 'i') });
      await expect(toggle).not.toBeChecked();
      await expect(toggle).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Inactive users cannot have org admin status changed. The switch is shown but disabled.',
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
      const toggle = await canvas.findByRole('switch', { name: new RegExp(`toggle org admin for ${mockUsername}`, 'i') });
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
