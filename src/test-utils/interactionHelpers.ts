/**
 * Shared interaction helpers for user-journey story play functions.
 *
 * These replace inline querySelector / delay / pollUntilTrue patterns
 * with testing-library queries that retry automatically.
 */

import type { BoundFunctions, queries } from '@testing-library/dom';
import type { UserEvent } from '@testing-library/user-event';
import { delay } from 'msw';
import { expect, waitFor, within } from 'storybook/test';
import { TEST_TIMEOUTS } from './testUtils';

/** Scoped query handle returned by `within(element)`. */
export type ScopedQueries = BoundFunctions<typeof queries>;

const body = () => within(document.body);

/**
 * Wait for a modal dialog to appear and return a scoped `within()` handle.
 * Replaces all inline `document.querySelector('[role="dialog"]')` patterns.
 *
 * When multiple dialogs exist (e.g. a wizard success screen stacking on top
 * of the wizard dialog), returns the **last** one — i.e. the topmost in DOM
 * order. If you need a specific dialog, assert on a heading or content
 * inside the returned scope to confirm you have the right one.
 *
 * **`waitUntil`** — optional readiness predicate run against the dialog scope.
 * When provided, `waitForModal` retries until the predicate passes (e.g. a
 * form field is populated), then returns a **fresh** `within()` scope so the
 * caller never holds a stale DOM reference.
 *
 * ```ts
 * const dialog = await waitForModal({
 *   waitUntil: (dlg) => expect(dlg.queryByDisplayValue('Foo')).toBeInTheDocument(),
 * });
 * ```
 */
export async function waitForModal(options?: { timeout?: number; waitUntil?: (dialog: ScopedQueries) => void }): Promise<ScopedQueries> {
  const timeout = options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT;

  if (options?.waitUntil) {
    const predicate = options.waitUntil;
    await waitFor(
      () => {
        const dialogs = body().queryAllByRole('dialog');
        const el = dialogs[dialogs.length - 1];
        expect(el).toBeTruthy();
        predicate(within(el));
      },
      { timeout },
    );
    const dialogs = body().getAllByRole('dialog');
    // Let focus trap and form auto-focus settle before returning control.
    await delay(1500);
    return within(dialogs[dialogs.length - 1]);
  }

  const dialogs = await body().findAllByRole('dialog', {}, { timeout });
  const dialog = dialogs[dialogs.length - 1];
  if (!dialog) {
    throw new Error('waitForModal: no dialog found');
  }
  // Let focus trap and form auto-focus settle before returning control.
  await delay(1500);
  return within(dialog);
}

/**
 * Wait for the detail drawer panel to appear and return a scoped `within()` handle.
 * Requires `data-testid="detail-drawer-panel"` on the source `DrawerPanelContent`.
 */
export async function waitForDrawer(options?: { timeout?: number }): Promise<ScopedQueries> {
  const panel = await body().findByTestId('detail-drawer-panel', {}, { timeout: options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT });
  return within(panel);
}

/**
 * Click a tab by name, then wait for it to become selected.
 */
export async function clickTab(user: UserEvent, scope: ScopedQueries, tabName: string | RegExp): Promise<void> {
  const tab = await scope.findByRole('tab', { name: tabName });
  await user.click(tab);
  await waitFor(() => expect(tab).toHaveAttribute('aria-selected', 'true'));
}

/**
 * Select a table row by clicking its checkbox. Finds the row by visible text,
 * locates the checkbox within it, and clicks. Returns the row element.
 */
export async function selectTableRow(user: UserEvent, scope: ScopedQueries, rowText: string | RegExp): Promise<HTMLElement> {
  const cell = await scope.findByText(rowText);
  const row = cell.closest('tr') as HTMLElement;
  expect(row).not.toBeNull();
  const checkbox = within(row).getByRole('checkbox');
  await user.click(checkbox);
  return row;
}

/**
 * Wait for a notification with specific text to appear.
 * For generic "success" checks, use `verifySuccessNotification` instead.
 */
export async function waitForNotification(textPattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
  await body().findByText(textPattern, {}, { timeout: options?.timeout ?? TEST_TIMEOUTS.NOTIFICATION_WAIT });
}

/**
 * Confirm a destructive modal: find the modal, optionally check a confirmation
 * checkbox, then click the action button.
 */
