import { delay } from 'msw';
import { TEST_TIMEOUTS } from './testUtils';

/**
 * Verify MSW handlers are ready by making a test request.
 * Retries up to maxAttempts times with exponential backoff.
 * This prevents flaky tests caused by MSW handler initialization timing.
 */
async function verifyMswReady(maxAttempts = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('/api/rbac/v1/groups/?limit=1');
      if (response.ok) {
        return; // MSW is ready
      }
    } catch {
      // Network error - MSW not ready yet
    }

    if (attempt < maxAttempts) {
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms
      await delay(50 * Math.pow(2, attempt - 1));
    }
  }

  throw new Error('MSW handlers not ready after reset - this indicates a test infrastructure issue');
}

/**
 * Helper function to reset story state and clean up notifications.
 * Call this at the start of every play function for test isolation.
 *
 * This function:
 * 1. Resets MSW stateful handlers to initial state
 * 2. Verifies MSW is responsive (prevents race conditions)
 * 3. Cleans up lingering DOM elements (notifications, modals)
 * 4. Allows React to process updates
 */
export async function resetStoryState(): Promise<void> {
  // 1. Reset MSW state for test isolation
  const response = await fetch('/api/test/reset-state', { method: 'POST' });
  await response.json(); // Ensure the request completes fully

  // 2. Verify MSW handlers are ready - this is the key to preventing flakiness
  // Without this, components might fire requests before handlers are registered
  await verifyMswReady();

  // 3. Clear any lingering notifications from previous runs
  const existingNotifications = document.querySelectorAll('.pf-v6-c-alert');
  existingNotifications.forEach((notification) => notification.remove());

  // 4. Clear any lingering modals from previous stories
  // This prevents "removeChild" errors when React tries to unmount modals from previous stories
  const modalContainer = document.getElementById('storybook-modals');
  if (modalContainer) {
    const existingModals = modalContainer.querySelectorAll('[role="dialog"]');
    existingModals.forEach((modal) => modal.remove());
  }

  // 5. Give React a tick to process any pending state updates
  // Reduced from 500ms since we now have explicit MSW verification
  await delay(TEST_TIMEOUTS.QUICK_SETTLE);
}
