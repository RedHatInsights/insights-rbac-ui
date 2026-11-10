import { expect, waitFor, within } from 'storybook/test';
import type { UserEvent } from './testUtils';

function describeVisibility(element: Element) {
  const style = getComputedStyle(element);
  return {
    tag: element.tagName,
    ariaHidden: element.getAttribute('aria-hidden'),
    hidden: element.hasAttribute('hidden'),
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
  };
}

/**
 * Verify a hover tooltip is visible, then wait for it to close before continuing.
 * Re-query the portal on every retry: positioning and exit transitions can
 * replace or remove the node returned by an earlier text query.
 */
export async function verifyTooltip(user: UserEvent, trigger: HTMLElement, text: string | RegExp): Promise<void> {
  const bodyElement = document.body;
  const body = within(bodyElement);
  await user.hover(trigger);
  await waitFor(() => expect(body.queryByRole('tooltip', { name: text })).toBeVisible(), {
    onTimeout: (error) => {
      // Capture only on failure, without adding waits or changing the interaction.
      const diagnostics = {
        expectedTooltip: String(text),
        documentVisibility: document.visibilityState,
        bodyIsCurrent: bodyElement === document.body,
        triggerConnected: trigger.isConnected,
        trigger: { html: trigger.outerHTML, ...describeVisibility(trigger) },
        tooltips: within(document.body)
          .queryAllByRole('tooltip', { hidden: true })
          .map((tooltip) => {
            const ancestors = [];
            for (let element: Element | null = tooltip; element; element = element.parentElement) {
              ancestors.push(describeVisibility(element));
            }
            return { html: tooltip.outerHTML, ancestors };
          }),
      };
      error.message += `\nTooltip diagnostics:\n${JSON.stringify(diagnostics, null, 2)}`;
      return error;
    },
  });
  await user.unhover(trigger);
  await waitFor(() => expect(body.queryByRole('tooltip', { name: text })).not.toBeInTheDocument());
}
