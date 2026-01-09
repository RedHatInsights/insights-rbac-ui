/**
 * Storybook modal container ID
 */
const STORYBOOK_MODAL_CONTAINER_ID = 'storybook-modals';

/**
 * Get the modal container element for wizards/modals.
 *
 * In Storybook: returns #storybook-modals (from preview-body.html)
 * In production: returns undefined (modals render to document.body)
 */
export function getModalContainer(): HTMLElement | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  return document.getElementById(STORYBOOK_MODAL_CONTAINER_ID) || undefined;
}
