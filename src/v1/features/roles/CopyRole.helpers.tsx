import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor, within } from 'storybook/test';
import { clickWizardNext, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { type StepFn, TEST_TIMEOUTS, noopStep } from '../../../test-utils/testUtils';

export async function fillCopyRoleWizard(user: UserEvent, sourceRoleName: string, step: StepFn = noopStep) {
  const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

  await step('Select source role to copy', async () => {
    const copyOption = await modalScope.findByRole('radio', { name: /copy an existing role/i });
    await user.click(copyOption);

    // Wizard renders role grid asynchronously
    await modalScope.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const sourceRoleRadio = await modalScope.findByRole('radio', { name: new RegExp(sourceRoleName, 'i') });
    await user.click(sourceRoleRadio);

    await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  });

  await step('Confirm name and description', async () => {
    // data-driven-forms renders name field asynchronously
    await modalScope.findByLabelText(/role name/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  });

  await step('Skip permissions step', async () => {
    if (modalScope.queryByRole('heading', { name: /add permissions/i })) {
      await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
  });

  await step('Handle inventory group access step', async () => {
    if (modalScope.queryByRole('heading', { name: /inventory group access/i })) {
      // Wizard combobox renders asynchronously
      const combobox = await modalScope.findByRole('combobox', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(combobox);

      const firstOption = await within(document.body).findByRole('menuitem', {}, { timeout: 3000 });
      await user.click(firstOption);

      const toggleBtn = combobox.closest('.rbac-c-resource-type-select')?.querySelector('button[aria-expanded="true"]');
      if (toggleBtn) {
        await user.click(toggleBtn as HTMLElement);
      }

      const copyToAll = modalScope.queryByText(/copy to all/i);
      if (copyToAll) {
        await user.click(copyToAll);
      }

      await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
  });

  await step('Review and submit', async () => {
    // Wizard review step content loads asynchronously
    await modalScope.findByRole('heading', { name: /review details/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const submitBtn = await modalScope.findByRole('button', { name: /submit/i });
    await waitFor(() => expect(submitBtn).toBeEnabled(), { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await user.click(submitBtn);
  });

  await step('Verify success and close wizard', async () => {
    await within(document.body).findByText(/you have successfully created a new role/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const successModal = await waitForModal();
    const exitButton = successModal.getByRole('button', { name: /exit/i });
    await user.click(exitButton);

    await waitForModalClose({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  });
}
