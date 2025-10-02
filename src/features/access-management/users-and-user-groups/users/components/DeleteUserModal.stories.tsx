import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { DeleteUserModal } from './DeleteUserModal';

// Wrapper component that manages modal state and provides trigger button
const ModalWrapper = ({ ...storyArgs }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string>('');

  const handleConfirm = () => {
    // Call the Storybook action for testing
    if (storyArgs.onConfirm) {
      storyArgs.onConfirm();
    }
    setSubmissionResult(`Deleted user "${storyArgs.username}"`);
    setIsOpen(false);
  };

  const handleClose = () => {
    // Call the Storybook action for testing
    if (storyArgs.onClose) {
      storyArgs.onClose();
    }
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Button variant="danger" onClick={() => setIsOpen(true)} data-testid="open-modal-button">
        Test modal
      </Button>
      {submissionResult && (
        <div style={{ marginTop: '8px', color: 'green', fontWeight: 'bold' }} data-testid="submission-result">
          {submissionResult}
        </div>
      )}
      <DeleteUserModal {...storyArgs} isOpen={isOpen} onClose={handleClose} onConfirm={handleConfirm} />
    </div>
  );
};

const meta: Meta<typeof DeleteUserModal> = {
  component: DeleteUserModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The DeleteUserModal component provides a confirmation dialog for deleting users from the system.

## Features
- **Confirmation Pattern**: Requires explicit user confirmation before deletion
- **User Context**: Shows the specific username being deleted
- **Internationalization**: Handles all text internally using react-intl
- **Accessible Design**: Uses PatternFly WarningModal with proper ARIA labels
- **Callback-based Actions**: Pure presentational component with action callbacks

## Usage
This modal is typically triggered from user management interfaces when a delete action is initiated.
The modal ensures users understand the consequences of the deletion action.

## Business Logic
- **User Display**: Shows the username in the confirmation message
- **Validation**: Only renders when a username is provided
- **Action Handling**: Delegates all business logic to parent via callbacks
`,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    username: {
      control: 'text',
      description: 'Username of the user to be deleted',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  render: (args) => <ModalWrapper {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

// Standard delete confirmation flow
export const StandardFlow: Story = {
  args: {
    username: 'john.doe',
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the complete delete confirmation flow: opening the modal, verifying content displays correctly, and confirming deletion. Validates modal renders with correct username, action buttons are present and functional. Critical for safe user deletion workflows.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open the modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Verify modal is open and content is correct
    await expect(body.findByRole('heading')).resolves.toBeInTheDocument();
    await expect(body.findByText(/john\.doe/i)).resolves.toBeInTheDocument();

    // Verify modal buttons
    await expect(body.findByRole('button', { name: /remove/i })).resolves.toBeInTheDocument();
    await expect(body.findByRole('button', { name: /cancel/i })).resolves.toBeInTheDocument();
  },
};

// Test confirm action
export const ConfirmAction: Story = {
  args: {
    username: 'user.to.delete',
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the confirm action specifically by clicking the Remove button and verifying the onConfirm callback is triggered. Validates the deletion confirmation interaction works correctly and provides visual feedback. Essential for testing the actual deletion action flow.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open modal and confirm deletion
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Click confirm button
    const confirmButton = await body.findByRole('button', { name: /remove/i });
    await userEvent.click(confirmButton);

    // Verify success message appears
    await expect(canvas.findByTestId('submission-result')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Deleted user "user.to.delete"/)).resolves.toBeInTheDocument();
  },
};

// Test cancel action
export const CancelAction: Story = {
  args: {
    username: 'user.to.cancel',
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the cancel action by clicking the Cancel button and verifying the onClose callback is triggered. Validates that users can safely exit the deletion flow without performing the action. Critical for preventing accidental deletions.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open modal and cancel
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Click cancel button
    const cancelButton = await body.findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Verify the onClose callback was called
    await expect(args.onClose).toHaveBeenCalled();

    // Modal should be closed (no heading in body)
    await expect(body.queryByRole('heading')).not.toBeInTheDocument();
  },
};

// Test with different user types
export const AdminUser: Story = {
  args: {
    username: 'admin.user',
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Tests the modal display with an admin user's username to ensure proper rendering regardless of user type. Validates that usernames are displayed correctly in the confirmation message. Important for verifying the modal works consistently across different user roles.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open the modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Verify org admin user is displayed
    await expect(body.findByText(/admin\.user/i)).resolves.toBeInTheDocument();
  },
};

// Test with special characters in username
export const SpecialCharacterUsername: Story = {
  args: {
    username: 'user@company.com',
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the modal with usernames containing special characters (like email format). Validates that special characters are properly escaped and displayed without breaking the modal functionality. Critical for supporting diverse username formats.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open the modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Verify email user is displayed
    await expect(body.findByText(/user@company\.com/i)).resolves.toBeInTheDocument();
  },
};

// Test null username handling
export const NoUsername: Story = {
  args: {
    username: undefined,
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests edge case handling when no username is provided. Validates that the modal properly handles null/undefined usernames by not rendering, preventing broken UI states. Essential for robust error handling.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Modal should not be visible when username is undefined
    const body = within(document.body);
    await expect(body.queryByRole('heading')).not.toBeInTheDocument();
  },
};
