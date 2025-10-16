/**
 * Get or create a persistent modal container for Storybook
 *
 * This prevents the modal cleanup race condition that occurs when:
 * 1. A modal closes and removes its container
 * 2. Story remounts and tries to access the removed container
 * 3. React Portal throws "removeChild: node not a child" error
 *
 * By using a shared, persistent container that survives story remounts,
 * we avoid this issue entirely.
 *
 * @returns The modal container element, or undefined if not in Storybook
 */
export function getModalContainer(): HTMLElement | undefined {
  // In production (non-Storybook), return undefined (use default portal behavior)
  if (typeof document === 'undefined') {
    return undefined;
  }

  // Check if we're in Storybook by looking for storybook-root
  const isStorybook = !!document.getElementById('storybook-root');

  if (!isStorybook) {
    return undefined;
  }

  // In Storybook, use or create a persistent modal container
  let container = document.getElementById('storybook-modals');

  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', 'storybook-modals');
    document.body.appendChild(container);
  }

  return container;
}
