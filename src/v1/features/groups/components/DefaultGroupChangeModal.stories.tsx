import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { DefaultGroupChangeModal } from './DefaultGroupChangeModal';

const meta: Meta<typeof DefaultGroupChangeModal> = {
  component: DefaultGroupChangeModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A warning modal displayed when making changes to default access groups. Features:
- Warning modal with checkbox confirmation requirement
- Internationalized text content with formatted messages
- Requires user to check confirmation before proceeding
- Uses PatternFly WarningModal component
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DefaultGroupChangeModal>;

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Default Group Change Modal
        </Button>
        <DefaultGroupChangeModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            args.onClose();
          }}
          onSubmit={() => {
            setIsOpen(false);
            args.onSubmit();
          }}
        />
      </>
    );
  },
  args: {
    onClose: fn(),
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Click the trigger button to open modal
    const triggerButton = await canvas.findByRole('button', { name: /open default group change modal/i });
    await userEvent.click(triggerButton);

    // Check that warning modal is displayed (modals attach to body)
    const modal = body.getByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Check for warning title
    const warningTitle = body.getByText('Warning');
    await expect(warningTitle).toBeInTheDocument();

    // Check for confirmation checkbox
    const checkbox = body.getByRole('checkbox');
    await expect(checkbox).toBeInTheDocument();
    await expect(checkbox).not.toBeChecked();

    // Check that continue button is initially disabled
    const continueButton = body.getByRole('button', { name: 'Continue' });
    await expect(continueButton).toBeDisabled();

    // Check the confirmation checkbox
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();

    // Continue button should now be enabled
    await expect(continueButton).toBeEnabled();

    // Test continue button click
    await userEvent.click(continueButton);
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};
