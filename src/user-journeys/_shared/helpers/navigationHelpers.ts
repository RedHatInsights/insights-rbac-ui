import type { ScopedQueries } from '../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS, type UserEvent } from '../../../test-utils/testUtils';

/**
 * Navigates to a page by clicking the sidebar navigation link.
 * Journey-only: requires the full app shell with sidebar nav.
 */
export async function navigateToPage(user: UserEvent, canvas: ScopedQueries, linkText: string) {
  const navLink = await canvas.findByRole('link', { name: linkText }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  await user.click(navLink);
}
