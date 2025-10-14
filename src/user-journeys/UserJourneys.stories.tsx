import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, waitFor, within } from 'storybook/test';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS } from './_shared/environments';
import { resetStoryState } from './_shared/helpers';
import { createStatefulHandlers } from '../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../.storybook/fixtures/groups';
import { defaultRoles } from '../../.storybook/fixtures/roles';
import { defaultUsers } from '../../.storybook/fixtures/users';

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
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        roles: defaultRoles,
        users: defaultUsers,
      }),
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
2. **State Isolation**: Each story starts with a fresh Redux store and MSW state
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Simple verification that the page loads
    await waitFor(async () => {
      // Wait for My User Access page to load - check for the main heading
      await expect(canvas.getByRole('heading', { name: /my user access/i })).toBeInTheDocument();
    });
  },
};
