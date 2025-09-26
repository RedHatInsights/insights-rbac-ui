import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { DeleteGroupModal } from './DeleteGroupModal';
import { Group } from '../../../../../redux/groups/reducer';

// Mock group data
const mockGroup: Group = {
  uuid: '1',
  name: 'Test Group',
  description: 'A test group for deletion',
  principalCount: 5,
  roleCount: 2,
  created: '2023-01-01T00:00:00Z',
  modified: '2023-01-01T00:00:00Z',
  platform_default: false,
  admin_default: false,
  system: false,
};

const mockGroups: Group[] = [
  mockGroup,
  {
    ...mockGroup,
    uuid: '2',
    name: 'Second Group',
    description: 'Another test group',
  },
  {
    ...mockGroup,
    uuid: '3',
    name: 'Third Group',
    description: 'Yet another test group',
  },
];

const meta: Meta<typeof DeleteGroupModal> = {
  component: DeleteGroupModal,
  tags: ['autodocs', 'delete-group-modal'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**DeleteGroupModal** is a presentational modal component for confirming user group deletion.

## Component Responsibilities
- **Confirmation Dialog**: Provides clear confirmation for destructive actions
- **Group Information**: Displays the groups being deleted for user verification
- **Internationalization**: Uses react-intl for all user-facing text
- **Minimal Props**: Accepts only essential data needed for the modal

## Key Features
- **Warning Modal**: Uses PatternFly's WarningModal for consistent dangerous action UX
- **Single/Multiple Support**: Handles both single group and bulk deletion scenarios
- **Accessible**: Full ARIA support and keyboard navigation
- **Safe Design**: Clear action buttons with danger styling for delete confirmation

## Architecture Pattern
This is a **presentational component** that:
- Receives minimal props (isOpen, groups, callbacks)
- Handles its own internationalization
- Has no knowledge of Redux or business logic
- Focuses purely on user confirmation workflow
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default closed state
export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Group
        </Button>
        <DeleteGroupModal
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
    groups: [mockGroup],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic functionality test opening the modal and verifying content. Tests that the modal displays the correct group information and provides appropriate action buttons.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Group'));

    // Modal should be visible in document.body (portal)
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Check modal displays the group name correctly
    await expect(within(modal).findByText('Test Group')).resolves.toBeInTheDocument();

    // Verify action buttons are present and accessible
    await expect(within(modal).findByRole('button', { name: /delete/i })).resolves.toBeInTheDocument();
    await expect(within(modal).findByRole('button', { name: /cancel/i })).resolves.toBeInTheDocument();

    // Verify delete button is enabled (not a system/platform default group)
    const deleteButton = await within(modal).findByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeEnabled();
  },
};

// Open modal state
export const OpenModal: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Group
        </Button>
        <DeleteGroupModal
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
    groups: [mockGroup],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modal in open state showing single group deletion confirmation. Displays the group name and provides clear action options for the user.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal first
    await userEvent.click(await canvas.findByText('Delete Group'));

    // Modal should be visible in document.body (portal)
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Check modal content
    await expect(within(modal).findByText('Test Group')).resolves.toBeInTheDocument();
    await expect(within(modal).findByRole('button', { name: /delete/i })).resolves.toBeInTheDocument();
    await expect(within(modal).findByRole('button', { name: /cancel/i })).resolves.toBeInTheDocument();
  },
};

// Confirm action
export const ConfirmAction: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Group
        </Button>
        <DeleteGroupModal
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
    groups: [mockGroup],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the confirmation action workflow. When the user clicks the Delete button, the onConfirm callback should be triggered with the appropriate group information.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Group'));

    // Find and click the confirm button
    const modal = await screen.findByRole('dialog');
    const confirmButton = await within(modal).findByRole('button', { name: /delete/i });
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
          Delete Group
        </Button>
        <DeleteGroupModal
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
    groups: [mockGroup],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the cancel action workflow. When the user clicks Cancel or closes the modal, the onClose callback should be triggered without performing any deletion.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Group'));

    // Find and click the cancel button
    const modal = await screen.findByRole('dialog');
    const cancelButton = await within(modal).findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Verify close callback was called
    await expect(args.onClose).toHaveBeenCalled();
  },
};

// Multiple groups deletion
export const MultipleGroups: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Multiple Groups
        </Button>
        <DeleteGroupModal
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
    groups: mockGroups,
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bulk deletion scenario with multiple groups selected. Shows how the modal adapts its messaging and displays multiple group names for user verification.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Multiple Groups'));

    // Modal should show multiple group deletion message
    const modal = await screen.findByRole('dialog');
    const modalContent = within(modal);

    // For multiple groups, the message shows count, not individual names
    // Expected: "Delete user groups?" and "Deleting 3 user groups will impact..."
    await expect(modalContent.findByText(/Delete user groups/)).resolves.toBeInTheDocument();
    await expect(modalContent.findByText(/Deleting 3 user groups/)).resolves.toBeInTheDocument();

    // Verify the confirm button says "Delete"
    await expect(modalContent.findByRole('button', { name: /delete/i })).resolves.toBeInTheDocument();
  },
};

// Different group name
export const DifferentGroup: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Marketing Team
        </Button>
        <DeleteGroupModal
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
    groups: [
      {
        ...mockGroup,
        name: 'Marketing Team',
        description: 'Marketing department group',
      },
    ],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modal with a different group name to verify dynamic content rendering. Tests that the modal correctly displays varying group information.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Marketing Team'));

    // Should show the different group name
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).findByText('Marketing Team')).resolves.toBeInTheDocument();
  },
};

// Special characters in group name
export const SpecialCharacters: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Dev & QA Team
        </Button>
        <DeleteGroupModal
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
    groups: [
      {
        ...mockGroup,
        name: 'Dev & QA Team (2024)',
        description: 'Team with special characters',
      },
    ],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests modal with group names containing special characters to ensure proper text handling and display without breaking the interface.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Dev & QA Team'));

    // Should properly display special characters
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).findByText('Dev & QA Team (2024)')).resolves.toBeInTheDocument();
  },
};

// Empty groups array
export const EmptyGroups: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Groups
        </Button>
        <DeleteGroupModal
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
    groups: [],
    onClose: fn(),
    onConfirm: fn(),
    ouiaId: 'test-delete-group-modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with empty groups array. The modal should handle this gracefully and not render when no groups are provided for deletion.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the modal
    await userEvent.click(await canvas.findByText('Delete Groups'));

    // Modal should not appear with empty groups
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
