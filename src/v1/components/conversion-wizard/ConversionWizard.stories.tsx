import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { clickWizardNext, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { ConversionWizard } from './ConversionWizard';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

const WizardWrapper = ({ storyArgs }: { storyArgs: React.ComponentProps<typeof ConversionWizard> }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button data-testid="open-wizard-button" onClick={() => setIsOpen(true)}>
        Open Conversion Wizard
      </Button>
      {isOpen && (
        <ConversionWizard
          {...storyArgs}
          onCancel={() => {
            setIsOpen(false);
            storyArgs.onCancel?.();
          }}
          onSuccess={() => {
            setIsOpen(false);
            storyArgs.onSuccess?.();
          }}
        />
      )}
    </div>
  );
};

async function openWizardDialog(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>) {
  const openButton = await canvas.findByTestId('open-wizard-button');
  await user.click(openButton);
  return waitForModal();
}

const meta = {
  component: WizardWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    storyArgs: {
      onCancel: fn(),
      onSuccess: fn(),
    },
  },
} satisfies Meta<typeof WizardWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default ConversionWizard story showing the 4-step wizard skeleton:
 * 1. Introduction
 * 2. Post-conversion requirements
 * 3. Pre-conversion checklist
 * 4. Confirm conversion
 */
export const Default: Story = {
  tags: ['autodocs'],
  args: {
    storyArgs: {
      onCancel: fn(),
      onSuccess: fn(),
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify step 1: Introduction', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await expect(wizard.findByText('What changes during conversion')).resolves.toBeInTheDocument();
      await expect(wizard.findByText(/new access management model replaces the legacy User Access feature/)).resolves.toBeInTheDocument();

      // Verify key sections are present
      await expect(wizard.findByText('During conversion a workspace hierarchy will be created')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('How permissions change')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('How role bindings work')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Legacy remediation plans will be deleted')).resolves.toBeInTheDocument();

      // Verify workspace hierarchy terms
      await expect(wizard.findByText('Root workspace')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Default workspace')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Existing workspaces')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Ungrouped hosts workspace')).resolves.toBeInTheDocument();

      // Verify diagrams are present
      const diagrams = wizard.getAllByRole('img');
      expect(diagrams).toHaveLength(3);
      expect(diagrams[0]).toHaveAttribute('alt', 'Workspace hierarchy diagram');
      expect(diagrams[1]).toHaveAttribute('alt', 'Permissions and workspace hierarchy diagram');
      expect(diagrams[2]).toHaveAttribute('alt', 'Role bindings example diagram');
    });

    await step('Navigate to step 2: Post-conversion requirements', async () => {
      const wizard = await waitForModal();
      await clickWizardNext(user, wizard);
      await expect(wizard.findByText('Post-conversion requirements step content placeholder')).resolves.toBeInTheDocument();
    });

    await step('Navigate to step 3: Pre-conversion checklist', async () => {
      const wizard = await waitForModal();
      await clickWizardNext(user, wizard);
      await expect(wizard.findByText('Pre-conversion checklist step content placeholder')).resolves.toBeInTheDocument();
    });

    await step('Navigate to step 4: Confirm conversion', async () => {
      const wizard = await waitForModal();
      await clickWizardNext(user, wizard);
      await expect(wizard.findByText('Confirm conversion step content placeholder')).resolves.toBeInTheDocument();
    });

    await step('Cancel wizard and verify close', async () => {
      const wizard = await waitForModal();
      const cancelButton = await wizard.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify onCancel callback was called
      await expect(args.storyArgs.onCancel).toHaveBeenCalled();

      // Wait for modal to close
      await waitForModalClose();
    });
  },
};
