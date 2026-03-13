import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor, within } from 'storybook/test';
import { clearAndType, clickWizardNext, selectNthCheckbox, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { type StepFn, TEST_TIMEOUTS, noopStep } from '../../../test-utils/testUtils';

export async function fillCreateRoleWizard(
  user: UserEvent,
  roleName: string,
  roleDescription: string,
  permissions: string[] = ['insights:*:*'],
  step: StepFn = noopStep,
) {
  const modal = await waitForModal();

  await step('Select "Create from scratch" and enter role name', async () => {
    const createOption = await modal.findByRole('radio', { name: /create a role from scratch/i });
    await user.click(createOption);

    await clearAndType(user, () => modal.getByLabelText(/role name/i) as HTMLInputElement, roleName);

    await clickWizardNext(user, modal, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  });

  await step('Add permissions', async () => {
    await modal.findByRole('heading', { name: /add permissions/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    for (let i = 0; i < permissions.length; i++) {
      await selectNthCheckbox(user, modal, i, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }

    await clickWizardNext(user, modal);
  });

  await step('Review and submit', async () => {
    await modal.findByRole('heading', { name: /review details/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    if (modal.queryAllByLabelText(/description/i).length > 0) {
      await clearAndType(user, () => modal.queryAllByLabelText(/description/i)[0] as HTMLTextAreaElement, roleDescription);
    }

    const submitButton = await modal.findByRole('button', { name: /submit/i });
    await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await user.click(submitButton);
  });

  await step('Verify success and close wizard', async () => {
    // Success screen renders in a fresh dialog reference
    const body = within(document.body);
    await body.findByText(/you have successfully created a new role/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const successModal = await waitForModal();
    const exitButton = successModal.getByRole('button', { name: /exit/i });
    await user.click(exitButton);

    await waitForModalClose();
  });
}
