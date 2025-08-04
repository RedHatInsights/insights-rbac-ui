import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@patternfly/react-core';
import { EditGroupModal } from './EditGroupModal';
import type { Group } from '../types';

const mockGroup: Group = {
  uuid: 'group-1',
  name: 'Test Group',
  description: 'A test group for demonstration purposes',
  principalCount: 5,
  roleCount: 3,
  policyCount: 2,
  platform_default: false,
  admin_default: false,
  system: false,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-15T00:00:00Z',
};

// Modal testing wrapper component
const ModalTestWrapper: React.FC<{ group: Group; onSubmit: (data: any) => void; onClose: () => void; isSubmitting?: boolean }> = ({
  group,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = () => setIsOpen(true);
  const handleCloseModal = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <>
      <Button onClick={handleOpenModal}>Open Modal</Button>
      <EditGroupModal group={group} isOpen={isOpen} onClose={handleCloseModal} onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </>
  );
};

const meta: Meta<typeof ModalTestWrapper> = {
  component: ModalTestWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    group: mockGroup,
    onClose: fn(),
    onSubmit: fn(),
    isSubmitting: false,
  },
};

export default meta;
type Story = StoryObj<typeof ModalTestWrapper>;

// Default story - standard edit group modal
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    // ✅ Canvas scoping: ONLY for elements in Storybook canvas
    const canvas = within(canvasElement);

    // ✅ Button in canvas: Use canvas scoping
    const openButton = canvas.getByRole('button', { name: 'Open Modal' });
    await userEvent.click(openButton);

    // ✅ Modal via portal: Use screen (document.body), NOT canvas
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // ✅ Modal content: Use within(modal) scoping for portal content
    expect(within(modal).getByText("Edit group's information")).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('Test Group')).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('A test group for demonstration purposes')).toBeInTheDocument();

    // ✅ Modal buttons: Use within(modal) scoping
    const closeButton = within(modal).getByRole('button', { name: /cancel/i });
    await userEvent.click(closeButton);

    // Verify onClose was called
    expect(args.onClose).toHaveBeenCalled();
  },
};

// Story with a group that has no description
export const GroupWithoutDescription: Story = {
  args: {
    group: {
      ...mockGroup,
      description: undefined,
    },
  },
  play: async ({ canvasElement }) => {
    // ✅ Canvas scoping: ONLY for elements in Storybook canvas
    const canvas = within(canvasElement);

    // ✅ Button in canvas: Use canvas scoping
    const openButton = canvas.getByRole('button', { name: 'Open Modal' });
    await userEvent.click(openButton);

    // ✅ Modal via portal: Use screen (document.body), NOT canvas
    const modal = await screen.findByRole('dialog');

    // ✅ Modal content: Use within(modal) scoping for portal content
    expect(within(modal).getByDisplayValue('Test Group')).toBeInTheDocument();
    // Description field should be empty
    const descriptionField = within(modal).getByLabelText(/description/i);
    expect(descriptionField).toHaveValue('');
  },
};

// Story testing form submission
export const FormSubmission: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open modal
    const openButton = canvas.getByRole('button', { name: 'Open Modal' });
    await userEvent.click(openButton);

    // Find and modify form fields
    const modal = await screen.findByRole('dialog');
    const nameField = within(modal).getByDisplayValue('Test Group');
    const descriptionField = within(modal).getByLabelText(/description/i);

    // Clear and enter new values
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Updated Group Name');

    await userEvent.clear(descriptionField);
    await userEvent.type(descriptionField, 'Updated description');

    // Submit form - wait for button to become enabled after validation
    const saveButton = within(modal).getByRole('button', { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    await userEvent.click(saveButton);

    // Verify onSubmit was called with correct data
    expect(args.onSubmit).toHaveBeenCalledWith({
      uuid: 'group-1',
      name: 'Updated Group Name',
      description: 'Updated description',
    });
  },
};

// Story with submitting state
export const SubmittingState: Story = {
  args: {
    isSubmitting: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open modal
    const openButton = canvas.getByRole('button', { name: 'Open Modal' });
    await userEvent.click(openButton);

    // Check modal shows submitting state
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Verify save button is disabled during submission
    const saveButton = within(modal).getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    // Verify modal content is still accessible during submission
    expect(within(modal).getByText("Edit group's information")).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('Test Group')).toBeInTheDocument();
  },
};
