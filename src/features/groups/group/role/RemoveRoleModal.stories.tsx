import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { RemoveRoleModal } from './RemoveRoleModal';

// Wrapper component to control modal state with a trigger button
const RemoveRolesWrapper: React.FC<any> = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#c9190b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Remove Role
      </button>

      <RemoveRoleModal
        {...props}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          props.onClose?.();
        }}
        onSubmit={() => {
          setIsOpen(false);
          props.onSubmit?.();
        }}
      />
    </div>
  );
};

const meta: Meta<typeof RemoveRoleModal> = {
  component: RemoveRoleModal,
  parameters: {},
  tags: ['autodocs'],
  render: (args) => <RemoveRolesWrapper {...args} />,
  argTypes: {
    title: {
      control: 'text',
      description: 'Modal title',
    },
    text: {
      control: 'text',
      description: 'Modal content text',
    },
    confirmButtonLabel: {
      control: 'text',
      description: 'Label for the confirm button',
    },
    isDefault: {
      control: 'boolean',
      description: 'Whether this is a default group',
    },
    isChanged: {
      control: 'boolean',
      description: 'Whether the group has been changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Remove role from group?',
    text: 'This action will remove the selected role from the group. This action cannot be undone.',
    confirmButtonLabel: 'Remove',
    isDefault: false,
    isChanged: false,
    onClose: fn(),
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click trigger button to open modal
    const triggerButton = await canvas.findByRole('button', { name: /remove role/i });
    await userEvent.click(triggerButton);

    // Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Verify modal content
    expect(within(modal).getByText('Remove role from group?')).toBeInTheDocument();
    expect(within(modal).getByText(/this action will remove/i)).toBeInTheDocument();

    // Click confirm button
    const confirmButton = within(modal).getByRole('button', { name: /remove/i });
    await userEvent.click(confirmButton);

    // Verify callback was called
    expect(args.onSubmit).toHaveBeenCalled();
  },
};

export const DefaultGroupUnchanged: Story = {
  args: {
    title: 'Remove role from default group?',
    text: 'This action will remove the selected role from the default group.',
    confirmButtonLabel: 'Remove',
    isDefault: true,
    isChanged: false, // Unchanged default group - complex flow
    onClose: fn(),
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open modal
    const triggerButton = await canvas.findByRole('button', { name: /remove role/i });
    await userEvent.click(triggerButton);

    // Should show WarningModal first
    const warningModal = await screen.findByRole('dialog');
    expect(within(warningModal).getByText('Remove role from default group?')).toBeInTheDocument();

    // Click confirm on WarningModal (this sets showConfirmModal=true)
    const confirmButton = within(warningModal).getByRole('button', { name: /remove/i });
    await userEvent.click(confirmButton);

    // Now should show DefaultGroupChangeModal with checkbox
    const changeModal = await screen.findByRole('dialog');
    expect(changeModal).toBeInTheDocument();

    // Find and check the required checkbox first
    const checkbox = within(changeModal).getByRole('checkbox');
    await userEvent.click(checkbox);

    // Now find and click the "Continue" button in DefaultGroupChangeModal
    const continueButton = within(changeModal).getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    // onSubmit should be called after the DefaultGroupChangeModal confirms
    expect(args.onSubmit).toHaveBeenCalled();
  },
};

export const ClosedState: Story = {
  args: {
    title: 'Remove role from group?',
    text: 'This modal starts closed.',
    confirmButtonLabel: 'Remove',
    isDefault: false,
    isChanged: false,
    onClose: fn(),
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show trigger button but no modal
    expect(await canvas.findByRole('button', { name: /remove role/i })).toBeInTheDocument();

    // No modal should be present initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
