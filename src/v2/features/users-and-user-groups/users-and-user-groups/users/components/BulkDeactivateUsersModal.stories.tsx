import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { BulkDeactivateUsersModal } from './BulkDeactivateUsersModal';

const meta: Meta<typeof BulkDeactivateUsersModal> = {
  component: BulkDeactivateUsersModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**BulkDeactivateUsersModal** is a presentational modal component for confirming bulk user deactivation.

## Component Responsibilities
- **Confirmation Dialog**: Provides clear confirmation for bulk deactivation actions
- **User Information**: Displays the list of users being deactivated for verification
- **Safety Check**: Requires checkbox confirmation to prevent accidental bulk operations
- **Internationalization**: Uses react-intl for all user-facing text
- **Minimal Props**: Accepts only essential data needed for the modal

## Key Features
- **Warning Modal**: Uses PatternFly's WarningModal for dangerous bulk action UX
- **Confirmation Checkbox**: Requires user to check a box before enabling the action
- **User List Display**: Shows all usernames that will be affected
- **Accessible**: Full ARIA support and keyboard navigation
- **Safe Design**: Clear action buttons with danger styling for bulk operations

## Architecture Pattern
This is a **presentational component** that:
- Receives minimal props (isOpen, usernames, callbacks)
- Handles its own internationalization and validation
- Has no knowledge of external state or business logic
- Focuses purely on user confirmation workflow
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state
export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Deactivate Users
        </Button>
        <BulkDeactivateUsersModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onConfirm={() => {
            setIsOpen(false);
            args.onConfirm();
          }}
        />
      </>
    );
  },
  args: {
    usernames: ['user1', 'user2'],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic functionality test with two users. Opens the modal to verify user list display, confirmation checkbox requirement, and proper button states.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(canvas.getByText('Deactivate Users'));

    // Modal should be visible in document.body (portal)
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Verify both usernames are displayed in the modal
    await expect(within(modal).getByText('user1')).toBeInTheDocument();
    await expect(within(modal).getByText('user2')).toBeInTheDocument();

    // Verify confirmation checkbox is present and unchecked
    const checkbox = within(modal).getByRole('checkbox');
    await expect(checkbox).toBeInTheDocument();
    await expect(checkbox).not.toBeChecked();

    // Verify confirm button is disabled initially (requires checkbox)
    const confirmButton = within(modal).getByRole('button', { name: /deactivate/i });
    await expect(confirmButton).toBeDisabled();

    // Verify cancel button is always enabled
    const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeEnabled();
  },
};

// Confirmation flow
export const ConfirmationFlow: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Deactivate Users
        </Button>
        <BulkDeactivateUsersModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onConfirm={() => {
            setIsOpen(false);
            args.onConfirm();
          }}
        />
      </>
    );
  },
  args: {
    usernames: ['john.doe', 'jane.smith'],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the complete confirmation workflow including checkbox requirement. Verifies that the confirm button is disabled until the checkbox is checked, then tests successful confirmation.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(canvas.getByText('Deactivate Users'));

    // Modal should be visible in document.body (portal)
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Verify both usernames are displayed
    await expect(within(modal).getByText('john.doe')).toBeInTheDocument();
    await expect(within(modal).getByText('jane.smith')).toBeInTheDocument();

    // Confirm button should be disabled initially
    const confirmButton = within(modal).getByRole('button', { name: /deactivate/i });
    await expect(confirmButton).toBeDisabled();

    // Check the confirmation checkbox
    const checkbox = within(modal).getByRole('checkbox');
    await userEvent.click(checkbox);

    // Confirm button should now be enabled
    await expect(confirmButton).toBeEnabled();

    // Click confirm
    await userEvent.click(confirmButton);

    // Verify callback was called
    await expect(args.onConfirm).toHaveBeenCalled();
  },
};

// Cancel action
export const CancelAction: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Deactivate Users
        </Button>
        <BulkDeactivateUsersModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onConfirm={() => {
            setIsOpen(false);
            args.onConfirm();
          }}
        />
      </>
    );
  },
  args: {
    usernames: ['user1', 'user2'],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the cancel action workflow. When the user clicks Cancel or closes the modal, the onClose callback should be triggered without performing any deactivation.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(canvas.getByText('Deactivate Users'));

    // Find and click the cancel button
    const modal = await screen.findByRole('dialog');
    const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Verify close callback was called
    await expect(args.onClose).toHaveBeenCalled();
  },
};

// Single user
export const SingleUser: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Deactivate User
        </Button>
        <BulkDeactivateUsersModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onConfirm={() => {
            setIsOpen(false);
            args.onConfirm();
          }}
        />
      </>
    );
  },
  args: {
    usernames: ['single.user'],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with a single user for deactivation. Tests how the modal displays when only one user is selected for bulk deactivation.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(canvas.getByText('Deactivate User'));

    // Should show the single username
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).getByText('single.user')).toBeInTheDocument();
  },
};

// Many users
export const ManyUsers: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Deactivate 10 Users
        </Button>
        <BulkDeactivateUsersModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onConfirm={() => {
            setIsOpen(false);
            args.onConfirm();
          }}
        />
      </>
    );
  },
  args: {
    usernames: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with many users selected for bulk deactivation. Tests how the modal handles and displays a large list of usernames.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(canvas.getByText('Deactivate 10 Users'));

    // Should show multiple usernames
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).getByText('user1')).toBeInTheDocument();
    await expect(within(modal).getByText('user10')).toBeInTheDocument();
  },
};

// Empty list edge case
export const EmptyList: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Deactivate Users
        </Button>
        <BulkDeactivateUsersModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onConfirm={() => {
            setIsOpen(false);
            args.onConfirm();
          }}
        />
      </>
    );
  },
  args: {
    usernames: [],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with empty usernames array. The modal should handle this gracefully and either not render or show appropriate messaging.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(canvas.getByText('Deactivate Users'));

    // Modal behavior with empty list - should either not show or handle gracefully
    // The exact behavior depends on the component implementation
  },
};
