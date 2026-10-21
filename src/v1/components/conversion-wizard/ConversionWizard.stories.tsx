import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { clickWizardNext, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { tenantIneligibleHandlers, tenantOptInHandlers } from '../../data/mocks/tenant.handlers';
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

/** Measures the modal box that the given element lives in. */
function modalBoxSize(element: HTMLElement) {
  const box = element.closest('.pf-v6-c-modal-box');
  expect(box).toBeInTheDocument();
  const { width, height } = (box as HTMLElement).getBoundingClientRect();
  return { width: Math.round(width), height: Math.round(height) };
}

const meta = {
  component: WizardWrapper,
  // The success screen's dashboard button navigates, so a router context is required
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: tenantOptInHandlers() },
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

      // Verify key section headings using specific role queries
      await expect(wizard.findByRole('heading', { name: 'What changes during conversion' })).resolves.toBeInTheDocument();
      await expect(wizard.findByRole('heading', { name: 'During conversion a workspace hierarchy will be created' })).resolves.toBeInTheDocument();
      await expect(wizard.findByRole('heading', { name: 'How permissions change' })).resolves.toBeInTheDocument();
      await expect(wizard.findByRole('heading', { name: 'How role bindings work' })).resolves.toBeInTheDocument();
      await expect(wizard.findByRole('heading', { name: 'Legacy remediation plans will be deleted' })).resolves.toBeInTheDocument();

      // Verify introduction text is present
      await expect(wizard.findByText(/new access management model replaces the legacy User Access feature/)).resolves.toBeInTheDocument();

      // Verify diagrams are present with correct alt text
      const diagrams = await wizard.findAllByRole('img');
      expect(diagrams).toHaveLength(3);
      expect(diagrams[0]).toHaveAttribute('alt', 'Workspace hierarchy diagram');
      expect(diagrams[1]).toHaveAttribute('alt', 'Permissions and workspace hierarchy diagram');
      expect(diagrams[2]).toHaveAttribute('alt', 'Role bindings example diagram');
    });

    await step('Verify the close button is not covered by the wizard header', async () => {
      // The header's grey bar sits in front of the modal's absolutely positioned close button
      // unless the button is lifted above it, which clips the X and swallows the click.
      // Queried from the document because the button is the modal's, outside the wizard's scope;
      // the exact name skips the step content's own alert dismiss buttons.
      const close = screen.getByRole('button', { name: 'Close' });
      const { left, top, width, height } = close.getBoundingClientRect();
      expect(close.contains(document.elementFromPoint(left + width / 2, top + height / 2))).toBe(true);
    });

    await step('Navigate to step 2: Post-conversion requirements', async () => {
      const wizard = await waitForModal();
      await clickWizardNext(user, wizard);

      // Verify main title and introduction
      await expect(wizard.findByRole('heading', { name: 'Post-conversion requirements' })).resolves.toBeInTheDocument();
      await expect(wizard.findByText(/Review your access structure within one week of conversion/i)).resolves.toBeInTheDocument();
      await expect(wizard.findByText(/Default Admin Access and Default Access are fixed by design/i)).resolves.toBeInTheDocument();

      // Verify all 5 main action items are present
      await expect(wizard.findByText(/Know what's fixed/i)).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Adjust default access roles')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Review the Ungrouped hosts workspace')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Verify critical user access')).resolves.toBeInTheDocument();
      await expect(wizard.findByText('Plan workspace structure')).resolves.toBeInTheDocument();
    });

    await step('Navigate to step 3: Pre-conversion checklist', async () => {
      const wizard = await waitForModal();
      await clickWizardNext(user, wizard);
      await expect(wizard.findByRole('heading', { name: /Pre-conversion checklist/i })).resolves.toBeInTheDocument();
      await expect(wizard.findByText(/Please complete the checklist to confirm you understand/i)).resolves.toBeInTheDocument();

      // Check all 4 checkboxes to enable the Next button
      const checkboxes = wizard.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }
    });

    await step('Navigate to step 4: Confirm conversion', async () => {
      const wizard = await waitForModal();
      await clickWizardNext(user, wizard);
      await expect(wizard.findByRole('heading', { name: /Confirm conversion/i })).resolves.toBeInTheDocument();
      await expect(wizard.findByRole('heading', { name: /Warning alert: Conversion is permanent/i })).resolves.toBeInTheDocument();
      await expect(wizard.findByText(/You are about to convert your organization/i)).resolves.toBeInTheDocument();

      // Check the confirmation checkbox to enable the Submit button
      const confirmCheckbox = wizard.getByRole('checkbox');
      await user.click(confirmCheckbox);
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

/**
 * Submitting the wizard swaps the modal's contents for a spinner and then the success screen.
 * The modal itself must stay open and keep the exact same dimensions throughout.
 */
export const SubmitShowsSuccessScreen: Story = {
  args: {
    storyArgs: {
      onCancel: fn(),
      onSuccess: fn(),
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    let wizardSize: { width: number; height: number };

    await step('Walk the wizard through to the confirm step', async () => {
      let wizard = await openWizardDialog(user, canvas);

      wizardSize = modalBoxSize(await wizard.findByRole('heading', { name: 'What changes during conversion' }));

      await clickWizardNext(user, wizard);
      wizard = await waitForModal();
      await clickWizardNext(user, wizard);

      wizard = await waitForModal();
      for (const checkbox of wizard.getAllByRole('checkbox')) {
        await user.click(checkbox);
      }
      await clickWizardNext(user, wizard);

      wizard = await waitForModal();
      await user.click(wizard.getByRole('checkbox'));
    });

    await step('Submit shows the success screen in the same modal, at the same size', async () => {
      const wizard = await waitForModal();
      await user.click(await wizard.findByRole('button', { name: /submit/i }));

      const modal = await waitForModal();
      const heading = await modal.findByRole('heading', { name: /conversion complete/i });

      expect(modal.getByText(/your organization has been successfully converted/i)).toBeInTheDocument();
      expect(modalBoxSize(heading)).toEqual(wizardSize);
    });

    await step('Dashboard button reports success', async () => {
      const modal = await waitForModal();
      await user.click(modal.getByRole('button', { name: /go to access management dashboard/i }));
      await expect(args.storyArgs.onSuccess).toHaveBeenCalled();
    });
  },
};

/**
 * The eligibility check runs before the opt-in request. When it comes back negative the
 * wizard goes straight to the failure screen and names what is blocking the conversion,
 * rather than sending a PATCH that could only be rejected with the same information.
 */
const optInSpy = fn();

export const IneligibleTenantSkipsOptIn: Story = {
  args: {
    storyArgs: {
      onCancel: fn(),
      onSuccess: fn(),
    },
  },
  parameters: {
    msw: { handlers: tenantIneligibleHandlers({}, { onOptIn: optInSpy }) },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Walk the wizard through to the confirm step', async () => {
      let wizard = await openWizardDialog(user, canvas);
      await wizard.findByRole('heading', { name: 'What changes during conversion' });

      await clickWizardNext(user, wizard);
      wizard = await waitForModal();
      await clickWizardNext(user, wizard);

      wizard = await waitForModal();
      for (const checkbox of wizard.getAllByRole('checkbox')) {
        await user.click(checkbox);
      }
      await clickWizardNext(user, wizard);

      wizard = await waitForModal();
      await user.click(wizard.getByRole('checkbox'));
    });

    await step('Submit shows the failure screen naming the blockers', async () => {
      const wizard = await waitForModal();
      await user.click(await wizard.findByRole('button', { name: /submit/i }));

      const modal = await waitForModal();
      await modal.findByRole('heading', { name: /conversion failed/i });
      expect(modal.getByText(/Legacy Auditor, Platform Admins/)).toBeInTheDocument();
    });

    await step('The opt-in request was never sent', async () => {
      expect(optInSpy).not.toHaveBeenCalled();
    });
  },
};
