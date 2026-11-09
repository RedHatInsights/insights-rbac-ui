import { expect, waitFor, within } from 'storybook/test';
import type { UserEvent } from './testUtils';

/**
 * Verify a hover tooltip is visible, then wait for it to close before continuing.
 * Re-query the portal on every retry: positioning and exit transitions can
 * replace or remove the node returned by an earlier text query.
 */
export async function verifyTooltip(user: UserEvent, trigger: HTMLElement, text: string | RegExp): Promise<void> {
  const body = within(document.body);
  await user.hover(trigger);
  await waitFor(() => expect(body.queryByRole('tooltip', { name: text })).toBeVisible());
  await user.unhover(trigger);
  await waitFor(() => expect(body.queryByRole('tooltip', { name: text })).not.toBeInTheDocument());
}
