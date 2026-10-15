import { delay } from 'msw';
import { TEST_TIMEOUTS } from '../../../test-utils/testUtils';

/**
 * Verify MSW handlers are ready by making a test request.
 * Retries up to maxAttempts times with exponential backoff.
 * This prevents flaky tests caused by MSW handler initialization timing.
 */
async function verifyMswReady(maxAttempts = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3_000);
      const response = await fetch('/api/rbac/v1/groups/?limit=1', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return; // MSW is ready
      }
    } catch {
      // Network error or abort — MSW not ready yet
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
 * When a MockDb is provided, it is reset before the MSW readiness
 * check so that the next request sees clean seed data.
 *
 * Access-management stories that don't use a centralized MockDb
 * can call this without arguments — the decorator already resets
 * the individual ResettableCollections.
 */
export async function resetStoryState(db?: { reset(): void; ready?: Promise<void> }): Promise<void> {
  // 1. Reset MockDb collections + maps (when using centralized db)
  db?.reset();

  // 1b. Await collection repopulation — @msw/data Collection.create() is async; handlers
  //     must see populated data before the first request
  if (db?.ready) {
    await db.ready;
  }

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
