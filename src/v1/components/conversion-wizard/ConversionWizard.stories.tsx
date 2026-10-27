import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { clickWizardNext, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import {
  CHECKLIST_LABELS,
  checkAllCheckboxes,
  expectWizardStep,
  navigateToWizardStep,
  submitConversionWizard,
  waitForConversionComplete,
  waitForConversionFailure,
  waitForConversionSpinner,
  waitForWizardAdvanceState,
  waitForWizardStep,
  wizardBackButton,
  wizardCancelButton,
  wizardCheckbox,
  wizardNextButton,
  wizardSubmitButton,
} from './ConversionWizard.helpers';
import {
  tenantEligibilityErrorHandlers,
  tenantIneligibleHandlers,
  tenantOptInErrorHandlers,
  tenantOptInHandlers,
  tenantOptInIneligibleRejectionHandlers,
} from '../../data/mocks/tenant.handlers';
import { ConversionWizard } from './ConversionWizard';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import messages from '../../../Messages';

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

/**
 * Placeholder documentation target. Three links in this feature point at the same
 * access-restricted PDF, and all of them are waiting on UX to supply the real destinations —
 * the expected hrefs here change when they do.
 */
const WORKSPACES_GUIDE_PDF =
  'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf';

/** Every external anchor on the Introduction step, with the destination it is expected to carry. */
const STEP_ONE_LINKS = [
  { name: 'RBAC API', href: 'https://developers.redhat.com/api-catalog/api/rbac' },
  { name: messages.conversionWizardApiIntegrationKbLinkText.defaultMessage, href: 'https://access.redhat.com/articles/7147677' },
  { name: messages.conversionWizardGetStartedLink.defaultMessage, href: `${WORKSPACES_GUIDE_PDF}#page=1` },
  { name: messages.conversionWizardRoleBindingsLinkText.defaultMessage, href: `${WORKSPACES_GUIDE_PDF}#page=21` },
];

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
      await checkAllCheckboxes(user, wizard);
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
      await user.click(wizardCancelButton(wizard));

      // Verify onCancel callback was called
      await expect(args.storyArgs.onCancel).toHaveBeenCalled();

      // Wait for modal to close
      await waitForModalClose();
    });
  },
};

// ---------------------------------------------------------------------------
// Navigation & validation — RHCLOUD-52132
// ---------------------------------------------------------------------------

/**
 * B2 — the two Introduction alerts dismiss independently.
 *
 * Both are advisory rather than blocking, so a user who has read one must be able to clear it
 * without losing the other or the step content underneath.
 */
export const DismissStepOneAlerts: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const productAlert = messages.conversionWizardProductAvailabilityAlertTitle.defaultMessage;
    const apiAlert = messages.conversionWizardApiIntegrationAlertTitle.defaultMessage;

    await step('Both alerts render on the Introduction step', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await waitForWizardStep(wizard, 'introduction');

      expect(wizard.getByRole('heading', { name: new RegExp(`alert: ${productAlert}`, 'i') })).toBeInTheDocument();
      expect(wizard.getByRole('heading', { name: new RegExp(`alert: ${apiAlert}`, 'i') })).toBeInTheDocument();
    });

    await step('Dismissing the product-availability warning leaves the info alert alone', async () => {
      const wizard = await waitForModal();
      // The close button's accessible name embeds its own alert's title, which is what keeps
      // this from dismissing whichever alert happens to render first.
      await user.click(wizard.getByRole('button', { name: new RegExp(`close .*${productAlert}`, 'i') }));

      await waitFor(() => {
        expect(wizard.queryByRole('heading', { name: new RegExp(`alert: ${productAlert}`, 'i') })).not.toBeInTheDocument();
      });
      expect(wizard.queryByRole('heading', { name: new RegExp(`alert: ${apiAlert}`, 'i') })).toBeInTheDocument();
      expectWizardStep(wizard, 'introduction');
    });

    await step('Dismissing the API-integration info alert leaves the step content intact', async () => {
      const wizard = await waitForModal();
      await user.click(wizard.getByRole('button', { name: new RegExp(`close .*${apiAlert}`, 'i') }));

      await waitFor(() => {
        expect(wizard.queryByRole('heading', { name: new RegExp(`alert: ${apiAlert}`, 'i') })).not.toBeInTheDocument();
      });
      expectWizardStep(wizard, 'introduction');
      expect(wizard.getAllByRole('img')).toHaveLength(3);
      expect(wizardNextButton(wizard)).toBeEnabled();
    });
  },
};

