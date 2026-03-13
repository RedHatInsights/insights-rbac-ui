import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS, v1Db } from './_shared/environments';
import { resetStoryState } from './_shared/helpers';
import { waitForContentReady } from '../test-utils/interactionHelpers';

type Story = StoryObj<typeof AppEntryWithRouter>;

const meta: Meta<typeof AppEntryWithRouter> = {
  component: AppEntryWithRouter,
  title: 'User Journeys',
  tags: ['autodocs'],
  decorators: [], // Disable Storybook decorators - we provide everything via AppEntry
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_ADMIN,
    msw: {
      handlers: ENVIRONMENTS.PROD_ORG_ADMIN.msw.handlers,
    },
    docs: {
      description: {
        component: `
# RBAC UI User Journeys

This section demonstrates complete end-to-end user journeys through the RBAC UI application. Each journey tests a realistic user workflow from start to finish, including:

- API orchestration and data fetching
- User interactions (clicks, form inputs, selections)
- State management and UI updates
- Success notifications and navigation
- Feature flag variations

## Test Organization

User journeys are organized by **environment**. Each environment represents a specific combination of:
- **User permissions** (Org Admin vs Org User)
- **Feature flags** (e.g., service accounts, workspaces)
- **Chrome configuration** (environment settings)

### Available Environments

#### Production: Org Admin
Full administrator access in production environment with all current features enabled.

**Journeys:**
- Group Management (Create, Edit, Delete from list and detail pages)

#### Production: Org User *(Coming Soon)*
Read-only user access in production environment.

**Journeys:**
- View-only workflows

#### Workspaces Enabled *(Coming Soon)*
Testing the workspaces feature flag.

**Journeys:**
- Workspace-specific workflows

## Test Characteristics

All user journey tests include:

1. **Realistic Timing**: Interactions use 30ms typing delays and 200-300ms pauses between actions to simulate human behavior
2. **State Isolation**: Each story starts with a fresh React Query cache and MSW state
3. **Comprehensive Validation**: Tests verify success notifications, UI updates, and absence of error states
4. **MSW Integration**: All API calls are mocked with stateful handlers that persist changes within a story run

## Usage

### Manual Testing
Each environment includes a "Manual Testing" story that serves as an entry point for:
- Manual exploration and debugging
- Visual regression testing
- Testing edge cases not covered by automated journeys

### Automated Testing
All stories can be run via \`test-storybook\`:
\`\`\`bash
# Run all user journey tests
npm run test-storybook -- --includeTags prod-org-admin

# Run specific environment
npm run test-storybook -- --includeTags prod-org-admin
\`\`\`

### Replay
Use the Storybook replay button to re-run a journey. State resets automatically before each replay.
        `,
      },
    },
  },
};

export default meta;

/**
 * Documentation Entry Point
 *
 * This story provides an interactive entry point to the RBAC UI for documentation purposes.
 * Use the navigation sidebar to explore different sections of the application.
 */
export const Documentation: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This is the main documentation entry point for RBAC UI user journeys.

Use this story to:
- Explore the application structure
- Navigate between different sections
- Test basic functionality manually

For automated test journeys, see the environment-specific story folders.
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify page loads', async () => {
      const heading = await canvas.findByRole('heading', { name: /my user access/i });
      expect(heading).toBeInTheDocument();
    });
  },
};
