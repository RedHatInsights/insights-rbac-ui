import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { RoleCreationSuccess } from './RoleCreationSuccess';

const meta: Meta<typeof RoleCreationSuccess> = {
  component: RoleCreationSuccess,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A success state component displayed after successfully creating a role. Features:
- Green check icon with localized success message
- Primary action button to exit/close
- Optional secondary actions to create another role or add role to group
- Uses PatternFly EmptyState pattern for consistent UX
- Handles internationalization internally using react-intl
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RoleCreationSuccess>;

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Role Creation Success
        </Button>
        {isOpen && (
          <RoleCreationSuccess
            {...args}
            onClose={() => {
              setIsOpen(false);
              args.onClose();
            }}
            onCreateAnother={() => {
              setIsOpen(false);
              args.onCreateAnother?.();
            }}
            onAddToGroup={() => {
              setIsOpen(false);
              args.onAddToGroup?.();
            }}
          />
        )}
      </>
    );
  },
  args: {
    onClose: fn(),
    onCreateAnother: fn(),
    onAddToGroup: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click trigger button to show success state
    const triggerButton = await canvas.findByRole('button', { name: /show role creation success/i });
    await userEvent.click(triggerButton);

    // Test all three action buttons (using localized text)
    const exitButton = await canvas.findByRole('button', { name: /exit/i });
    await userEvent.click(exitButton);
    await expect(args.onClose).toHaveBeenCalled();

    // Re-trigger to test other buttons
    await userEvent.click(triggerButton);

    const createAnotherButton = await canvas.findByRole('button', { name: /create another role/i });
    await userEvent.click(createAnotherButton);
    await expect(args.onCreateAnother).toHaveBeenCalled();

    // Re-trigger to test third button
    await userEvent.click(triggerButton);

    const addToGroupButton = await canvas.findByRole('button', { name: /add role to group/i });
    await userEvent.click(addToGroupButton);
    await expect(args.onAddToGroup).toHaveBeenCalled();
  },
};
