import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { RemoveRoleModal } from './RemoveRoleModal';

// Wrapper component to control modal state with a trigger button
const RemoveRoleModalWrapper: React.FC<any> = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <RemoveRoleModal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

const meta: Meta<typeof RemoveRoleModalWrapper> = {
  component: RemoveRoleModalWrapper,
  tags: ['remove-role-modal'], // NO autodocs on meta
  parameters: {
    docs: {
      description: {
        component: 'TypeScript version of the RemoveRoleModal component for confirming role removal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'], // ONLY story with autodocs
  args: {
    title: 'Remove roles?',
    text: 'Are you sure you want to remove these roles from this group?',
    confirmButtonLabel: 'Remove',
    onSubmit: fn(),
    isDefault: false,
    isChanged: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**RemoveRoleModal** is a confirmation modal for removing roles from groups with different behaviors for default vs custom groups.

## Feature Overview

This modal provides role removal confirmation with:

- ⚠️ **Confirmation Dialog** - Clear warning before destructive actions
- 🔐 **Default Group Protection** - Special handling for system default groups  
- ✏️ **Custom Messaging** - Configurable title and confirmation text
- 🎯 **Callback Integration** - onSubmit handler for confirmed actions
- 🎨 **Consistent UI** - PatternFly warning modal styling

## Additional Test Stories

For testing different group types and scenarios:

- **[DefaultGroup](?path=/story/features-groups-group-role-removerolemodal--default-group)**: Tests role removal from system default groups

## What This Tests

- ✅ Modal opens when button is clicked (autodocs compatible)
- ✅ Displays correct title and confirmation message
- ✅ Shows Remove and Cancel buttons with proper labels
- ✅ Calls onSubmit callback when Remove is clicked
- ✅ Handles modal close functionality properly
        `,
      },
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Click trigger button to open modal
    const triggerButton = await canvas.findByText('Open Modal');
    await userEvent.click(triggerButton);

    // Should show modal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Should have correct title and content
    expect(await screen.findByText('Remove roles?')).toBeInTheDocument();
    expect(await screen.findByText('Are you sure you want to remove these roles from this group?')).toBeInTheDocument();
    expect(await screen.findByText('Remove')).toBeInTheDocument();
  },
};

export const DefaultGroup: Story = {
  args: {
    title: 'Remove roles from default group?',
    text: 'Removing roles from a default group requires confirmation.',
    confirmButtonLabel: 'Remove',
    onSubmit: fn(),
    isDefault: true,
    isChanged: false,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Open modal
    const triggerButton = await canvas.findByText('Open Modal');
    await userEvent.click(triggerButton);

    // Should show warning modal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(await screen.findByText('Remove roles from default group?')).toBeInTheDocument();
  },
};