/**
 * B3 — the Introduction step's four external links.
 *
 * Two of the four point at an access-restricted placeholder PDF that UX has yet to replace
 * (see the note on `WORKSPACES_GUIDE_PDF`); the expected hrefs change when the real ones land.
 */
export const StepOneExternalLinks: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Every external anchor carries the expected destination and link-safety attributes', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await waitForWizardStep(wizard, 'introduction');

      // Pinned so a link added without a destination, target or rel cannot slip in unnoticed.
      expect(wizard.getAllByRole('link')).toHaveLength(STEP_ONE_LINKS.length);

      for (const { name, href } of STEP_ONE_LINKS) {
        const link = wizard.getByRole('link', { name });
        expect(link).toHaveAttribute('href', href);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });
  },
};

/**
 * B6 — the checklist step cannot be left until all four boxes are checked.
 *
 * Verified by control state: the Next button is disabled, so there is no click to make and no
 * blocked navigation to observe.
 */
export const ChecklistGatesNavigation: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Next is disabled with nothing checked', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'checklist');

      expect(wizard.getAllByRole('checkbox')).toHaveLength(CHECKLIST_LABELS.length);
      for (const label of CHECKLIST_LABELS) {
        expect(wizardCheckbox(wizard, label)).not.toBeChecked();
      }
      expect(wizardNextButton(wizard)).toBeDisabled();
      expectWizardStep(wizard, 'checklist');
    });

    await step('Checking all four enables Next and advances to the confirmation step', async () => {
      const wizard = await waitForModal();
      await checkAllCheckboxes(user, wizard);

      await waitForWizardAdvanceState(wizard, 'enabled');
      await clickWizardNext(user, wizard);
      await waitForWizardStep(wizard, 'confirm');
    });
  },
};

/**
 * B7 — three of four is not enough. All four acknowledgements are required, not a majority.
 *
 * No error renders against the outstanding checkbox: it has never been touched, and every
 * checkbox in the schema sets `validateOnMount: false`.
 */
export const PartialChecklistStillBlocks: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Three of the four checklist boxes leaves Next disabled', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'checklist');

      for (const label of CHECKLIST_LABELS.slice(0, 3)) {
        await user.click(wizardCheckbox(wizard, label));
        expect(wizardCheckbox(wizard, label)).toBeChecked();
      }

      expect(wizardCheckbox(wizard, CHECKLIST_LABELS[3])).not.toBeChecked();
      await waitForWizardAdvanceState(wizard, 'disabled');
      expectWizardStep(wizard, 'checklist');
    });
  },
};

/**
 * B8 — checklist state survives Next → Back.
 *
 * A user who steps back to re-read the confirmation summary must not have to re-acknowledge
 * everything on the way forward again.
 */
export const ChecklistStatePersistsAcrossBack: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Check all four and advance to the confirmation step', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'confirm');
    });

    await step('Back returns to the checklist with all four still checked', async () => {
      const wizard = await waitForModal();
      await user.click(wizardBackButton(wizard));

      await waitForWizardStep(wizard, 'checklist');
      for (const label of CHECKLIST_LABELS) {
        expect(wizardCheckbox(wizard, label)).toBeChecked();
      }
      expect(wizardNextButton(wizard)).toBeEnabled();
    });
  },
};

/**
 * B9 — unchecking a checklist item puts the gate back up.
 *
 * This is the one checklist case where a validation message is also plausible, because the field
 * has been interacted with and is therefore touched. The control state is the assertion that
 * matters; the message is recorded alongside it rather than relied on.
 */
export const UncheckingChecklistItemReblocks: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Check all four so Next becomes available', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'checklist');
      await checkAllCheckboxes(user, wizard);

      await waitForWizardAdvanceState(wizard, 'enabled');
    });

    await step('Unchecking one returns Next to disabled', async () => {
      const wizard = await waitForModal();
      await user.click(wizardCheckbox(wizard, CHECKLIST_LABELS[1]));

      expect(wizardCheckbox(wizard, CHECKLIST_LABELS[1])).not.toBeChecked();
      await waitForWizardAdvanceState(wizard, 'disabled');
      expectWizardStep(wizard, 'checklist');

      // Secondary: the field is touched now, so the required-checkbox validator's message is
      // allowed to surface. Recorded rather than required — the disabled control is the gate.
      expect(wizard.queryAllByText(messages.conversionWizardCheckboxValidationError.defaultMessage).length).toBeLessThanOrEqual(1);
    });
  },
};

const confirmGateOptInSpy = fn();

