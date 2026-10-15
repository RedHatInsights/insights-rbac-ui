import type { UserEvent } from '@testing-library/user-event';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { clearAndType, clickWizardNext, selectNthCheckbox, waitForModal, waitForModalClose } from '../../../../test-utils/interactionHelpers';
import { type StepFn, TEST_TIMEOUTS, noopStep } from '../../../../test-utils/testUtils';

export interface GroupFormData {
  name: string;
  description?: string;
  selectRoles?: boolean;
  selectUsers?: boolean;
  selectServiceAccounts?: boolean;
}

export interface APISpies {
  groupCreationSpy?: ReturnType<typeof fn>;
  roleAssignmentSpy?: ReturnType<typeof fn>;
  principalAssignmentSpy?: ReturnType<typeof fn>;
  serviceAccountAssignmentSpy?: ReturnType<typeof fn>;
}

/**
 * Fill out the Add Group Wizard form.
 *
 * Each wizard page becomes a Storybook `step` when a `step` function is
 * provided, making failures visible at field granularity in the
 * Interactions panel.
 */
export async function fillAddGroupWizardForm(
  data: GroupFormData,
  spies?: APISpies,
  waitForCompletion = true,
  user: UserEvent = userEvent.setup(),
  step: StepFn = noopStep,
): Promise<void> {
  const dialog = await waitForModal();

  await step('Enter group name and description', async () => {
    await clearAndType(user, () => document.getElementById('group-name') as HTMLInputElement, data.name);

    if (data.description) {
      await clearAndType(user, () => document.getElementById('group-description') as HTMLInputElement, data.description);
    }

    await waitFor(() => expect((document.getElementById('group-name') as HTMLInputElement).value).toBe(data.name));
    await clickWizardNext(user, dialog, { timeout: 15000 });
  });

  // Roles step is optional — some wizards skip it
  let hasRolesStep = false;
  await step('Select roles', async () => {
    try {
      await waitFor(
        () => {
          const content = dialog.queryAllByText(/add roles|select roles/i)[0] || dialog.queryByText(/role/i);
          expect(content).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
      hasRolesStep = true;
    } catch {
      return;
    }

    if (data.selectRoles) {
      await selectNthCheckbox(user, dialog, 0, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
    await clickWizardNext(user, dialog);
  });

  await step('Select members', async () => {
    if (!hasRolesStep) return;
    await waitFor(
      () => {
        const content = dialog.queryAllByText(/add members|add users|select users/i)[0] || dialog.queryByText(/member|user/i);
        expect(content).toBeTruthy();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    if (data.selectUsers) {
      await selectNthCheckbox(user, dialog, 0, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
    await clickWizardNext(user, dialog);
  });

  // Service accounts step is optional
  await step('Select service accounts', async () => {
    let hasStep = false;
    try {
      await waitFor(
        () => {
          const content = dialog.queryAllByText(/service account/i)[0];
          if (content) {
            hasStep = true;
            expect(content).toBeInTheDocument();
          }
        },
        { timeout: 3000 },
      );
    } catch {
      return;
    }

    if (!hasStep) return;

    if (data.selectServiceAccounts) {
      await selectNthCheckbox(user, dialog, 0, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
    await clickWizardNext(user, dialog);
  });

  await step('Review and submit', async () => {
    await waitFor(
      () => {
        expect(dialog.queryAllByText(/review/i)[0]).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await waitFor(() => {
      expect(dialog.getByText(data.name)).toBeInTheDocument();
      if (data.description) expect(dialog.getByText(data.description)).toBeInTheDocument();
    });

    const buttons = dialog.queryAllByRole('button');
    const submitBtn = buttons.find(
      (btn: HTMLElement) =>
        /create|submit|finish|add.*group/i.test(btn.textContent || '') &&
        !btn.hasAttribute('disabled') &&
        btn.getAttribute('aria-disabled') !== 'true',
    );
    expect(submitBtn).toBeTruthy();
    await user.click(submitBtn!);
  });

  if (!waitForCompletion) return;

  await step('Verify API calls', async () => {
    if (spies) {
      await waitFor(
        () => {
          expect(spies.groupCreationSpy).toHaveBeenCalledWith({
            name: data.name,
            description: data.description,
          });

          if (data.selectRoles && spies.roleAssignmentSpy) {
            expect(spies.roleAssignmentSpy).toHaveBeenCalledWith('new-group-uuid', {
              roles: ['role-1'],
            });
          }

          if (data.selectUsers && spies.principalAssignmentSpy) {
            expect(spies.principalAssignmentSpy).toHaveBeenCalledWith('new-group-uuid', {
              principals: [{ username: 'alice.johnson' }],
            });
          }
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    } else {
      await waitForModalClose({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    }
  });
}
