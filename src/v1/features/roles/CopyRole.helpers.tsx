import { userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { pollUntilTrue } from '../../../user-journeys/_shared/helpers';

function isClickable(el: Element | null | undefined): boolean {
  if (!el) return false;
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.pointerEvents === 'none') return false;
  return true;
}

/**
 * Wait for a button to be clickable, then dispatch a native click.
 * Uses native dispatchEvent to bypass Storybook's assertPointerEvents check
 * which logs console errors during wizard CSS transitions.
 */
async function nativeClickWhenReady(elementFn: () => Element | undefined, timeout = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = elementFn();
    if (el && isClickable(el)) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Element never became clickable');
}

/**
 * Fill out the Create Role wizard when copying an existing role.
 */
export async function fillCopyRoleWizard(user: ReturnType<typeof userEvent.setup>, sourceRoleName: string) {
  await pollUntilTrue(() => {
    const d = document.querySelector('[role="dialog"]');
    return !!d && !!within(d as HTMLElement).queryByRole('radio', { name: /copy an existing role/i });
  }, 5000);
  const modal = document.querySelector('[role="dialog"]') as HTMLElement;

  await delay(300);

  // Step 1: Select "Copy an existing role"
  const copyOption = within(modal).getByRole('radio', { name: /copy an existing role/i });
  await user.click(copyOption);
  await delay(500);

  await pollUntilTrue(() => !!within(modal).queryByRole('grid'), 5000);
  await delay(300);

  const sourceRoleRadio = within(modal).getByRole('radio', { name: new RegExp(sourceRoleName, 'i') });
  await user.click(sourceRoleRadio);
  await delay(300);

  const primaryNext = () => {
    const allNext = within(modal).queryAllByRole('button', { name: /^next$/i });
    return allNext.find((btn) => btn.classList.contains('pf-m-primary'));
  };

  await nativeClickWhenReady(primaryNext, 5000);
  await delay(500);

  // Step 2: Name and description
  await pollUntilTrue(() => !!within(modal).queryByLabelText(/role name/i), 5000);
  await delay(1000);
  await nativeClickWhenReady(primaryNext, 10000);
  await delay(500);

  // Step 3: Permissions
  if (within(modal).queryByRole('heading', { name: /add permissions/i })) {
    await nativeClickWhenReady(primaryNext, 5000);
    await delay(500);
  }

  // Step 4: Optional "Define Inventory group access" step
  if (within(modal).queryByRole('heading', { name: /inventory group access/i })) {
    // The Select uses role="combobox" (typeahead MenuToggle).
    // Wait for inventory data to load and the combobox to render.
    await pollUntilTrue(() => !!modal.querySelector('[role="combobox"]'), 5000);
    await delay(300);

    // Click the first combobox to open the dropdown
    const combobox = modal.querySelector('[role="combobox"]') as HTMLElement;
    if (combobox) {
      await user.click(combobox);
      await delay(300);

      // Select uses role="menu" with role="menuitem" options.
      // First option is "Select all".
      await pollUntilTrue(() => {
        const menu = document.querySelector('[role="menu"]');
        return !!menu && !!menu.querySelector('[role="menuitem"]');
      }, 3000);

      const firstOption = document.querySelector('[role="menu"] [role="menuitem"]');
      if (firstOption) {
        await user.click(firstOption as HTMLElement);
        await delay(200);
      }

      // Close the dropdown by clicking the combobox toggle button
      const toggleBtn = combobox.closest('.rbac-c-resource-type-select')?.querySelector('button[aria-expanded="true"]');
      if (toggleBtn) {
        (toggleBtn as HTMLElement).click();
        await delay(200);
      }
    }

    // "Copy to all" applies selection to all permission rows
    const copyToAll = within(modal).queryByText(/copy to all/i);
    if (copyToAll) {
      await user.click(copyToAll);
      await delay(300);
    }

    await nativeClickWhenReady(primaryNext, 5000);
    await delay(500);
  }

  // Step 5: Review and submit
  await pollUntilTrue(() => !!within(modal).queryByRole('heading', { name: /review details/i }), 5000);
  await delay(300);

  await nativeClickWhenReady(() => {
    const btn = within(modal).queryByRole('button', { name: /submit/i });
    return btn ?? undefined;
  }, 5000);

  await pollUntilTrue(() => {
    const d = document.querySelector('[role="dialog"]');
    return !!d && !!within(d as HTMLElement).queryByText(/you have successfully created a new role/i);
  }, 5000);

  await delay(300);

  const successDialog = document.querySelector('[role="dialog"]') as HTMLElement;
  const exitButton = within(successDialog).getByRole('button', { name: /exit/i });
  await user.click(exitButton);

  await pollUntilTrue(() => !document.querySelector('[role="dialog"]'), 5000);
}