/**
 * B11 — the confirmation checkbox is the last guard before an irreversible action.
 *
 * Asserted explicitly rather than inferred from the happy path, and asserted by control state:
 * the disabled button cannot be clicked, so there is no rejected submission to observe.
 */
export const ConfirmCheckboxGatesSubmit: Story = {
  parameters: {
    msw: { handlers: tenantOptInHandlers({ onOptIn: confirmGateOptInSpy }) },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Submit is disabled while the confirmation box is unchecked', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'confirm');

      expect(wizard.getByRole('checkbox')).not.toBeChecked();
      expect(wizardSubmitButton(wizard)).toBeDisabled();
      expect(confirmGateOptInSpy).not.toHaveBeenCalled();
      expect(args.storyArgs.onSuccess).not.toHaveBeenCalled();
    });

    await step('Checking it enables Submit', async () => {
      const wizard = await waitForModal();
      await user.click(wizard.getByRole('checkbox'));

      await waitForWizardAdvanceState(wizard, 'enabled');
      await user.click(wizardSubmitButton(wizard));
    });

    await step('The conversion goes through', async () => {
      await waitForConversionComplete();
      expect(confirmGateOptInSpy).toHaveBeenCalledTimes(1);
    });
  },
};

const exitPathsOptInSpy = fn();
const exitPathsEligibilitySpy = fn();

/**
 * B12 — every way out of the wizard is a clean exit.
 *
 * Escape, the modal's close button, Cancel from step 1, and Cancel from a fully confirmed step 4.
 * The last phase is the one the case exists for: one click away from an irreversible action, the
 * exit must still perform no conversion at all.
 */
export const AllExitPathsCloseWithoutSubmitting: Story = {
  parameters: {
    msw: { handlers: tenantOptInHandlers({ onOptIn: exitPathsOptInSpy, onEligibility: exitPathsEligibilitySpy }) },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Escape closes the wizard', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await waitForWizardStep(wizard, 'introduction');

      await user.keyboard('{Escape}');
      await waitForModalClose();
      expect(args.storyArgs.onCancel).toHaveBeenCalledTimes(1);
    });

    await step('The modal close button closes the wizard', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await waitForWizardStep(wizard, 'introduction');

      // The modal owns this button, so it sits outside the wizard's own scope. The exact name
      // skips the Introduction step's two alert dismiss buttons.
      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitForModalClose();
      expect(args.storyArgs.onCancel).toHaveBeenCalledTimes(2);
    });

    await step('Cancel from step 1 closes the wizard', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await waitForWizardStep(wizard, 'introduction');

      await user.click(wizardCancelButton(wizard));
      await waitForModalClose();
      expect(args.storyArgs.onCancel).toHaveBeenCalledTimes(3);
    });

    await step('Cancel from a fully confirmed step 4 closes without converting', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'confirm');
      await user.click(wizard.getByRole('checkbox'));
      await waitForWizardAdvanceState(wizard, 'enabled');

      await user.click(wizardCancelButton(wizard));
      await waitForModalClose();
      expect(args.storyArgs.onCancel).toHaveBeenCalledTimes(4);
    });

    await step('No conversion was performed by any exit path', async () => {
      expect(exitPathsEligibilitySpy).not.toHaveBeenCalled();
      expect(exitPathsOptInSpy).not.toHaveBeenCalled();
      expect(args.storyArgs.onSuccess).not.toHaveBeenCalled();
    });
  },
};

/**
 * B14 — reopening the wizard starts from scratch.
 *
 * Stale acknowledgements must not carry over into a new attempt; a user has to re-read and
 * re-confirm the checklist every time.
 */
export const ReopeningResetsState: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Advance to the checklist, check all four, then cancel', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'checklist');
      await checkAllCheckboxes(user, wizard);
      await waitForWizardAdvanceState(wizard, 'enabled');

      await user.click(wizardCancelButton(wizard));
      await waitForModalClose();
    });

    await step('Reopening lands on step 1 with the checklist cleared', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await waitForWizardStep(wizard, 'introduction');

      await navigateToWizardStep(user, wizard, 'checklist');
      for (const label of CHECKLIST_LABELS) {
        expect(wizardCheckbox(wizard, label)).not.toBeChecked();
      }
      expect(wizardNextButton(wizard)).toBeDisabled();
    });
  },
};

