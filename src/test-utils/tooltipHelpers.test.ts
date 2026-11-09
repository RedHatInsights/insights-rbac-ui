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
});
