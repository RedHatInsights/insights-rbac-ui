import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'storybook/test';
import { verifyTooltip } from './tooltipHelpers';

const TOOLTIP_TEXT = 'Workspace permissions are being synchronized.';
const timers: ReturnType<typeof setTimeout>[] = [];

function createTooltip(opacity: string): HTMLDivElement {
  const tooltip = document.createElement('div');
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = TOOLTIP_TEXT;
  tooltip.style.opacity = opacity;
  return tooltip;
}

function createTrigger(): HTMLButtonElement {
  const trigger = document.createElement('button');
  trigger.textContent = 'Pending workspace';
  document.body.append(trigger);
  return trigger;
}

afterEach(() => {
  timers.forEach(clearTimeout);
  timers.length = 0;
  document.body.replaceChildren();
});

describe('verifyTooltip', () => {
  it('waits for the visible replacement node and for the exit transition to remove it', async () => {
    const trigger = createTrigger();
    const initialTooltip = createTooltip('0');
    const visibleTooltip = createTooltip('1');
    const onUnhover = vi.fn();

    trigger.addEventListener('mouseenter', () => {
      document.body.append(initialTooltip);
      timers.push(setTimeout(() => initialTooltip.replaceWith(visibleTooltip), 20));
    });
    trigger.addEventListener('mouseleave', () => {
      onUnhover(document.body.querySelector('[role="tooltip"]'));
      timers.push(setTimeout(() => visibleTooltip.remove(), 20));
    });

    await verifyTooltip(userEvent.setup(), trigger, TOOLTIP_TEXT);

    expect(onUnhover).toHaveBeenCalledExactlyOnceWith(visibleTooltip);
    expect(initialTooltip).not.toBeInTheDocument();
    expect(visibleTooltip).not.toBeInTheDocument();
  });

  it('fails rather than accepting tooltip text that never becomes visible', async () => {
    const trigger = createTrigger();
    const hiddenTooltip = createTooltip('0');
    const onUnhover = vi.fn();
    trigger.addEventListener('mouseenter', () => document.body.append(hiddenTooltip));
    trigger.addEventListener('mouseleave', onUnhover);

    await expect(verifyTooltip(userEvent.setup(), trigger, TOOLTIP_TEXT)).rejects.toThrow('toBeVisible');

    expect(onUnhover).not.toHaveBeenCalled();
    expect(hiddenTooltip).toBeInTheDocument();
  });

  it('reports a missing tooltip and a trigger replaced during hover', async () => {
    const trigger = createTrigger();
    trigger.addEventListener('mouseenter', () => trigger.replaceWith(trigger.cloneNode(true)));

    await expect(verifyTooltip(userEvent.setup(), trigger, TOOLTIP_TEXT)).rejects.toThrow(
      /Tooltip diagnostics:[\s\S]*"triggerConnected": false[\s\S]*"tooltips": \[\]/,
    );
  });

  it('reports tooltip content that does not match the expected accessible name', async () => {
    const trigger = createTrigger();
    const tooltip = createTooltip('1');
    const otherText = 'A different tooltip message.';
    tooltip.textContent = otherText;
    trigger.addEventListener('mouseenter', () => document.body.append(tooltip));

    await expect(verifyTooltip(userEvent.setup(), trigger, TOOLTIP_TEXT)).rejects.toThrow(new RegExp(`Tooltip diagnostics:[\\s\\S]*${otherText}`));
  });

  it('reports a matching tooltip excluded from role queries by a hidden ancestor', async () => {
    const trigger = createTrigger();
    const portal = document.createElement('div');
    portal.setAttribute('aria-hidden', 'true');
    portal.append(createTooltip('1'));
    trigger.addEventListener('mouseenter', () => document.body.append(portal));

    await expect(verifyTooltip(userEvent.setup(), trigger, TOOLTIP_TEXT)).rejects.toThrow(/Tooltip diagnostics:[\s\S]*"ariaHidden": "true"/);
  });
});
