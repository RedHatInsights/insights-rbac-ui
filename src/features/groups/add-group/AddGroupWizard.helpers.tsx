import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

// REUSABLE HELPER: Fill Add Group Wizard Form
// Exported for composition in stories (e.g., AddGroupWizard.stories.tsx, AppEntry.stories.tsx)
export interface GroupFormData {
  name: string;
  description?: string;
  selectRoles?: boolean;
  selectUsers?: boolean;
  selectServiceAccounts?: boolean;
}

// API Spy Types - Define what each spy should receive as parameters
export interface APISpies {
  groupCreationSpy?: ReturnType<typeof fn>;
  roleAssignmentSpy?: ReturnType<typeof fn>;
  principalAssignmentSpy?: ReturnType<typeof fn>;
}

/**
 * Helper function to fill out the Add Group Wizard form
 * EXPORTED for reuse/composition in E2E tests
 *
 * @param data - Form data to fill
 * @param spies - Optional API spies for validation
 * @param waitForCompletion - If false, returns immediately after clicking submit (default: true for backward compatibility)
 * @param user - Optional custom userEvent instance (e.g., with delay configured). Defaults to userEvent.
 */
export async function fillAddGroupWizardForm(
  data: GroupFormData,
  spies?: APISpies,
  waitForCompletion = true,
  user: ReturnType<typeof userEvent.setup> | typeof userEvent = userEvent,
): Promise<void> {
  // Find the wizard dialog and scope all queries to it
  const dialogElement = document.querySelector('[role="dialog"]');
  expect(dialogElement).toBeInTheDocument();
  const dialog = within(dialogElement as HTMLElement);

  // Helper to get the wizard's Next button (not pagination next) - scoped to dialog
  const getWizardNextButton = () => {
    const allNextButtons = dialog.queryAllByRole('button', { name: /next/i });
    return allNextButtons.find((btn) => {
      const isNotPagination = !btn.closest('.pf-v5-c-pagination');
      const isEnabled = !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true';
      return isNotPagination && isEnabled;
    });
  };

  // STEP 1: Fill name and description
  const nameInput = document.getElementById('group-name') as HTMLInputElement;
  expect(nameInput).toBeInTheDocument();

  await user.clear(nameInput);
  await user.type(nameInput, data.name);

  if (data.description) {
    const descriptionInput = document.getElementById('group-description');
    if (descriptionInput) {
      await user.clear(descriptionInput);
      await user.type(descriptionInput, data.description);
    }
  }

  // Wait for form validation to complete
  await waitFor(() => {
    expect(nameInput.value).toBe(data.name);
  });

  // Navigate to next step - wait for button to be enabled
  const nextButton1 = await waitFor(
    () => {
      const button = getWizardNextButton();
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      return button!;
    },
    { timeout: 15000 },
  ); // Extended timeout for async validation

  await user.click(nextButton1);

  // STEP 2: Handle Roles step (if not in workspaces mode)
  let currentStepHasRoles = false;
  try {
    await waitFor(
      () => {
        const rolesContent = dialog.queryAllByText(/add roles|select roles/i)[0] || dialog.queryByText(/role/i);
        if (rolesContent) {
          currentStepHasRoles = true;
          expect(rolesContent).toBeInTheDocument();
        }
      },
      { timeout: 3000 },
    );
  } catch {
    // No roles step - probably workspaces mode
  }

  if (currentStepHasRoles && data.selectRoles) {
    // Wait for roles to load and click the first role checkbox
    await waitFor(
      () => {
        const roleCheckboxes = dialog.queryAllByRole('checkbox');
        expect(roleCheckboxes.length).toBeGreaterThan(1);
      },
      { timeout: 8000 },
    );

    // Get fresh reference and click
    const roleCheckboxes = dialog.getAllByRole('checkbox');
    await user.click(roleCheckboxes[1]); // Select first role

    // Wait for checkbox to actually be checked (re-query to avoid stale references)
    await waitFor(
      () => {
        const updatedCheckboxes = dialog.getAllByRole('checkbox');
        expect(updatedCheckboxes[1]).toBeChecked();
      },
      { timeout: 2000 },
    );

    // Navigate to next step
    const nextButton2 = await waitFor(
      () => {
        const button = getWizardNextButton();
        expect(button).toBeInTheDocument();
        return button!;
      },
      { timeout: 5000 },
    );

    await user.click(nextButton2);
  } else if (currentStepHasRoles) {
    // Skip roles selection but still navigate
    const nextButton2 = await waitFor(
      () => {
        const button = getWizardNextButton();
        expect(button).toBeInTheDocument();
        return button!;
      },
      { timeout: 5000 },
    );

    await user.click(nextButton2);
  }

  // STEP 3: Handle Members/Users step
  await waitFor(
    () => {
      const membersContent = dialog.queryAllByText(/add members|add users|select users/i)[0] || dialog.queryByText(/member|user/i);
      expect(membersContent).toBeTruthy();
    },
    { timeout: 5000 },
  );

  if (data.selectUsers) {
    // Wait for users to load
    await waitFor(
      () => {
        const userCheckboxes = dialog.queryAllByRole('checkbox');
        expect(userCheckboxes.length).toBeGreaterThan(1);
      },
      { timeout: 8000 },
    );

    // Get fresh reference and click
    const userCheckboxes = dialog.getAllByRole('checkbox');
    await user.click(userCheckboxes[1]); // Select first user

    // Wait for checkbox to actually be checked (re-query to avoid stale references)
    await waitFor(
      () => {
        const updatedCheckboxes = dialog.getAllByRole('checkbox');
        expect(updatedCheckboxes[1]).toBeChecked();
      },
      { timeout: 2000 },
    );
  }

  // Try to navigate to next step (could be service accounts or review)
  const nextButton3 = await waitFor(
    () => {
      const button = getWizardNextButton();
      expect(button).toBeInTheDocument();
      return button!;
    },
    { timeout: 5000 },
  );

  await user.click(nextButton3);

  // STEP 4: Handle Service Accounts step (optional)
  let hasServiceAccountsStep = false;
  try {
    await waitFor(
      () => {
        const serviceAccountsContent = dialog.queryAllByText(/service account/i)[0];
        if (serviceAccountsContent) {
          hasServiceAccountsStep = true;
          expect(serviceAccountsContent).toBeInTheDocument();
        }
      },
      { timeout: 3000 },
    );
  } catch {
    // No service accounts step - go to review
  }

  if (hasServiceAccountsStep) {
    if (data.selectServiceAccounts) {
      // Wait for service accounts to load
      await waitFor(
        () => {
          const saCheckboxes = dialog.queryAllByRole('checkbox');
          expect(saCheckboxes.length).toBeGreaterThan(1);
        },
        { timeout: 8000 },
      );

      // Get fresh reference and click
      const saCheckboxes = dialog.getAllByRole('checkbox');
      await user.click(saCheckboxes[1]); // Select first service account

      // Wait for checkbox to actually be checked (re-query to avoid stale references)
      await waitFor(
        () => {
          const updatedCheckboxes = dialog.getAllByRole('checkbox');
          expect(updatedCheckboxes[1]).toBeChecked();
        },
        { timeout: 2000 },
      );
    }

    // Navigate to review step
    const nextButton4 = await waitFor(
      () => {
        const button = getWizardNextButton();
        expect(button).toBeInTheDocument();
        return button!;
      },
      { timeout: 5000 },
    );

    await user.click(nextButton4);
  }

  // FINAL STEP: Verify we reached Review step
  await waitFor(
    () => {
      const reviewHeading = dialog.queryAllByText(/review/i)[0];
      expect(reviewHeading).toBeInTheDocument();
    },
    { timeout: 8000 },
  );

  // Verify the review shows the data we entered
  await waitFor(
    () => {
      // Group name should be visible in review
      expect(dialog.getByText(data.name)).toBeInTheDocument();

      // Description should be visible if provided
      if (data.description) {
        expect(dialog.getByText(data.description)).toBeInTheDocument();
      }

      // Verify specific items that were selected (not just section headers)
      if (data.selectRoles) {
        // We selected roleCheckboxes[1] which is "Console Administrator"
        expect(dialog.getByText('Console Administrator')).toBeInTheDocument();
      }

      if (data.selectUsers) {
        // We selected userCheckboxes[1] which is "alice.johnson"
        expect(dialog.getByText('alice.johnson')).toBeInTheDocument();
      }

      if (data.selectServiceAccounts) {
        // We selected saCheckboxes[1] which is "ci-pipeline-prod"
        expect(dialog.getByText('ci-pipeline-prod')).toBeInTheDocument();
      }
    },
    { timeout: 5000 },
  );

  // Click the Create/Submit button
  const createButton = await waitFor(
    () => {
      const buttons = dialog.queryAllByRole('button');
      const submitBtn = buttons.find(
        (btn) =>
          /create|submit|finish|add.*group/i.test(btn.textContent || '') &&
          !btn.hasAttribute('disabled') &&
          btn.getAttribute('aria-disabled') !== 'true',
      );
      expect(submitBtn).toBeTruthy();
      return submitBtn!;
    },
    { timeout: 5000 },
  );

  await user.click(createButton);

  // If waitForCompletion is false, return immediately after submission
  if (!waitForCompletion) {
    return;
  }

  // VALIDATION: Use spies if provided, otherwise use UI indicators
  if (spies) {
    await waitFor(
      () => {
        // Verify that the group creation API was called with EXACT data from HAR file
        expect(spies.groupCreationSpy).toHaveBeenCalledWith({
          name: data.name,
          description: data.description,
          user_list: [{ username: 'alice.johnson' }],
          roles_list: ['role-1'],
        });

        // If roles were selected, verify role assignment API was called with EXACT data from HAR file
        if (data.selectRoles && spies.roleAssignmentSpy) {
          expect(spies.roleAssignmentSpy).toHaveBeenCalledWith('new-group-uuid', {
            roles: ['role-1'],
          });
        }

        // If users were selected, verify principal assignment API was called with correct format
        if (data.selectUsers && spies.principalAssignmentSpy) {
          expect(spies.principalAssignmentSpy).toHaveBeenCalledWith('new-group-uuid', {
            principals: [{ username: 'alice.johnson' }], // No clientId or type for users
          });
        }

        return true;
      },
      { timeout: 10000 },
    );
  } else {
    // Fallback to UI success indicators when no spies provided
    await waitFor(
      () => {
        const successNotification =
          document.querySelector('.pf-v5-c-alert--success') ||
          document.querySelector('.notifications-portal') ||
          dialog.queryByText(/success/i) ||
          dialog.queryByText(/created successfully/i) ||
          dialog.queryByText(/group.*created/i);

        const backToGroupsList = dialog.queryByText('Groups') && !document.querySelector('[data-ouia-component-id="add-group-wizard"]');

        const wizardClosed = !document.querySelector('[data-ouia-component-id="add-group-wizard"]');

        const hasSuccessIndicator = successNotification || backToGroupsList || wizardClosed;

        if (hasSuccessIndicator) {
          expect(hasSuccessIndicator).toBeTruthy();
          return true;
        }

        throw new Error('Waiting for form submission to complete...');
      },
      { timeout: 10000 },
    );
  }
}
