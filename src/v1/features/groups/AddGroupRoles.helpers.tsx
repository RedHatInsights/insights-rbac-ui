import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor } from 'storybook/test';
import { selectNthCheckbox, waitForModal } from '../../../test-utils/interactionHelpers';
import { type StepFn, TEST_TIMEOUTS, noopStep } from '../../../test-utils/testUtils';

export async function fillAddGroupRolesModal(user: UserEvent, groupName: string, roleCount: number, step: StepFn = noopStep) {
  await step('Open Add roles modal', async () => {
    const modal = await waitForModal();
    await modal.findByRole('heading', { name: new RegExp(`add roles to.*${groupName}`, 'i') });
  });

  const modal = await waitForModal();

  await step('Wait for roles table to load', async () => {
    await waitFor(
      () => {
        expect(modal.queryByRole('grid')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
  });

  await step('Select roles', async () => {
    for (let i = 0; i < roleCount; i++) {
      await selectNthCheckbox(user, modal, i, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
  });

  await step('Submit', async () => {
    const submitBtn = modal.getByRole('button', { name: /add to group/i });
    await user.click(submitBtn);
  });
}
