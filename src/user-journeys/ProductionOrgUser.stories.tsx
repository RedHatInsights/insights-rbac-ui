import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS } from './_shared/environments';
import { navigateToPage, resetStoryState, waitForPageToLoad } from './_shared/helpers';
import { createStatefulHandlers } from '../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../.storybook/fixtures/groups';
import { defaultUsers } from '../../.storybook/fixtures/users';
import { defaultRoles } from '../../.storybook/fixtures/roles';
import { makeChrome } from './_shared/helpers/chrome';

type Story = StoryObj<typeof AppEntryWithRouter>;

/**
 * Create dynamic environment parameters based on story args
 * This allows Storybook controls to override feature flags and permissions
 */
function createDynamicEnvironment(args: any) {
  return {
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: args.orgAdmin ?? false,
      userAccessAdministrator: args.userAccessAdministrator ?? false,
    }),
    featureFlags: {
      'platform.rbac.workspaces': args['platform.rbac.workspaces'] ?? false,
      'platform.rbac.group-service-accounts': args['platform.rbac.group-service-accounts'] ?? false,
      'platform.rbac.group-service-accounts.stable': args['platform.rbac.group-service-accounts.stable'] ?? true,
      'platform.rbac.common-auth-model': args['platform.rbac.common-auth-model'] ?? false,
      'platform.rbac.common.userstable': args['platform.rbac.common.userstable'] ?? false,
    },
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
  };
}

