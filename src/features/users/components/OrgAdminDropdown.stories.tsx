import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { OrgAdminDropdown } from './OrgAdminDropdown';

const meta: Meta<typeof OrgAdminDropdown> = {
  component: OrgAdminDropdown,
  parameters: {
    docs: {
      description: {
        component: 'A dropdown component for toggling organization administrator status of users. Provides a clean interface with Yes/No options.',
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
      description: 'Whether the dropdown is disabled (e.g., for current user)',
      control: { type: 'boolean' },
    },
    isLoading: {
      description: 'Whether the dropdown is in a loading state',
      control: { type: 'boolean' },
    },
    onToggle: {
      description: 'Callback function called when org admin status changes. Receives (isOrgAdmin: boolean, username: string)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrgAdminDropdown>;

// Mock user data
const mockUsername = 'john.doe';

export const OrgAdminUser: Story = {
  args: {
    isOrgAdmin: true,
    username: mockUsername,
    isDisabled: false,
    isLoading: false,
    onToggle: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show "Yes" since user is org admin
    const toggle = await canvas.findByTestId('org-admin-dropdown-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toHaveTextContent('Yes');
    await expect(toggle).not.toBeDisabled();

    // Click to open dropdown
    await userEvent.click(toggle);

    // Should show both options - find the actual button elements
    const yesButton = await canvas.findByRole('menuitem', { name: 'Yes' });
    const noButton = await canvas.findByRole('menuitem', { name: 'No' });
    await expect(yesButton).toBeInTheDocument();
    await expect(noButton).toBeInTheDocument();

    // Click "No" to demote from org admin
    await userEvent.click(noButton);

    // Verify onToggle was called with correct parameters
    await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(false, mockUsername));
  },
  parameters: {
    docs: {
      description: {
        story:
          'User who is currently an organization administrator. Shows "Yes" and allows demotion to regular user. Tests verify onToggle callback works correctly.',
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show "No" since user is not org admin
    const toggle = await canvas.findByTestId('org-admin-dropdown-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toHaveTextContent('No');
    await expect(toggle).not.toBeDisabled();

    // Click to open dropdown
    await userEvent.click(toggle);

    // Should show both options - find the actual button elements
    const yesButton = await canvas.findByRole('menuitem', { name: 'Yes' });
    const noButton = await canvas.findByRole('menuitem', { name: 'No' });
    await expect(yesButton).toBeInTheDocument();
    await expect(noButton).toBeInTheDocument();

    // Click "Yes" to promote to org admin
    await userEvent.click(yesButton);

    // Verify onToggle was called with correct parameters
    await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(true, mockUsername));
  },
  parameters: {
    docs: {
      description: {
        story:
          'Regular user who is not an organization administrator. Shows "No" and allows promotion to org admin. Tests verify onToggle callback works correctly.',
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Should be disabled (e.g., current user can't change their own status)
    const toggle = await canvas.findByTestId('org-admin-dropdown-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toBeDisabled();

    // Verify onToggle is not called when disabled
    await expect(args.onToggle).not.toHaveBeenCalled();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should be disabled when loading
    const toggle = await canvas.findByTestId('org-admin-dropdown-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toBeDisabled();
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state - dropdown is disabled while an org admin status change is in progress.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    isOrgAdmin: false,
    username: 'demo.user',
    isDisabled: false,
    isLoading: false,
    onToggle: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Test complete interaction flow
    const toggle = await canvas.findByTestId('org-admin-dropdown-toggle');

    // Initial state
    await expect(toggle).toHaveTextContent('No');
    await expect(toggle).not.toBeDisabled();

    // Open dropdown
    await userEvent.click(toggle);

    // Both options should be visible
    const yesButton = await canvas.findByRole('menuitem', { name: 'Yes' });
    const noButton = await canvas.findByRole('menuitem', { name: 'No' });
    await expect(yesButton).toBeInTheDocument();
    await expect(noButton).toBeInTheDocument();

    // Test clicking same option (should not trigger callback)
    await userEvent.click(noButton);
    await expect(args.onToggle).not.toHaveBeenCalled();

    // Wait for dropdown to close, then reopen and test different option
    await waitFor(async () => await expect(yesButton).not.toBeInTheDocument());
    await userEvent.click(toggle);

    // Find the buttons again after reopening
    const newYesButton = await canvas.findByRole('menuitem', { name: 'Yes' });
    await userEvent.click(newYesButton);

    // Verify onToggle was called with correct parameters
    await waitFor(async () => await expect(args.onToggle).toHaveBeenCalledWith(true, 'demo.user'));
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing full dropdown behavior including edge cases. Tests verify onToggle callbacks work with (isOrgAdmin: boolean, username: string) parameters.',
      },
    },
  },
};
