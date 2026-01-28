import { delay } from 'msw';
import { TEST_TIMEOUTS } from './testUtils';

/**
 * Helper function to reset story state and clean up notifications
 * Call this at the start of every play function for test isolation
 */
export async function resetStoryState(): Promise<void> {
  // Set up window.insights.chrome for components that access it directly
  if (typeof window !== 'undefined') {
    (window as { insights?: unknown }).insights = {
      chrome: {
        auth: {
          getToken: () => Promise.resolve('mock-token-12345'),
          getUser: () =>
            Promise.resolve({
              identity: {
                user: {
                  username: 'test-user',
                  email: 'test@redhat.com',
                  first_name: 'Test',
                  last_name: 'User',
                  is_org_admin: true,
                },
                internal: {
                  account_id: 'mock-account-123',
                  org_id: 'mock-org-456',
                },
              },
            }),
        },
        isProd: () => false,
        getEnvironment: () => 'stage',
        isBeta: () => false,
      },
    };
  }

  // Reset MSW state for test isolation
  const response = await fetch('/api/test/reset-state', { method: 'POST' });
  await response.json(); // Ensure the request completes fully

  // Clear any lingering notifications from previous runs
  const existingNotifications = document.querySelectorAll('.pf-v6-c-alert');
  existingNotifications.forEach((notification) => notification.remove());

  // Clear any lingering modals from previous stories
  // This prevents "removeChild" errors when React tries to unmount modals from previous stories
  const modalContainer = document.getElementById('storybook-modals');
  if (modalContainer) {
    // Remove all dialog elements from the modal container
    const existingModals = modalContainer.querySelectorAll('[role="dialog"]');
    existingModals.forEach((modal) => modal.remove());
  }

  // Give React time to process any state updates and re-renders
  // This ensures components refetch fresh data after the reset
  await delay(TEST_TIMEOUTS.AFTER_EXPAND);
}