export async function confirmDestructiveModal(user: UserEvent, options?: { checkboxLabel?: RegExp; buttonText?: string | RegExp }): Promise<void> {
  const modal = await waitForModal();

  const checkbox = options?.checkboxLabel ? modal.queryByRole('checkbox', { name: options.checkboxLabel }) : modal.queryByRole('checkbox');
  if (checkbox) {
    await user.click(checkbox);
  }

  const buttonText = options?.buttonText ?? /delete|remove/i;
  const button = await modal.findByRole('button', { name: buttonText });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
}

/**
 * Click the primary "Next" (or custom) button in a wizard, waiting for it
 * to be enabled first. Skips pagination "Next" buttons by filtering out
 * buttons inside `.pf-v6-c-pagination`.
 */
export async function clickWizardNext(user: UserEvent, scope: ScopedQueries, options?: { buttonText?: RegExp; timeout?: number }): Promise<void> {
  const name = options?.buttonText ?? /^next$/i;
  const timeout = options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT;

  const button = await waitFor(
    () => {
      const candidates = scope.queryAllByRole('button', { name });
      const wizardBtn = candidates.find((btn: HTMLElement) => !btn.closest('.pf-v6-c-pagination'));
      expect(wizardBtn).toBeTruthy();
      return wizardBtn!;
    },
    { timeout },
  );
  await waitFor(() => expect(button).toBeEnabled(), { timeout });
  await user.click(button);
}

/**
 * Clear an input's existing value and type new text.
 * Works for both `<input>` and `<textarea>` elements.
 *
 * Accepts a **finder callback** that re-queries the DOM on each retry,
 * so it handles data-driven-forms re-renders that replace DOM nodes.
 * The callback is called inside `waitFor` until the returned element
 * holds focus.
 */
export async function clearAndType(user: UserEvent, findInput: () => HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
  let el!: HTMLInputElement | HTMLTextAreaElement;
  await waitFor(
    () => {
      el = findInput();
      el.focus();
      expect(el).toHaveFocus();
    },
    { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
  );
  await user.clear(el);
  await user.type(el, text);
}

/**
 * Wait for checkboxes to load in a scope, then click the Nth one (0-indexed,
 * offset by `skipHeader` to skip bulk-select checkboxes).
 */
export async function selectNthCheckbox(
  user: UserEvent,
  scope: ScopedQueries,
  index: number,
  options?: { skipHeader?: number; timeout?: number },
): Promise<void> {
  const skip = options?.skipHeader ?? 1;
  const timeout = options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT;

  await waitFor(
    () => {
      const boxes = scope.queryAllByRole('checkbox');
      expect(boxes.length).toBeGreaterThan(index + skip);
    },
    { timeout },
  );

  const boxes = scope.getAllByRole('checkbox');
  await user.click(boxes[index + skip]);

  await waitFor(() => {
    const fresh = scope.getAllByRole('checkbox');
    expect(fresh[index + skip]).toBeChecked();
  });
}

/**
 * Wait for all modal dialogs to close (no `[role="dialog"]` in the DOM).
 */
export async function waitForModalClose(options?: { timeout?: number }): Promise<void> {
  await waitFor(
    () => {
      expect(body().queryByRole('dialog')).not.toBeInTheDocument();
    },
    { timeout: options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT },
  );
}

/**
 * Wait for all PatternFly skeleton/loading indicators to disappear from the
 * canvas, proving that data has loaded and the real UI has rendered.
 *
 * Call this immediately after `resetStoryState()` in every MSW-powered story.
 * Once it resolves, all subsequent `findBy*` calls can use default timeouts.
 *
 * Detected indicators:
 * - `.pf-v6-c-skeleton` — PatternFly `<Skeleton>` component
 * - `[aria-label="Loading"]` — PatternFly `<SkeletonTable>` component
 */
export async function waitForContentReady(canvasElement: HTMLElement, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? TEST_TIMEOUTS.ELEMENT_WAIT;
  // Let the component tree mount and start rendering before checking for skeletons.
  // Without this, the check can pass before skeletons even appear in the DOM (CI race).
  await delay(500);
  await waitFor(
    () => {
      const skeletons = canvasElement.querySelectorAll('.pf-v6-c-skeleton, [aria-label="Loading"]');
      expect(skeletons.length).toBe(0);
    },
    { timeout },
  );
}
