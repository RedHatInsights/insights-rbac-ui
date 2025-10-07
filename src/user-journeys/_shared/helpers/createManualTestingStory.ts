import { expect, waitFor, within } from 'storybook/test';
import { resetStoryState } from './resetStoryState';

/**
 * Creates a manual testing story for the given environment
 * This story serves as an entry point for manual exploration
 */
export function createManualTestingStory(environmentName: string, initialRoute = '/iam/user-access/groups') {
  return {
    name: 'Manual Testing Entry',
    tags: ['autodocs'],
    args: {
      initialRoute,
    },
    parameters: {
      docs: {
        description: {
          story: `
## ${environmentName} - Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the RBAC UI in the **${environmentName}** environment.

### Environment Configuration

This environment is pre-configured with:
- Feature flags appropriate for this scenario
- Chrome API mock with correct permissions
- MSW handlers for API mocking
- Initial data state

### Available Journeys

All automated user journey tests for this environment are available in this story file. Use this entry point to:
- Manually explore the UI
- Debug issues
- Verify visual changes
- Test edge cases not covered by automated journeys

### Getting Started

1. Open this story in Storybook
2. Interact with the UI as you would in production
3. All API calls are mocked via MSW
4. State resets on story replay (use the replay button)

**Note**: For automated testing, see the other stories in this file.
          `,
        },
      },
    },
    play: async (context: { canvasElement: HTMLElement }) => {
      await resetStoryState();
      const canvas = within(context.canvasElement);

      // Simple verification that the page loads by waiting for My User Access to load
      await waitFor(
        async () => {
          // Wait for the main heading to appear
          await expect(canvas.getByRole('heading', { name: /my user access/i })).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    },
  };
}