// ---------------------------------------------------------------------------
// Submission & failure detail — RHCLOUD-52133
// ---------------------------------------------------------------------------

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
      const wizard = await openWizardDialog(user, canvas);

      wizardSize = modalBoxSize(await waitForWizardStep(wizard, 'introduction'));

      await navigateToWizardStep(user, wizard, 'confirm');
      await user.click(wizard.getByRole('checkbox'));
    });

    await step('Submit shows the success screen in the same modal, at the same size', async () => {
      const wizard = await waitForModal();
      await user.click(wizardSubmitButton(wizard));

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

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step('The failure screen names the blockers', async () => {
      const modal = await waitForConversionFailure();
      expect(modal.getByText(/Legacy Auditor, Platform Admins/)).toBeInTheDocument();
    });

    await step('The opt-in request was never sent', async () => {
      expect(optInSpy).not.toHaveBeenCalled();
    });
  },
};

const emptyBlockersOptInSpy = fn();

/**
 * C1 — an ineligible tenant with nothing to name falls back to the generic sentence.
 *
 * The named-blockers message is a sentence with a trailing list, so skipping the empty-list
 * branch leaves "Resolve the following first:" dangling with nothing after it.
 */
export const IneligibleWithNoNamedBlockers: Story = {
  parameters: {
    msw: {
      handlers: tenantIneligibleHandlers({ ineligible_custom_roles: [], ineligible_groups: [] }, { onOptIn: emptyBlockersOptInSpy }),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step('The generic ineligibility sentence is shown, with no empty blocker list', async () => {
      const modal = await waitForConversionFailure();

      expect(modal.getByText(messages.conversionWizardFailedDetailIneligible.defaultMessage)).toBeInTheDocument();
      expect(modal.queryByText(/Resolve the following first/i)).not.toBeInTheDocument();
      expect(emptyBlockersOptInSpy).not.toHaveBeenCalled();
    });
  },
};

const eligibilityFailureOptInSpy = fn();

/**
 * C2 — the eligibility check itself fails.
 *
 * Nothing is known about the tenant at that point, so a failure to determine eligibility must
 * never be treated as eligible: the wizard fails the conversion and sends no PATCH.
 */
export const EligibilityCheckFailure: Story = {
  parameters: {
    msw: { handlers: tenantEligibilityErrorHandlers(500, { onOptIn: eligibilityFailureOptInSpy }) },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step('The failure screen shows the generic detail and no opt-in was attempted', async () => {
      const modal = await waitForConversionFailure();

      expect(modal.getByText(messages.conversionWizardFailedDetailGeneric.defaultMessage)).toBeInTheDocument();
      expect(eligibilityFailureOptInSpy).not.toHaveBeenCalled();
    });
  },
};

const rejectedIneligibleOptInSpy = fn();
const rejectedIneligibleEligibilitySpy = fn();

/**
 * C3 — the opt-in call is rejected with 422 carrying the ineligibility report.
 *
 * A tenant that became ineligible between the two calls reaches the same screen as
 * {@link IneligibleTenantSkipsOptIn} by an entirely different route: `failureDetail` has to
 * recognise the 422 body as the report rather than parsing it as an ordinary error envelope.
 */
export const OptInRejectedAsIneligible: Story = {
  parameters: {
    msw: {
      handlers: tenantOptInIneligibleRejectionHandlers({}, { onOptIn: rejectedIneligibleOptInSpy, onEligibility: rejectedIneligibleEligibilitySpy }),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step('The failure screen names the blocking roles and groups', async () => {
      const modal = await waitForConversionFailure();

      expect(modal.getByText(/Resolve the following first: Legacy Auditor, Platform Admins/)).toBeInTheDocument();
    });

    await step('The report came back from the opt-in call, not the eligibility check', async () => {
      expect(rejectedIneligibleEligibilitySpy).toHaveBeenCalledTimes(1);
      expect(rejectedIneligibleOptInSpy).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * C4 — a 403 with no envelope detail falls to the org-admin message.
 *
 * Covers an admin whose rights are revoked between opening the wizard and submitting it.
 */
export const ForbiddenWithoutDetail: Story = {
  parameters: {
    msw: { handlers: tenantOptInErrorHandlers(403, { detail: null }) },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step('The detail sentence asks for Organization Administrator rights', async () => {
      const modal = await waitForConversionFailure();

      expect(modal.getByText(messages.conversionWizardFailedDetailForbidden.defaultMessage)).toBeInTheDocument();
      expect(modal.queryByText(messages.conversionWizardFailedDetailGeneric.defaultMessage)).not.toBeInTheDocument();
    });
  },
};

/** Written for one specific failure, so it has to outrank anything generic the UI could say. */
const SERVER_SUPPLIED_DETAIL = 'Conversion is disabled for this organization while a support case is open.';

/**
 * C5 — a server-supplied detail outranks the org-admin message on the same 403.
 *
 * This is the most failure-prone ordering in `failureDetail` and the only case pinning it. A
 * regression is silent, because both branches render a plausible-looking error screen — which is
 * why the status and the envelope have to be asserted together rather than just "an error showed".
 */
export const ServerDetailOutranksForbiddenMessage: Story = {
  parameters: {
    msw: { handlers: tenantOptInErrorHandlers(403, { detail: SERVER_SUPPLIED_DETAIL }) },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step("The server's own sentence is shown verbatim, in place of the org-admin message", async () => {
      const modal = await waitForConversionFailure();

      expect(modal.getByText(SERVER_SUPPLIED_DETAIL)).toBeInTheDocument();
      expect(modal.queryByText(messages.conversionWizardFailedDetailForbidden.defaultMessage)).not.toBeInTheDocument();
      expect(modal.queryByText(messages.conversionWizardFailedDetailGeneric.defaultMessage)).not.toBeInTheDocument();
    });
  },
};

/**
 * C6 — anything else, including a 500 with no envelope detail, falls back to the generic message
 * and still offers the troubleshooting link.
 */
export const ServerErrorFallsBackToGenericDetail: Story = {
  parameters: {
    msw: { handlers: tenantOptInErrorHandlers(500, { detail: null }) },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open the wizard', async () => {
      await openWizardDialog(user, canvas);
    });

    await submitConversionWizard(user, step);

    await step('The generic detail is shown and the troubleshooting link is available', async () => {
      const modal = await waitForConversionFailure();

      expect(modal.getByText(messages.conversionWizardFailedDetailGeneric.defaultMessage)).toBeInTheDocument();
      expect(modal.queryByText(messages.conversionWizardFailedDetailForbidden.defaultMessage)).not.toBeInTheDocument();

      const troubleshooting = modal.getByRole('link', { name: messages.conversionWizardFailedButton.defaultMessage });
      expect(troubleshooting).toHaveAttribute('href', `${WORKSPACES_GUIDE_PDF}#page=1`);
      expect(troubleshooting).toHaveAttribute('target', '_blank');
      expect(troubleshooting).toHaveAttribute('rel', 'noopener noreferrer');
    });
  },
};

const doubleSubmitOptInSpy = fn();
const doubleSubmitEligibilitySpy = fn();

/**
 * C7 — double-clicking submit still converts exactly once.
 *
 * The conversion is irreversible and account-wide, so a duplicate submission has to be impossible
 * from the UI regardless of what the endpoint tolerates.
 */
export const DoubleSubmitSendsOneRequest: Story = {
  parameters: {
    msw: {
      handlers: tenantOptInHandlers({ networkDelay: 800, onOptIn: doubleSubmitOptInSpy, onEligibility: doubleSubmitEligibilitySpy }),
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Walk the wizard through to the confirmation step', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'confirm');
      await user.click(wizard.getByRole('checkbox'));
    });

    await step('Click submit twice in rapid succession', async () => {
      const wizard = await waitForModal();
      await waitForWizardAdvanceState(wizard, 'enabled');
      await user.dblClick(wizardSubmitButton(wizard));
    });

    await step('Exactly one eligibility check and one opt-in left the browser', async () => {
      await waitForConversionComplete();

      expect(doubleSubmitEligibilitySpy).toHaveBeenCalledTimes(1);
      expect(doubleSubmitOptInSpy).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * C8 — a slow conversion shows the spinner and takes the form away with it.
 *
 * The wizard form is replaced rather than merely disabled, so while the request is in flight
 * there is no control left on screen that could submit a second one.
 */
export const SlowSubmitShowsSpinner: Story = {
  parameters: {
    msw: { handlers: tenantOptInHandlers({ networkDelay: 2000 }) },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Walk the wizard through to the confirmation step', async () => {
      const wizard = await openWizardDialog(user, canvas);
      await navigateToWizardStep(user, wizard, 'confirm');
      await user.click(wizard.getByRole('checkbox'));
    });

    await step('Submit the conversion', async () => {
      const wizard = await waitForModal();
      await user.click(wizardSubmitButton(wizard));
    });

    await step('While the request is in flight the spinner replaces the form', async () => {
      const modal = await waitForConversionSpinner();
      expect(modal.getByText(messages.conversionWizardConvertingMessage.defaultMessage)).toBeInTheDocument();

      // Nothing is left anywhere in the modal that could start a second conversion.
      expect(modal.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument();
      expect(modal.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
      expect(modal.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    await step('The success screen replaces the spinner once the request lands', async () => {
      await waitForConversionComplete();
    });
  },
};
