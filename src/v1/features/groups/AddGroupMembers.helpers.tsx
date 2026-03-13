import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor } from 'storybook/test';
import { waitForModal } from '../../../test-utils/interactionHelpers';
import { type StepFn, TEST_TIMEOUTS, noopStep } from '../../../test-utils/testUtils';

export async function fillAddGroupMembersModal(user: UserEvent, memberUsernames: string[], step: StepFn = noopStep) {
  await step('Open Add members modal', async () => {
    const modal = await waitForModal();
    await modal.findByRole('heading', { name: /add members/i });
  });

  const modal = await waitForModal();

  await step('Wait for members table to load', async () => {
    await waitFor(
      () => {
        const checkboxes = modal.queryAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(1);
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
  });

  await step('Select members', async () => {
    for (let i = 0; i < memberUsernames.length; i++) {
      const checkboxes = modal.getAllByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') });
      await user.click(checkboxes[0]);
    }
  });

  await step('Submit', async () => {
    const submitBtn = modal.getByRole('button', { name: /add to group/i });
    await user.click(submitBtn);
  });
}
