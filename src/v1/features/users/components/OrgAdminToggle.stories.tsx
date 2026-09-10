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
          'A toggle (Switch) component for managing organization administrator status of users. Replaces the previous dropdown with a simpler toggle pattern matching the v2 Users list.',
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
      description: 'Whether the toggle is disabled (e.g., for current user or inactive users)',
      control: { type: 'boolean' },
    },
    isLoading: {
      description: 'Whether the toggle is in a loading state',
      control: { type: 'boolean' },
    },
    onToggle: {
      description: 'Callback function called when org admin status changes. Receives (isOrgAdmin: boolean)',
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

    await step('Toggle off to demote org admin', async () => {
      const toggle = await canvas.findByRole('checkbox', { name: `Toggle org admin for ${mockUsername}` });
      await expect(toggle).toBeChecked();
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(false));
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'User who is currently an org admin. Toggle is checked. Clicking demotes to regular user.',
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

    await step('Toggle on to promote to org admin', async () => {
      const toggle = await canvas.findByRole('checkbox', { name: `Toggle org admin for ${mockUsername}` });
      await expect(toggle).not.toBeChecked();
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(true));
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Regular user. Toggle is unchecked. Clicking promotes to org admin.',
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
      const toggle = await canvas.findByRole('checkbox', { name: 'Toggle org admin for current.user' });
      await expect(toggle).toBeDisabled();
      await expect(args.onToggle).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state - typically when users view their own account and cannot change their own org admin status.',
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

    await step('Verify loading state disables toggle', async () => {
      const toggle = await canvas.findByRole('checkbox', { name: `Toggle org admin for ${mockUsername}` });
      await expect(toggle).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state - toggle is disabled while an org admin status change is in progress.',
      },
    },
  },
};
