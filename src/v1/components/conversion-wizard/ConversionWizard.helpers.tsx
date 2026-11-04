/**
 * Interaction helpers for the conversion wizard's stories.
 *
 * `ConversionWizard` keeps one modal mounted for the whole flow — the form, the spinner, the
 * success screen and the failure screen all swap inside it.
 *
 * **The data-driven-forms wizard carries `role="dialog"` of its own**, nested inside the modal's.
 * `waitForModal()` returns the innermost one, so a scope taken while the form is on screen is the
 * wizard element: good for every step of the form, and detached the moment the wizard is submitted
 * and replaced. Re-resolve after submitting — `waitForConversionComplete`, `waitForConversionSpinner`
 * and `waitForConversionFailure` all do, and return the modal scope rather than the wizard's.
 *
 * Gating in this wizard is a **disabled control**, not a validation message: the data-driven-forms
 * pf4 Next/Submit button is `isDisabled: !valid || getState().validating` and every checkbox in
 * `schema.tsx` sets `validateOnMount: false`. An untouched checkbox renders no error and the button
 * cannot be clicked, so there is no blocked navigation to observe — assert control state instead.
 */
import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor } from 'storybook/test';
import { type ScopedQueries, clickWizardNext, waitForModal } from '../../../test-utils/interactionHelpers';
import { type StepFn, TEST_TIMEOUTS, noopStep } from '../../../test-utils/testUtils';
import messages from '../../../Messages';

/** The four screens of the wizard form, in the order the schema chains them. */
export type WizardStepName = 'introduction' | 'post-conversion' | 'checklist' | 'confirm';

const STEP_ORDER: WizardStepName[] = ['introduction', 'post-conversion', 'checklist', 'confirm'];

/** Heading that identifies each step. Queried by role because the wizard nav repeats the titles. */
const STEP_HEADING: Record<WizardStepName, string> = {
  introduction: messages.conversionWizardWhatChangesTitle.defaultMessage,
  'post-conversion': messages.conversionWizardPostConversionTitle.defaultMessage,
  checklist: messages.conversionWizardPreConversionChecklistTitle.defaultMessage,
  confirm: messages.conversionWizardConfirmConversionTitle.defaultMessage,
};

/** The four acknowledgements on the pre-conversion checklist step, in schema order. */
export const CHECKLIST_LABELS = [
  messages.conversionWizardChecklistReviewedConfig.defaultMessage,
  messages.conversionWizardChecklistUnderstandPermanent.defaultMessage,
  messages.conversionWizardChecklistCompletePostConversion.defaultMessage,
  messages.conversionWizardChecklistUnderstandRemediation.defaultMessage,
];

/**
 * The wizard's forward control: labelled "Next" on the first three steps and "Submit" on the last,
 * but the same button either way — the one whose disabled state does all of the gating.
 */
export function wizardNextButton(wizard: ScopedQueries): HTMLElement {
  return wizard.getByRole('button', { name: /^next$/i });
}

export function wizardSubmitButton(wizard: ScopedQueries): HTMLElement {
  return wizard.getByRole('button', { name: /^submit$/i });
}

/**
 * Wait for the forward control to settle into the given state. Re-queried on each attempt because
 * the button re-renders whenever form validity changes.
 */
export async function waitForWizardAdvanceState(wizard: ScopedQueries, state: 'enabled' | 'disabled'): Promise<void> {
  await waitFor(() => {
    const button = wizard.queryByRole('button', { name: /^(next|submit)$/i });
    expect(button).toBeInTheDocument();
    if (state === 'enabled') {
      expect(button).toBeEnabled();
    } else {
      expect(button).toBeDisabled();
    }
  });
}

export function wizardBackButton(wizard: ScopedQueries): HTMLElement {
  return wizard.getByRole('button', { name: /^back$/i });
}

export function wizardCancelButton(wizard: ScopedQueries): HTMLElement {
  return wizard.getByRole('button', { name: /^cancel$/i });
}

/** Wait for a step to be the one on screen. Returns its heading so callers can assert on it. */
export async function waitForWizardStep(wizard: ScopedQueries, step: WizardStepName): Promise<HTMLElement> {
  return wizard.findByRole('heading', { name: STEP_HEADING[step] }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
}

/** Assert a step is on screen without waiting — for use once an `await` has already settled. */
export function expectWizardStep(wizard: ScopedQueries, step: WizardStepName): void {
  expect(wizard.queryByRole('heading', { name: STEP_HEADING[step] })).toBeInTheDocument();
}

/** The checkbox for one of the four checklist acknowledgements, or the confirmation checkbox. */
export function wizardCheckbox(wizard: ScopedQueries, label: string): HTMLInputElement {
  return wizard.getByRole('checkbox', { name: label }) as HTMLInputElement;
}

/** Tick every checkbox on the current step that is not already checked. */
export async function checkAllCheckboxes(user: UserEvent, wizard: ScopedQueries): Promise<void> {
  for (const checkbox of wizard.getAllByRole('checkbox')) {
    if (!(checkbox as HTMLInputElement).checked) {
      await user.click(checkbox);
    }
  }
}

/**
 * Walk the wizard forward from the step it is currently on to `target`, ticking the pre-conversion
 * checklist on the way through when the target lies past it. The confirmation checkbox on the final
 * step is deliberately left alone, so callers can assert on the ungated state before submitting.
 */
export async function navigateToWizardStep(user: UserEvent, wizard: ScopedQueries, target: WizardStepName): Promise<void> {
  for (const step of STEP_ORDER) {
    await waitForWizardStep(wizard, step);
    if (step === target) {
      return;
    }
    if (step === 'checklist') {
      await checkAllCheckboxes(user, wizard);
    }
    await clickWizardNext(user, wizard);
  }
}

/**
 * Walk an already-open wizard to the confirmation step, tick the confirmation box and submit.
 * Everything the submission stories share, so each one only has to describe its own outcome.
 */
export async function submitConversionWizard(user: UserEvent, step: StepFn = noopStep): Promise<void> {
  await step('Walk the wizard through to the confirmation step', async () => {
    const wizard = await waitForModal();
    await navigateToWizardStep(user, wizard, 'confirm');
    await user.click(wizard.getByRole('checkbox'));
  });

  await step('Submit the conversion', async () => {
    const wizard = await waitForModal();
    await waitForWizardAdvanceState(wizard, 'enabled');
    await user.click(wizardSubmitButton(wizard));
  });
}

/**
 * Wait for the failure screen that replaces the wizard form when a conversion is rejected, and
 * return the modal's scope. The heading, body and troubleshooting link are identical for every
 * cause; only the detail sentence underneath differs, which is what the callers assert on.
 */
export async function waitForConversionFailure(): Promise<ScopedQueries> {
  const modal = await waitForModal();
  await modal.findByRole('heading', { name: messages.conversionWizardFailedTitle.defaultMessage }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  return modal;
}

/** Wait for the success screen, and return the modal's scope. */
export async function waitForConversionComplete(): Promise<ScopedQueries> {
  const modal = await waitForModal();
  await modal.findByRole('heading', { name: messages.conversionWizardCompleteTitle.defaultMessage }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  return modal;
}

/** Wait for the in-flight spinner that stands in for the form, and return the modal's scope. */
export async function waitForConversionSpinner(): Promise<ScopedQueries> {
  const modal = await waitForModal();
  await modal.findByRole('progressbar', { name: messages.conversionWizardConvertingLabel.defaultMessage }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  return modal;
}
