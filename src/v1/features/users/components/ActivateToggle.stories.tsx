import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import React from 'react';
import { ActivateToggle } from './ActivateToggle';

const mockUser = {
  username: 'testuser',
  uuid: 'user-123',
  is_active: true,
  external_source_id: 123,
};

const mockInactiveUser = {
  username: 'inactiveuser',
  uuid: 'user-456',
  is_active: false,
  external_source_id: 456,
};

const mockInternalUser = {
  username: 'internaluser',
  uuid: 'user-789',
  is_active: true,
  // No external_source_id - internal user
};

const meta: Meta<typeof ActivateToggle> = {
  component: ActivateToggle,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'console',
    },
    docs: {
      description: {
        component: `
ActivateToggle is a specialized switch component for activating/deactivating external users.

## 🎯 Purpose

This component provides user activation controls with:
- Toggle switch for external users only
- Disabled state for current account
- Proper accessibility labels
- Integration with user management workflows

## 🚩 Important Behavior

**Only shows for external users**: Internal users (no \`external_source_id\`) render nothing.
**Account protection**: Current user's own account is disabled to prevent self-deactivation.

## ⚡ Usage Patterns

### When Component Appears
- ✅ External users (\`user.external_source_id\` exists)
- ❌ Internal users (no \`external_source_id\`)

### When Switch is Disabled  
- User's \`external_source_id\` matches \`accountId\` (current user)

## 🔧 Integration

Used in user tables and management interfaces where admins need to activate/deactivate external user accounts.
        `,
      },
    },
  },
  argTypes: {
    user: {
      description: 'User object with activation status and external source information',
    },
    onToggle: {
      description: 'Callback function called when the toggle state changes. Receives (isActive: boolean, user: UserProps)',
    },
    accountId: {
      description: 'Current account ID to prevent self-deactivation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivateToggle>;

export const ActiveExternalUser: Story = {
  args: {
    user: mockUser,
    onToggle: fn(),
    accountId: '999',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the switch for external user
    const toggle = await canvas.findByTestId('user-status-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toBeChecked(); // User is active
    await expect(toggle).toBeEnabled(); // Different account, so enabled
  },
};

export const InactiveExternalUser: Story = {
  args: {
    user: mockInactiveUser,
    onToggle: fn(),
    accountId: '999',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the switch for external user
    const toggle = await canvas.findByTestId('user-status-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).not.toBeChecked(); // User is inactive
    await expect(toggle).toBeEnabled(); // Different account, so enabled
  },
};

export const CurrentUserAccount: Story = {
  args: {
    user: mockUser,
    onToggle: fn(),
    accountId: String(mockUser.external_source_id), // Same as user's external_source_id but as string
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show the switch but disabled (current user)
    const toggle = await canvas.findByTestId('user-status-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toBeChecked(); // User is active
    await expect(toggle).toBeDisabled(); // Current user's account, so disabled
  },
  parameters: {
    docs: {
      description: {
        story: 'When the user is viewing their own account, the toggle is disabled to prevent self-deactivation.',
      },
    },
  },
};

export const InternalUser: Story = {
  args: {
    user: mockInternalUser,
    onToggle: fn(),
    accountId: '999',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should NOT show any toggle for internal user
    await expect(canvas.queryByTestId('user-status-toggle')).not.toBeInTheDocument();

    // Container should be essentially empty
    const container = (await canvas.findByTestId('activate-toggle-container')) || canvasElement;
    await expect(container).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Internal users (no external_source_id) do not show any activation toggle.',
      },
    },
  },
};

export const InteractiveToggle: Story = {
  args: {
    user: mockInactiveUser,
    onToggle: fn(),
    accountId: '999',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show inactive toggle
    const toggle = await canvas.findByTestId('user-status-toggle');
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeEnabled();

    // Click to activate and verify the callback
    await userEvent.click(toggle);

    // Verify onToggle was called with correct parameters: (isActive: boolean, user: UserProps)
    await expect(args.onToggle).toHaveBeenCalledWith(true, mockInactiveUser);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing toggle behavior and callback testing. Verifies onToggle is called with (isActive: boolean, user: UserProps).',
      },
    },
  },
};

// Wrapper component for internal user story to have a testable container
const InternalUserWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <div data-testid="activate-toggle-container">{children}</div>;

// Override the render for internal user story
InternalUser.render = (args) => (
  <InternalUserWrapper>
    <ActivateToggle {...args} />
  </InternalUserWrapper>
);
