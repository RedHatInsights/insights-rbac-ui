import { expect, waitFor, within } from 'storybook/test';
import type { ScopedQueries } from './interactionHelpers';
import { TEST_TIMEOUTS, type UserEvent } from './testUtils';

/**
 * Find the sort button inside a column header.
 *
 * PatternFly renders sort buttons inside `<th role="columnheader">`.
 * Using `columnheader` first avoids ambiguity with filter buttons that
 * share the same visible label.
 *
 * Callers must ensure the table has finished loading before calling —
 * skeleton headers don't contain sort buttons.
 */
export async function findSortButton(scope: ScopedQueries, columnName: string | RegExp): Promise<HTMLElement> {
  const header = await scope.findByRole('columnheader', { name: columnName });
  return within(header).findByRole('button');
}

/**
 * Expands a workspace row in the hierarchical table if it's collapsed.
 *
 * Uses async findByText to wait for the row to appear (critical after mutations)
 * and waitFor to ensure the toggle button is present before interacting.
 */
export async function expandWorkspaceRow(user: UserEvent, canvas: ScopedQueries, workspaceName: string) {
  const workspaceText = await canvas.findByText(workspaceName, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  const workspaceRow = workspaceText.closest('tr') as HTMLElement;
  expect(workspaceRow).toBeInTheDocument();

  await waitFor(() => expect(workspaceRow.querySelector('.pf-v6-c-table__toggle button')).toBeInTheDocument(), {
    timeout: TEST_TIMEOUTS.ELEMENT_WAIT,
  });
  const toggleButton = workspaceRow.querySelector('.pf-v6-c-table__toggle button') as HTMLButtonElement;

  if (toggleButton.getAttribute('aria-expanded') === 'false') {
    await user.click(toggleButton);
    await waitFor(() => expect(toggleButton).toHaveAttribute('aria-expanded', 'true'), {
      timeout: TEST_TIMEOUTS.ELEMENT_WAIT,
    });
  }
}

/**
 * Opens a row's kebab menu (actions dropdown) by the row's name.
 */
export async function openRowActionsMenu(user: UserEvent, canvas: ScopedQueries, rowName: string) {
  const kebabButton = await canvas.findByRole('button', { name: `${rowName} actions` });
  await user.click(kebabButton);

  await within(document.body).findAllByRole('menuitem', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
}

/**
 * Opens a role's kebab menu — roles use a different aria-label pattern.
 */
export async function openRoleActionsMenu(user: UserEvent, canvas: ScopedQueries, roleName: string) {
  const kebabButton = await canvas.findByRole('button', { name: `Actions for role ${roleName}` });
  await user.click(kebabButton);

  await within(document.body).findAllByRole('menuitem', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
}

/**
 * Opens the detail page Actions dropdown (page header kebab or "Actions" button).
 */
export async function openDetailPageActionsMenu(user: UserEvent, canvas: ScopedQueries) {
  let actionsButton = canvas.queryByRole('button', { name: 'Actions' });

  if (!actionsButton) {
    actionsButton = canvas.queryByRole('button', { name: /actions/i });
  }

  if (!actionsButton) {
    const dropdown = document.body.querySelector('[data-ouia-component-id="group-title-actions-dropdown"]');
    if (dropdown) {
      actionsButton = within(dropdown as HTMLElement).queryByRole('button');
    }
    if (!actionsButton) {
      const plainToggle = document.body.querySelector('.pf-v6-c-dropdown__toggle.pf-m-plain');
      actionsButton = plainToggle as HTMLButtonElement | null;
    }
  }

  if (actionsButton) {
    await user.click(actionsButton);
    await within(document.body).findAllByRole('menuitem', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  } else {
    throw new Error('Could not find Actions button or kebab menu');
  }
}

/**
 * Clicks a menu item from an open dropdown menu.
 */
export async function clickMenuItem(user: UserEvent, menuItemText: string) {
  const menuItem = await within(document.body).findByText(menuItemText, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  await user.click(menuItem);
}

/**
 * Verifies a success notification appears and no error/warning notifications.
 */
export async function verifySuccessNotification() {
  await waitFor(
    () => {
      const successNotification =
        document.body.querySelector('.pf-v6-c-alert.pf-m-success') ||
        document.body.querySelector('.pf-c-alert.pf-m-success') ||
        document.body.querySelector('[class*="pf-m-success"]');
      expect(successNotification).toBeInTheDocument();

      const errorNotification = document.body.querySelector('.pf-v6-c-alert.pf-m-danger') || document.body.querySelector('.pf-c-alert.pf-m-danger');
      const warningNotification =
        document.body.querySelector('.pf-v6-c-alert.pf-m-warning') || document.body.querySelector('.pf-c-alert.pf-m-warning');
      expect(errorNotification).toBeNull();
      expect(warningNotification).toBeNull();
    },
    { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
  );
}

/**
 * Waits for a page/list to load by checking for a specific text element.
 */
export async function waitForPageToLoad(canvas: ScopedQueries, elementText: string, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT;
  await waitFor(
    () => {
      expect(canvas.queryByText(elementText)).not.toBeNull();
    },
    { timeout },
  );
}
