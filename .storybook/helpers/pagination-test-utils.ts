import { expect, userEvent, waitFor, within } from 'storybook/test';

export const PAGINATION_TEST_TOTAL_ITEMS = 55;
export const PAGINATION_TEST_DEFAULT_PER_PAGE = 20;
// Must be one of the app's perPageOptions (commonly [10, 20, 50, 100])
export const PAGINATION_TEST_SMALL_PER_PAGE = 10;

export const getLastPageNumber = (total: number, perPage: number) => Math.max(1, Math.ceil(total / perPage));

export const getLastPageOffset = (total: number, perPage: number) => Math.max(0, (getLastPageNumber(total, perPage) - 1) * perPage);

export const getLastCallArg = <TArg = unknown>(spy: { mock: { calls: unknown[][] } }, argIndex = 0): TArg => {
  const calls = spy.mock.calls;
  if (!calls.length) {
    throw new Error('Spy was not called');
  }
  return calls[calls.length - 1][argIndex] as TArg;
};

export const openPerPageMenu = async (body: ReturnType<typeof within>) => {
  // PatternFly pagination can render the per-page control as:
  // - an options-menu toggle button (IDs can be suffixed), or
  // - a labeled button, or
  // - a native select (role="combobox").
  //
  // If it's a select/combobox, `selectPerPage` will handle it without needing a click here.
  const control = await waitFor(
    () => {
      const toggle =
        (document.querySelector('[id^="options-menu-top-toggle"]') as HTMLElement | null) ||
        (document.querySelector('[id^="options-menu-bottom-toggle"]') as HTMLElement | null) ||
        (document.querySelector('[id^="options-menu-"][id$="-toggle"]') as HTMLElement | null);
      if (toggle) return { kind: 'toggle' as const, el: toggle };

      const button = body.queryByRole('button', { name: /items per page|per page/i });
      if (button) return { kind: 'button' as const, el: button as HTMLElement };

      const combobox = body.queryAllByRole('combobox')[0] as HTMLElement | undefined;
      if (combobox) return { kind: 'combobox' as const, el: combobox };

      throw new Error('Per-page control not ready');
    },
    { timeout: 5000 },
  );

  if (control.kind === 'toggle' || control.kind === 'button') {
    await userEvent.click(control.el);
  }
};

export const selectPerPage = async (body: ReturnType<typeof within>, value: number) => {
  const targetText = String(value);

  const comboboxes = body.queryAllByRole('combobox') as HTMLElement[];
  if (comboboxes.length) {
    const matching = comboboxes.find((cb: HTMLElement) => {
      // Native <select> exposes options in DOM; use that when possible.
      if (cb instanceof HTMLSelectElement) {
        return Array.from(cb.options).some((o) => (o.textContent || '').trim().startsWith(targetText));
      }
      return false;
    });
    if (matching) {
      await userEvent.selectOptions(matching, targetText);
      return;
    }
  }

  const listbox = await body.findByRole('listbox', {}, { timeout: 5000 }).catch(() => null);
  if (listbox) {
    const opt = within(listbox)
      .getAllByRole('option')
      .find((o) => {
        const text = (o.textContent || '').trim();
        const m = text.match(/^(\d+)/);
        return m ? parseInt(m[1], 10) === value : false;
      });
    if (!opt) throw new Error(`Could not find per-page option "${value}"`);
    await userEvent.click(opt);
    return;
  }

  const menu = await body.findByRole('menu', {}, { timeout: 5000 });
  const item = within(menu)
    .getAllByRole('menuitem')
    .find((i) => {
      const text = (i.textContent || '').trim();
      const m = text.match(/^(\d+)/);
      return m ? parseInt(m[1], 10) === value : false;
    });
  if (!item) throw new Error(`Could not find per-page menu item containing "${value}"`);
  await userEvent.click(item);
};

export const expectLocationParams = async (
  locEl: HTMLElement,
  expected: { page?: string | null; perPage?: string | null; per_page?: string | null },
) => {
  await waitFor(
    () => {
      const raw = locEl.textContent || '';
      const qIndex = raw.indexOf('?');
      const search = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
      const params = new URLSearchParams(search);
      if (expected.page !== undefined) {
        const value = params.get('page');
        if (expected.page === null) {
          expect(value).toBeNull();
        } else {
          expect(value).toBe(expected.page);
        }
      }
      if (expected.perPage !== undefined) {
        const value = params.get('perPage');
        if (expected.perPage === null) {
          expect(value).toBeNull();
        } else {
          expect(value).toBe(expected.perPage);
        }
      }
      if (expected.per_page !== undefined) {
        // Back-compat for any legacy stories that used snake_case.
        const value = params.get('per_page');
        if (expected.per_page === null) {
          expect(value).toBeNull();
        } else {
          expect(value).toBe(expected.per_page);
        }
      }
    },
    { timeout: 5000 },
  );
};