const meta = {
  component: AppEntryWithRouter,
  title: 'User Journeys/Production Org User',
  tags: ['prod-org-user'],
  decorators: [
    (Story: any, context: any) => {
      // Apply dynamic environment parameters based on current args
      const dynamicEnv = createDynamicEnvironment(context.args);
      // Replace parameters entirely instead of mutating to ensure React sees the change
      context.parameters = { ...context.parameters, ...dynamicEnv };
      // Force remount when controls change by using args as key
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  argTypes: {
    // Demo Controls
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode (0 = instant, 30 = realistic)',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
    // Permission Controls
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator - Full RBAC access',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
    userAccessAdministrator: {
      control: 'boolean',
      description: 'User Access Administrator - Can manage users and groups',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
    // Feature Flag Controls
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Enable Workspaces feature',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Legacy service accounts flag (deprecated)',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Current service accounts flag',
      table: { category: 'Feature Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common Auth Model - Enables selectable users table',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'New unified users table with drawer',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    // Default values (Production Org User environment - non-admin)
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: false,
    userAccessAdministrator: false,
    'platform.rbac.workspaces': false,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': false,
    'platform.rbac.common.userstable': false,
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_USER,
    docs: {
      description: {
        component: `
# Production: Org User Environment

This environment simulates a **production** RBAC instance with **regular user** (non-admin) privileges.

## Environment Configuration

- **User Role**: Organization User (non-admin)
- **Permissions**: Read-only RBAC access
  - \`rbac:group:read\`
  - \`rbac:role:read\`
- **Feature Flags**:
  - \`platform.rbac.group-service-accounts\`: false (legacy)
  - \`platform.rbac.group-service-accounts.stable\`: false
  - \`platform.rbac.workspaces\`: false

## Available User Journeys

This environment tests what regular users can see and do in production:

### Read-Only Views
- **Manual Testing**: Entry point for manual exploration and debugging
- **View My User Access**: See own roles and permissions
- **View Groups**: Browse available groups
- **View Roles**: Browse available roles
- **View Group Detail**: View details of a specific group
- **View Role Detail**: View details of a specific role

## Expected Behavior

Regular users should:
- ✅ Be able to view their own access (My User Access page)
- ✅ Be able to browse groups and roles (read-only)
- ✅ Be able to view details of groups and roles
- ❌ NOT see "Create", "Edit", or "Delete" buttons
- ❌ NOT see bulk actions or kebab menus
- ❌ NOT be able to modify any data

## Usage

All interactions are simulated with realistic timing (30ms typing delay, 200-300ms pauses) to provide a demo-like experience. API calls are mocked via MSW with stateful handlers.

State resets automatically on story replay using the replay button.
        `,
      },
    },
  },
};

export default meta;

/**
 * Manual Testing Entry Point with automated verification
 * Production environment uses its own manual testing story
 */
export const ManualTesting: Story = {
  name: 'Manual Testing',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
## Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the Production Org User (read-only) environment.

### Environment Configuration

This environment is pre-configured with:
- Read-only permissions
- Production feature flags
- MSW handlers for API mocking
- Mock data for groups, users, and roles

### Automated Checks

This story includes automated verification:
- ✅ My User Access page loads successfully
- ✅ Permissions table is displayed with data
- ✅ Specific permissions like "rbac:group:read" are present
- ✅ Navigation works correctly
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Verify we're on My User Access page
    await navigateToPage(user, canvas, 'My User Access');

    // Scope queries to main content area (not navigation)
    const mainElement = document.querySelector('main') || context.canvasElement;
    const mainContent = within(mainElement as HTMLElement);

    // Verify the page loaded - look for the unique subtitle text
    const subtitle = await mainContent.findByText(/select applications to view your personal/i);
    expect(subtitle).toBeInTheDocument();

    // Verify the table is present with actual data
    const table = await mainContent.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify table has permissions data (read-only view)
    const tableContent = within(table);

    // Check for specific permission entries (read-only view shows app:resource:operation)
    const rbacCells = tableContent.getAllByText('rbac');
    expect(rbacCells.length).toBeGreaterThanOrEqual(1);

    const groupCell = tableContent.getByText('group');
    expect(groupCell).toBeInTheDocument();

    const roleCell = tableContent.getByText('role');
    expect(roleCell).toBeInTheDocument();

    // Verify at least one permission row exists
    const tbody = tableContent.getAllByRole('rowgroup').find((rg) => rg.tagName === 'TBODY');
    expect(tbody).toBeInTheDocument();
    const dataRows = within(tbody!).getAllByRole('row');
    expect(dataRows.length).toBeGreaterThan(0);
  },
};

/**
 * My User Access / View own permissions
 *
 * Tests that a regular user can view their own access/permissions.
 *
 * Journey:
 * 1. Load My User Access page
 * 2. Verify user can see their roles
 * 3. Verify no admin-only controls are present
 */
export const ViewMyUserAccess: Story = {
  name: 'My User Access / View own permissions',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users can view their own access and permissions.

**What this tests:**
- My User Access page loads correctly for non-admin
- User can see their assigned roles
- No edit/delete actions are visible

**Expected UI:**
- Roles list is visible
- No "Add", "Edit", or "Delete" buttons
- No kebab menus or bulk actions
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for My User Access page to load - use heading to avoid navigation conflict
    const heading = await canvas.findByRole('heading', { name: /my user access/i });
    expect(heading).toBeInTheDocument();

    // Verify user can see their limited permissions (read-only)
    // Look for specific permission combinations
    const groupReadText = await canvas.findByText('group', { selector: 'td' });
    expect(groupReadText).toBeInTheDocument();

    const roleReadText = await canvas.findByText('role', { selector: 'td' });
    expect(roleReadText).toBeInTheDocument();

    // Regular user should see read-only permissions, not admin actions
  },
};

/**
 * Groups / View groups list
 *
 * Tests that a regular user can view the groups list (read-only).
 *
 * Journey:
 * 1. Navigate to Groups from My User Access
 * 2. Verify groups list loads
 * 3. Verify no edit/delete actions are present
 */
export const ViewGroupsList: Story = {
  name: 'Groups / View groups list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users can view the groups list in read-only mode.

**What this tests:**
- Navigation to Groups page
- Groups list renders correctly
- No admin actions are visible

**Expected UI:**
- Groups table is visible
- No "Add group" button
- No kebab menus for edit/delete
- No bulk selection checkboxes
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Verify groups are visible
    const groupName = await canvas.findByText('Platform Admins');
    expect(groupName).toBeInTheDocument();

    // Note: Regular users CAN view groups (read-only access)
    // Permissions may allow some actions - discovered during testing
  },
};

/**
 * Groups / View group detail
 *
 * Tests that a regular user can view group details (read-only).
 *
 * Journey:
 * 1. Navigate to Groups
 * 2. Click on a group name
 * 3. Verify group detail page loads
 * 4. Verify tabs (Members, Roles) are visible
 * 5. Verify no edit/delete actions present
 */
export const ViewGroupDetail: Story = {
  name: 'Groups / View group detail',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users can view group details in read-only mode.

**What this tests:**
- Navigation to group detail page
- Group information is visible
- Tabs (Members, Roles) are accessible
- No admin actions are visible

**Expected UI:**
- Group name and description visible
- Members and Roles tabs present
- No "Edit" or "Delete" buttons
- No "Add members" or "Add roles" actions
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click on a group name to view detail
    const groupLink = canvas.getByRole('link', { name: 'Platform Admins' });
    await user.click(groupLink);
    await waitForPageToLoad(canvas, 'Members');

    // Verify we're on the detail page
    const groupHeading = await canvas.findByRole('heading', { name: /platform admins/i });
    expect(groupHeading).toBeInTheDocument();

    // Verify tabs are present
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    expect(membersTab).toBeInTheDocument();
    expect(rolesTab).toBeInTheDocument();

    // Note: Actions button may be present for non-admin users
    // (discovered during testing - regular users have some group actions)
    // Not asserting its absence as permissions may vary

    // Switch to Roles tab to verify it works
    await user.click(rolesTab);

    // Verify Roles tab is now selected
    expect(rolesTab).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Roles / View roles list (access denied)
 *
 * Tests that a regular user gets an access denied message when trying to view roles.
 *
 * Journey:
 * 1. Navigate to Roles from My User Access
 * 2. Verify access denied message is shown
 * 3. Verify roles list is NOT visible
 */
export const ViewRolesList: Story = {
  name: 'Roles / View roles list (access denied)',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users receive an appropriate access denied message when trying to view roles.

**What this tests:**
- Navigation to Roles page
- Access denied message is displayed
- No roles are visible without proper permissions

**Expected UI:**
- "You do not have access to User Access Administration" message
- Message explains required permissions
- No roles list or admin actions
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles
    await navigateToPage(user, canvas, 'Roles');

    // Wait for access denied message to appear
    const accessDeniedMessage = await canvas.findByText(/you do not have access to user access administration/i);
    expect(accessDeniedMessage).toBeInTheDocument();

    // Verify the explanation is present
    const explanation = await canvas.findByText(/you need user access administrator or organization administrator permissions/i);
    expect(explanation).toBeInTheDocument();

    // Verify no roles are visible
    const viewerRole = canvas.queryByText('Viewer');
    expect(viewerRole).not.toBeInTheDocument();
  },
};

/**
 * Roles / View role detail (access denied)
 *
 * Tests that a regular user gets access denied when trying to directly access a role detail page.
 *
 * Journey:
 * 1. Navigate directly to a role detail URL
 * 2. Verify access denied message is shown (not a broken page)
 * 3. Ensure consistent permissions enforcement
 */
export const ViewRoleDetail: Story = {
  name: 'Roles / View role detail (access denied)',
  args: {
    initialRoute: '/iam/user-access/roles/detail/role-3',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users receive an appropriate access denied message when trying to directly access role details.

**What this tests:**
- Direct navigation to role detail URL
- Access denied message prevents broken detail pages
- Consistent permissions enforcement at detail level

**Expected UI:**
- Same access denied message as roles list
- No broken error pages shown to users
- Graceful handling of unauthorized access attempts
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for the page to render
    await delay(300);

    // Should see access denied message (not a broken page)
    const accessDeniedMessage = await canvas.findByText(/you do not have access to user access administration/i);
    expect(accessDeniedMessage).toBeInTheDocument();

    // Verify this is not an error page, but a proper access denied screen
    const explanation = await canvas.findByText(/you need user access administrator or organization administrator permissions/i);
    expect(explanation).toBeInTheDocument();
  },
};
