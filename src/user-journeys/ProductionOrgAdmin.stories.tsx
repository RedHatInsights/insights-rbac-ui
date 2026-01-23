import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS } from './_shared/environments';
import {
  clickMenuItem,
  confirmDeleteModal,
  navigateToPage,
  openDetailPageActionsMenu,
  openRoleActionsMenu,
  openRowActionsMenu,
  resetStoryState,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_shared/helpers';
import { fillEditGroupModal } from '../features/groups/EditGroupModal.helpers';
import { fillAddGroupWizardForm } from '../features/groups/add-group/AddGroupWizard.helpers';
import { fillAddGroupMembersModal } from '../features/groups/AddGroupMembers.helpers';
import { fillAddGroupRolesModal } from '../features/groups/AddGroupRoles.helpers';
import { removeSelectedRolesFromGroup } from '../features/groups/RemoveGroupRoles.helpers';
import { fillCreateRoleWizard } from '../features/roles/CreateRole.helpers';
import { fillEditRoleModal } from '../features/roles/EditRole.helpers';
import { confirmDeleteRoleModal } from '../features/roles/DeleteRole.helpers';
import { mockRoles, mockServiceAccounts, mockUsers } from '../features/groups/add-group/AddGroupWizard.mocks';
import { createStatefulHandlers } from '../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../.storybook/fixtures/groups';
import { defaultUsers } from '../../.storybook/fixtures/users';
import { defaultRoles } from '../../.storybook/fixtures/roles';
import { rolesAddToGroupVisibilityFixtures } from '../../.storybook/fixtures/roles-add-to-group-visibility';
import { expandRoleGroups, expectAddRoleLinkHidden, expectAddRoleLinkVisible, getGroupRow } from './_shared/helpers/rolesTableHelpers';
import { makeChrome } from './_shared/helpers/chrome';

type Story = StoryObj<typeof AppEntryWithRouter>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  'platform.rbac.common.userstable'?: boolean;
  initialRoute?: string;
}

/**
 * Create dynamic environment parameters based on story args
 * This allows Storybook controls to override feature flags and permissions
 */
function createDynamicEnvironment(args: StoryArgs) {
  return {
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: args.orgAdmin ?? true,
      userAccessAdministrator: args.userAccessAdministrator ?? false,
    }),
    featureFlags: {
      'platform.rbac.workspaces': args['platform.rbac.workspaces'] ?? false,
      'platform.rbac.group-service-accounts': args['platform.rbac.group-service-accounts'] ?? false,
      'platform.rbac.group-service-accounts.stable': args['platform.rbac.group-service-accounts.stable'] ?? true,
      'platform.rbac.common-auth-model': args['platform.rbac.common-auth-model'] ?? true,
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
  title: 'User Journeys/Production/V1 (Current)/Org Admin',
  tags: ['prod-org-admin'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      // Apply dynamic environment parameters based on current args
      const dynamicEnv = createDynamicEnvironment(context.args);
      // Replace parameters entirely instead of mutating to ensure React sees the change
      context.parameters = { ...context.parameters, ...dynamicEnv };
      // Force remount when controls change by using args as key
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    }) as Decorator<StoryArgs>,
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
      table: { category: 'Permissions', defaultValue: { summary: 'true' } },
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
      table: { category: 'Feature Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'New unified users table with drawer',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    // Default values (Production Org Admin environment)
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces': false,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': false,
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_ADMIN,
    docs: {
      description: {
        component: `
# Production: Org Admin Environment

This environment simulates a **production** RBAC instance with **Org Admin** privileges.

## Environment Configuration

- **User Role**: Organization Administrator
- **Permissions**: Full RBAC access (\`rbac:*:*\`)
- **Feature Flags**:
  - \`platform.rbac.group-service-accounts\`: false (legacy)
  - \`platform.rbac.group-service-accounts.stable\`: enabled (current)
  - \`platform.rbac.workspaces\`: false

## Available User Journeys

This environment tests complete end-to-end workflows for org admins in production:

### Group Management Journeys
- **Manual Testing**: Entry point for manual exploration and debugging
- **Create Group Journey**: Create groups with service accounts (current production state)
- **Edit Group From List**: Edit group metadata from the groups list page
- **Edit Group From Detail Page**: Edit group metadata from a group's detail page
- **Delete Group From List**: Delete groups from the groups list page
- **Delete Group From Detail Page**: Delete groups from a group's detail page

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
  args: {
    initialRoute: '/iam/my-user-access',
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
## Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the Production Org Admin environment.

### Environment Configuration

This environment is pre-configured with:
- Full admin permissions
- Production feature flags
- MSW handlers for API mocking
- Mock data for groups, users, and roles

### Automated Checks

This story includes automated verification:
- ✅ My User Access page loads successfully
- ✅ Roles table is displayed with data
- ✅ Specific roles like "Administrator" are present
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

    // Verify the page loaded - look for the page title
    const pageTitle = await mainContent.findByText(/my user access/i);
    expect(pageTitle).toBeInTheDocument();

    // Verify the table is present with actual data
    const table = await mainContent.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify table has roles data (admin view)
    const tableContent = within(table);

    // Check for "Administrator" role (specific to production admin view)
    const adminRole = await tableContent.findByText(/^administrator$/i);
    expect(adminRole).toBeInTheDocument();

    // Verify at least one role row exists
    const tbody = tableContent.getAllByRole('rowgroup').find((rg) => rg.tagName === 'TBODY');
    expect(tbody).toBeInTheDocument();
    const dataRows = within(tbody!).getAllByRole('row');
    expect(dataRows.length).toBeGreaterThan(0);
  },
};

/**
 * Create Group Journey (With Service Accounts)
 *
 * Tests the full end-to-end group creation flow with service accounts step.
 * This represents the current production state with the service accounts feature enabled.
 *
 * Steps:
 * 1. Load groups list
 * 2. Click "Add group"
 * 3. Fill group name and description
 * 4. Select roles
 * 5. Select users
 * 6. Select service accounts
 * 7. Review and submit
 * 8. Verify success notification
 * 9. Verify new group appears in list
 */
export const CreateGroupJourney: Story = {
  name: 'Groups / Create new group',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.group-service-accounts': false, // OLD feature flag, DO NOT USE
      'platform.rbac.group-service-accounts.stable': true, // current feature flag, used after isBeta deprecation
    },
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: mockUsers,
        roles: mockRoles,
        serviceAccounts: mockServiceAccounts,
      }),
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click "Create group" to open wizard
    const createButton = await canvas.findByRole('button', { name: /create group/i });
    await user.click(createButton);

    // Wait for wizard to open
    await waitFor(async () => {
      const nameInput = document.getElementById('group-name');
      await expect(nameInput).toBeInTheDocument();
    });

    // Fill and submit the wizard
    await fillAddGroupWizardForm(
      {
        name: 'DevOps Team',
        description: 'DevOps team with service accounts',
        selectRoles: true,
        selectUsers: true,
        selectServiceAccounts: true,
      },
      undefined,
      false,
      user,
    );

    // Wait for wizard to close
    await waitFor(() => {
      const wizard = document.querySelector('[role="dialog"]');
      expect(wizard).not.toBeInTheDocument();
    });

    // Verify success notification
    await verifySuccessNotification();

    // CRITICAL: Verify the newly created group appears in the table
    // This tests that the cache invalidation is working correctly
    expect(await canvas.findByText('DevOps Team')).toBeInTheDocument();
  },
};

/**
 * Edit Group Journey - From Groups List
 *
 * Tests the full end-to-end group editing flow from the groups list:
 * 1. Load groups list
 * 2. Click row actions menu (kebab menu) on a group
 * 3. Click "Edit"
 * 4. Edit modal opens with group data
 * 5. Change name and description
 * 6. Click Save
 * 7. Verify success notification
 * 8. Verify updated group name in the list
 *
 * This validates:
 * - Edit action from row menu
 * - Modal pre-population with existing data
 * - PUT API operation
 * - Form validation
 * - List refresh showing updated data
 */
export const EditGroupFromList: Story = {
  name: 'Groups / Edit from list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: ENVIRONMENTS.PROD_ORG_ADMIN.msw.handlers,
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load with original unedited state
    await waitFor(async () => {
      await expect(canvas.getByText('Support Team')).toBeInTheDocument();
      expect(canvas.queryByText('Customer Support Team')).not.toBeInTheDocument();
    });

    // Open row actions menu and click Edit
    await openRowActionsMenu(user, canvas, 'Support Team');
    await clickMenuItem(user, 'Edit');

    // Fill and submit the edit modal
    await fillEditGroupModal(
      {
        name: 'Customer Support Team',
        description: 'Updated customer support access team',
      },
      true,
      user,
    );

    // Verify success and updated group name in list
    await verifySuccessNotification();
    await delay(500);
    await canvas.findByText('Customer Support Team', {}, { timeout: 10000 });
    expect(canvas.queryByText('Support Team')).not.toBeInTheDocument();
  },
};

/**
 * Edit Group Journey - From Group Detail Page
 *
 * Tests the full end-to-end group editing flow from a group's detail page:
 * 1. Navigate to group detail page - Members tab (Support Team)
 * 2. Click actions dropdown (kebab menu) in the page header
 * 3. Click "Edit" from the dropdown
 * 4. Edit modal opens with group data
 * 5. Change name and description
 * 6. Click Save
 * 7. Verify success notification
 * 8. Verify updated group name in header (stays on detail page)
 *
 * This validates:
 * - Edit action from detail page header
 * - Modal pre-population with existing data
 * - PUT API operation from detail page
 * - Page header updates after edit without navigation
 * - User stays on detail page after editing
 */
export const EditGroupFromDetailPage: Story = {
  name: 'Groups / Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: ENVIRONMENTS.PROD_ORG_ADMIN.msw.handlers,
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);

    // Wait for group detail page to load with original unedited state
    await waitFor(
      async () => {
        await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
        expect(canvas.queryByRole('heading', { name: 'Customer Support Team' })).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    ); // Increased timeout to allow for API response

    // Verify we're on the detail page
    await expect(canvas.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    await expect(canvas.getByRole('tab', { name: /members/i })).toBeInTheDocument();

    // Open detail page actions menu and click Edit
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Edit');

    // Fill and submit the edit modal
    await fillEditGroupModal(
      {
        name: 'Customer Support Team',
        description: 'Updated customer support access team',
      },
      true,
      user,
    );

    // Wait for both notification and title update (happen simultaneously)
    await Promise.all([
      verifySuccessNotification(),
      waitFor(() => {
        const updatedHeading = canvas.queryByRole('heading', { name: 'Customer Support Team' });
        expect(updatedHeading).toBeInTheDocument();
        expect(canvas.queryByRole('heading', { name: 'Support Team' })).not.toBeInTheDocument();
      }),
    ]);
  },
};

/**
 * Delete Group Journey - From Groups List
 *
 * Tests the full end-to-end group deletion flow from the groups list:
 * 1. Load groups list with existing groups
 * 2. Click row actions menu (kebab menu) on a group
 * 3. Click "Delete"
 * 4. Confirmation modal appears
 * 5. Click "Remove" to confirm
 * 6. Verify success notification
 * 7. Verify group is removed from list
 *
 * This validates:
 * - Action menu functionality
 * - Confirmation modal pattern
 * - DELETE API operation
 * - List refresh after deletion
 */
export const DeleteGroupFromList: Story = {
  name: 'Groups / Delete from list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups, // Start with existing groups
        users: mockUsers,
        roles: mockRoles,
      }),
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Open row actions menu and delete the group
    await openRowActionsMenu(user, canvas, 'Support Team');
    await clickMenuItem(user, 'Delete');
    await confirmDeleteModal(user, 'Remove group "Support Team"');

    // Verify success and group removal
    await verifySuccessNotification();
    await waitFor(() => {
      const supportTeamElement = canvas.queryByText('Support Team');
      if (supportTeamElement) {
        throw new Error('Support Team group should have been deleted but was still found');
      }
    });
  },
};

/**
 * Delete Group Journey - From Group Detail Page
 *
 * Tests the full end-to-end group deletion flow from a group's detail page:
 * 1. Navigate to group detail page - Members tab (Support Team)
 * 2. Click actions dropdown (kebab menu) in the page header
 * 3. Click "Delete" from the dropdown
 * 4. Confirmation modal appears
 * 5. Click "Remove" to confirm
 * 6. Verify success notification
 * 7. Verify redirect to groups list
 * 8. Verify group is removed from list
 *
 * This validates:
 * - Detail page header action menu functionality
 * - Navigation flow from detail page to delete modal
 * - DELETE API operation from members tab
 * - Redirect to groups list after deletion
 * - List refresh showing deleted group is gone
 */
export const DeleteGroupFromDetailPage: Story = {
  name: 'Groups / Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups, // Start with existing groups (includes group-2 = "Support Team")
        users: mockUsers,
        roles: mockRoles,
      }),
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);
    await delay(300);

    // Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
    });

    // Verify we're on the detail page and click Members tab to ensure we're on the right tab
    await expect(canvas.getByRole('tab', { name: /members/i })).toBeInTheDocument();
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(300);

    // Wait for group detail page to fully load and actions to be available
    await waitFor(async () => {
      // Look for either Actions button or kebab menu depending on group type
      const actionsButton = canvas.queryByRole('button', { name: 'Actions' });
      const kebabMenu =
        document.getElementById('group-actions-dropdown') ||
        document.querySelector('button[id*="actions-dropdown"]') ||
        document.querySelector('[data-ouia-component-id="group-title-actions-dropdown"] button');

      // At least one should be present (unless it's a default group with no actions)
      if (actionsButton || kebabMenu) {
        // Actions are available
        expect(true).toBe(true);
      } else {
        // Check if this is a default group (which might not have actions)
        const pageTitle = canvas.queryByRole('heading', { name: 'Support Team' });
        expect(pageTitle).toBeInTheDocument(); // At least the page should be loaded
      }
    });

    // Open detail page actions menu and delete the group
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Delete');
    await confirmDeleteModal(user, 'Remove group "Support Team"');

    // Verify success and redirection to groups list
    await verifySuccessNotification();
    await waitFor(async () => {
      // Should show other groups in the list
      await expect(canvas.getByText('Platform Admins')).toBeInTheDocument();
      await expect(canvas.getByText('Engineering')).toBeInTheDocument();
      // But NOT the deleted group
      expect(canvas.queryByText('Support Team')).not.toBeInTheDocument();
    });
  },
};

/**
 * Add Members to Group Journey
 *
 * Tests adding members (users) to an existing group from the group detail page.
 *
 * Steps:
 * 1. Navigate to group detail page (Members tab)
 * 2. Click "Add member" button
 * 3. Select users from modal
 * 4. Click "Add to group"
 * 5. Verify success notification
 * 6. Verify members appear in the members list
 */
export const AddMembersToGroupJourney: Story = {
  name: 'Groups / Add members',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // Override: group-2 (Support Team) starts with members EXCEPT john.doe and jane.smith
        // This way we can test adding those specific users while still having realistic data
        groupMembers: new Map([['group-2', defaultUsers.filter((u) => !['john.doe', 'jane.smith'].includes(u.username!)).slice(0, 5)]]),
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of adding members to an existing group.

**Journey Flow:**
- Loads group detail page (Support Team)
- Opens "Add member" modal
- Selects users: john.doe, jane.smith
- Confirms addition
- Verifies success notification
- Confirms members appear in list
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);
    await delay(300);

    // Step 1: Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
    });

    // Click Members tab
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(300);

    // Step 2: Click "Add member" button
    await delay(300);
    const addMemberBtn = canvas.getByRole('button', { name: /add member/i });
    await user.click(addMemberBtn);

    // Step 3-4: Fill and submit the Add Members modal (uses helper for modal interaction)
    await fillAddGroupMembersModal(user, ['john.doe', 'jane.smith']);

    // Step 5: Verify success notification (notifications are rendered at document.body level)
    // Note: There are two notifications - "Adding members" (info) and "Success adding members" (success)
    const body = within(document.body);
    await waitFor(
      async () => {
        const notification = body.getByText(/success adding members to group/i);
        await expect(notification).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Step 6: Verify members appear in the list
    await waitFor(async () => {
      await expect(canvas.getByText('john.doe')).toBeInTheDocument();
      await expect(canvas.getByText('jane.smith')).toBeInTheDocument();
    });
  },
};

/**
 * Remove Members from Group Journey
 *
 * Tests removing members (users) from an existing group.
 *
 * Steps:
 * 1. Navigate to group detail page (Members tab)
 * 2. Select member(s) to remove
 * 3. Click "Remove (#)" button
 * 4. Verify success notification
 * 5. Verify members are removed from the list
 */
export const RemoveMembersFromGroupJourney: Story = {
  name: 'Groups / Remove members',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-1 (Platform Admins) starts with john.doe and jane.smith as members
        groupMembers: new Map([['group-1', [defaultUsers[0], defaultUsers[1]]]]),
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of removing members from a group.

**Journey Flow:**
- Loads group detail page (Platform Admins)
- Selects a member to remove
- Clicks "Remove (#)" button
- Verifies success notification
- Confirms member is removed from list
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click on the "Platform Admins" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Platform Admins' });
    await user.click(groupLink);
    await delay(300);

    // Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Platform Admins' })).toBeInTheDocument();
    });

    // Click Members tab
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(300);

    // Wait for members table to load
    await delay(500);

    // Select first member checkbox
    const memberCheckboxes = canvas.getAllByRole('checkbox');
    // First checkbox is bulk select, individual row checkboxes start at index 1
    await user.click(memberCheckboxes[1]);
    await delay(300);

    // Click the bulk actions kebab menu
    const bulkActionsBtn = canvas.getByRole('button', { name: 'Member bulk actions' });
    await user.click(bulkActionsBtn);

    // Click "Remove" in the dropdown
    const removeMenuItem = within(document.body).getByRole('menuitem', { name: 'Remove' });
    await user.click(removeMenuItem);

    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
    expect(modal).toBeInTheDocument();

    const confirmRemoveBtn = within(modal).getByRole('button', { name: /remove/i });
    await user.click(confirmRemoveBtn);
    await waitFor(async () => {
      const notification = body.getByText(/success removing members from group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Verify the member is no longer in the list (table should have refreshed)
    await waitFor(async () => {
      // After removing first member (john.doe), only jane.smith should remain
      await expect(canvas.getByText('jane.smith')).toBeInTheDocument();
      expect(canvas.queryByText('john.doe')).not.toBeInTheDocument();
    });
  },
};

/**
 * Add Roles to Group Journey
 *
 * Tests adding roles to an existing group from the group detail page.
 *
 * Steps:
 * 1. Navigate to group detail page (Roles tab)
 * 2. Click "Add role" button
 * 3. Select roles from modal
 * 4. Click "Add to group"
 * 5. Verify success notification
 * 6. Verify roles appear in the roles list
 */
export const AddRolesToGroupJourney: Story = {
  name: 'Groups / Add roles',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-2 (Support Team) starts with no roles
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of adding roles to an existing group.

**Journey Flow:**
- Loads group detail page (Support Team) - Roles tab
- Opens "Add role" modal
- Selects roles: Administrator, Viewer
- Confirms addition
- Verifies success notification
- Confirms roles appear in list
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);
    await delay(300);

    // Step 1: Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(300);

    // Step 2: Wait for roles tab to fully load
    // Wait for empty state message or roles to appear (group starts with no roles)
    await waitFor(async () => {
      // Either we see the empty state or the add button
      const addRoleBtn = canvas.queryByRole('button', { name: /add role/i });
      expect(addRoleBtn).toBeInTheDocument();
    });

    // Give the page time to fetch available roles count and enable the button
    await delay(2000);

    // Button should now be enabled - click it
    await delay(300);
    const addRoleBtnToClick = canvas.getByRole('button', { name: /add role/i });
    await expect(addRoleBtnToClick).toBeEnabled();
    await user.click(addRoleBtnToClick);

    // Step 3-4: Fill and submit the Add Roles modal (uses helper for modal interaction)
    await fillAddGroupRolesModal(user, 'Support Team', 2); // Select first 2 roles

    // Step 5: Verify success notification (notifications are rendered at document.body level)
    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success adding roles to group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Step 6: Verify roles appear in the list
    await waitFor(async () => {
      await expect(canvas.getByText('Administrator')).toBeInTheDocument();
      await expect(canvas.getByText('Viewer')).toBeInTheDocument();
    });
  },
};

/**
 * Remove Roles from Group Journey
 *
 * Tests removing roles from an existing group.
 *
 * Steps:
 * 1. Navigate to group detail page (Roles tab)
 * 2. Select role(s) to remove
 * 3. Click "Remove selected" button
 * 4. Verify success notification
 * 5. Verify roles are removed from the list
 */
export const RemoveRolesFromGroupJourney: Story = {
  name: 'Groups / Remove roles',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-1 (Platform Admins) starts with Administrator and Viewer roles
        groupRoles: new Map([['group-1', [defaultRoles[0], defaultRoles[1]]]]),
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of removing roles from a group.

**Journey Flow:**
- Loads group detail page (Platform Admins) - Roles tab
- Selects a role to remove
- Clicks "Remove selected" button
- Verifies success notification
- Confirms role is removed from list
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click on the "Platform Admins" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Platform Admins' });
    await user.click(groupLink);
    await delay(300);

    // Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Platform Admins' })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(300);

    // Wait for roles tab content to load - verify roles appear
    await waitFor(async () => {
      await expect(canvas.getByText('Administrator')).toBeInTheDocument();
      await expect(canvas.getByText('Viewer')).toBeInTheDocument();
    });

    await delay(300);

    // Select first role checkbox
    const roleCheckbox = canvas.getByRole('checkbox', { name: /select row 0/i });
    await user.click(roleCheckbox);
    await delay(500);

    // Remove the selected role using the Actions dropdown
    await removeSelectedRolesFromGroup(user, canvas);

    // Verify success notification (notifications are rendered at document.body level)
    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success removing roles from group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Verify the role is removed from the list (component should refresh automatically)
    await waitFor(() => {
      // Verify Administrator is gone and only Viewer remains
      expect(canvas.queryByText('Administrator')).not.toBeInTheDocument();
      expect(canvas.queryByText('Viewer')).toBeInTheDocument();
    });
  },
};

/**
 * Create Role Journey
 *
 * Tests the full end-to-end role creation flow (simple path: create from scratch).
 *
 * Steps:
 * 1. Navigate to Roles page
 * 2. Click "Create role"
 * 3. Select "Create role from scratch"
 * 4. Enter role name
 * 5. Add permissions
 * 6. Review and submit
 * 7. Verify success screen
 * 8. Close wizard
 * 9. Verify newly created role appears in the table
 */
export const CreateRoleJourney: Story = {
  name: 'Roles / Create new role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    chrome: ENVIRONMENTS.PROD_ORG_ADMIN.chrome,
    featureFlags: ENVIRONMENTS.PROD_ORG_ADMIN.featureFlags,
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Viewer');

    // Click "Create role" button
    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(500);

    // Fill and submit the wizard
    await fillCreateRoleWizard(user, 'Automation Test Role', 'A test custom role for automation', ['insights:*:*']);

    // Verify we're back on the roles list and the new role appears
    await waitForPageToLoad(canvas, 'Viewer');

    // CRITICAL: Verify the newly created role appears in the table
    // This tests that the cache invalidation is working correctly
    await waitFor(
      () => {
        expect(canvas.getByText('Automation Test Role')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/**
 * Tests editing a role's name and description.
 *
 * Journey:
 * 1. Start on roles list
 * 2. Open kebab menu for a role
 * 3. Click "Edit"
 * 4. Update name and description
 * 5. Submit
 * 6. Verify success notification
 * 7. Verify role appears with new name in list
 */
export const EditRoleJourney: Story = {
  name: 'Roles / Edit role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of editing a role's name and description.

This story verifies:
- Role kebab menu and edit action
- Edit modal functionality
- Form validation
- PUT /api/rbac/v1/roles/:roleId API operation
- Success notification
- List refresh with updated data
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Administrator');

    // Open the kebab menu for "Custom Role" (non-system role) and click "Edit"
    await openRoleActionsMenu(user, canvas, 'Custom Role');
    await clickMenuItem(user, 'Edit');

    // Fill the edit role form
    await fillEditRoleModal(user, 'Updated Custom Role', 'Updated description for custom role');

    // Verify success notification
    await verifySuccessNotification();

    // Small delay for list to refresh
    await delay(500);

    // Verify the updated role appears in the list
    await waitFor(async () => {
      await expect(canvas.getByText('Updated Custom Role')).toBeInTheDocument();
    });
  },
};

/**
 * Tests editing a role's name and description from the role detail page.
 *
 * Journey:
 * 1. Start on role detail page
 * 2. Open Actions dropdown
 * 3. Click "Edit"
 * 4. Update name and description
 * 5. Submit
 * 6. Verify success notification
 * 7. Verify page header updates with new name
 */
export const EditRoleFromDetailPage: Story = {
  name: 'Roles / Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of editing a role from its detail page.

This story verifies:
- Role detail page Actions dropdown
- Edit modal functionality from detail page
- Form validation
- PUT /api/rbac/v1/roles/:roleId API operation
- Success notification
- Page header refresh with updated name without navigation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Custom Role');

    // Click on the "Custom Role" link to navigate to detail page
    const roleLink = canvas.getByRole('link', { name: 'Custom Role' });
    await user.click(roleLink);
    await delay(300);

    // Wait for role detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Custom Role' })).toBeInTheDocument();
    });

    // Open the Actions dropdown and click "Edit"
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Edit');

    // Fill the edit role form
    await fillEditRoleModal(user, 'Updated Custom Role', 'Updated from detail page');

    // Verify success notification and header update in parallel
    await Promise.all([
      verifySuccessNotification(),
      // Wait for the header to update
      waitFor(async () => {
        await expect(canvas.getByRole('heading', { name: 'Updated Custom Role' })).toBeInTheDocument();
      }),
    ]);
  },
};

/**
 * Tests deleting a role from the roles list.
 *
 * Journey:
 * 1. Start on roles list
 * 2. Open kebab menu for a role
 * 3. Click "Delete"
 * 4. Confirm deletion
 * 5. Verify success notification
 * 6. Verify role is removed from list
 */
export const DeleteRoleFromList: Story = {
  name: 'Roles / Delete role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of deleting a role from the roles list.

This story verifies:
- Role kebab menu and delete action
- Delete confirmation modal with checkbox
- DELETE /api/rbac/v1/roles/:roleId API operation
- Success notification
- List refresh without deleted role
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Administrator');

    // Open the kebab menu for "Custom Role" (non-system role) and click "Delete"
    await openRoleActionsMenu(user, canvas, 'Custom Role');
    await clickMenuItem(user, 'Delete');

    // Confirm deletion in modal
    await confirmDeleteRoleModal(user);

    // Verify success notification
    await verifySuccessNotification();

    // Verify the role is removed from the list
    await waitFor(() => {
      expect(canvas.queryByText('Custom Role')).not.toBeInTheDocument();
      // Administrator should still be there
      expect(canvas.getByText('Administrator')).toBeInTheDocument();
    });
  },
};

/**
 * Tests deleting a role from the role detail page.
 *
 * Journey:
 * 1. Start on role detail page
 * 2. Open Actions dropdown
 * 3. Click "Delete"
 * 4. Confirm deletion
 * 5. Verify success notification
 * 6. Verify redirect to roles list
 * 7. Verify role is removed from list
 */
export const DeleteRoleFromDetailPage: Story = {
  name: 'Roles / Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of deleting a role from its detail page.

This story verifies:
- Role detail page Actions dropdown
- Delete confirmation modal
- DELETE /api/rbac/v1/roles/:roleId API operation
- Success notification
- Redirect to roles list after deletion
- List refresh without deleted role
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Custom Role');

    // Click on the "Custom Role" link to navigate to detail page
    const roleLink = canvas.getByRole('link', { name: 'Custom Role' });
    await user.click(roleLink);
    await delay(300);

    // Wait for role detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Custom Role' })).toBeInTheDocument();
    });

    // Open the Actions dropdown and click "Delete"
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Delete');

    // Confirm deletion in modal
    await confirmDeleteRoleModal(user);

    // Verify success notification
    await verifySuccessNotification();

    // Wait for redirect to roles list
    await waitForPageToLoad(canvas, 'Administrator');

    // Verify the deleted role is not in the list
    await waitFor(() => {
      expect(canvas.queryByText('Custom Role')).not.toBeInTheDocument();
      expect(canvas.getByText('Administrator')).toBeInTheDocument();
    });
  },
};

// Helper: Navigate to a user's detail page
async function navigateToUserDetailPage(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, username: string) {
  // Navigate to Users from My User Access
  await navigateToPage(user, canvas, 'Users');

  // Wait for users list to load
  await waitForPageToLoad(canvas, username);

  // Verify status toggles are present (multiple users)
  const statusToggles = canvas.getAllByTestId('user-status-toggle');
  expect(statusToggles.length).toBeGreaterThan(0);

  // Click on the username to navigate to detail page
  const usernameLink = canvas.getByRole('link', { name: username });
  await user.click(usernameLink);
  await delay(500);

  // Wait for user detail page to load - look for the "Add user to a group" button
  await waitForPageToLoad(canvas, 'Add user to a group');
}

/**
 * Users / View user detail page
 *
 * Tests navigating to a user's detail page from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page via sidebar
 * 3. Click on a username link to open detail page
 * 4. Verify user detail page loads with user information
 * 5. Verify tabs (Groups, Roles) are present
 */
export const ViewUserDetailPageJourney: Story = {
  name: 'Users / View user detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigating to a user detail page from the users list.

**What this tests:**
- Users list rendering with all users
- Username links navigation
- User detail page loading
- User information display
- Tabs navigation (Groups, Roles)

**Covered interactions:**
- Sidebar navigation
- Table link clicks
- Page navigation
- Data loading states
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToUserDetailPage(user, canvas, 'john.doe');
  },
};

/**
 * Users / Add user to group from detail page
 *
 * Tests adding a user to groups from their detail page.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page via sidebar
 * 3. Click on a username to open detail page
 * 4. Click "Add user to a group" button
 * 5. Select groups in the modal
 * 6. Submit and verify success
 */
export const AddUserToGroupFromDetailPageJourney: Story = {
  name: 'Users / Add user to group from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests adding a user to groups from the user detail page.

**What this tests:**
- User detail page navigation
- "Add user to a group" button functionality
- Group selection modal
- Success notification

**Covered interactions:**
- Navigation through username link
- Button clicks
- Modal interaction
- Group selection
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to user detail page
    await navigateToUserDetailPage(user, canvas, 'john.doe');

    // Click "Add user to a group" button
    const addToGroupButton = await canvas.findByRole('button', { name: /add user to a group/i });
    await user.click(addToGroupButton);
    await delay(500);

    // Modal should open - find it in document body
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Wait for groups to load and select one
    const groupRow = await modalContent.findByText('Platform Admins');
    const row = groupRow.closest('tr');
    const groupCheckbox = within(row as HTMLElement).getByRole('checkbox');
    await user.click(groupCheckbox);
    await delay(200);

    // Submit - button has aria-label="Save"
    const addButton = modalContent.getByRole('button', { name: 'Save' });
    await user.click(addButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Users / Deactivate user
 *
 * Tests deactivating an active user from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page
 * 3. Select an active user
 * 4. Open kebab menu and click "Deactivate users"
 * 5. Confirm action
 * 6. Verify success notification
 */
export const DeactivateUserJourney: Story = {
  name: 'Users / Deactivate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests deactivating users from the users list.

**What this tests:**
- User selection in the table
- Kebab menu actions
- Deactivate users action
- Confirmation modal
- Success notification

**Covered interactions:**
- Table checkbox selection
- Kebab menu navigation
- Modal confirmation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users
    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, 'john.doe');

    // Select an active user (john.doe - row 0)
    const userCheckbox = canvas.getByRole('checkbox', { name: 'Select row 0' });
    await user.click(userCheckbox);
    await delay(200);

    // Open kebab menu
    const kebabButton = canvas.getByRole('button', { name: /kebab dropdown toggle/i });
    await user.click(kebabButton);
    await delay(300);

    // Click "Deactivate users" option
    await clickMenuItem(user, 'Deactivate users');
    await delay(500);

    // Modal opens - check the confirmation checkbox first
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Check the confirmation checkbox
    const confirmCheckbox = modalContent.getByRole('checkbox', { name: /yes, i confirm that i want to deactivate these users/i });
    await user.click(confirmCheckbox);
    await delay(300);

    // Now click the Deactivate button (should be enabled now)
    const deactivateButton = modalContent.getByRole('button', { name: /deactivate user/i });
    await user.click(deactivateButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Users / Activate user
 *
 * Tests activating an inactive user from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page
 * 3. Select an inactive user
 * 4. Open kebab menu and click "Activate users"
 * 5. Confirm action
 * 6. Verify success notification
 */
export const ActivateUserJourney: Story = {
  name: 'Users / Activate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests activating inactive users from the users list.

**What this tests:**
- User selection in the table
- Kebab menu actions
- Activate users action
- Confirmation modal
- Success notification

**Covered interactions:**
- Table checkbox selection
- Kebab menu navigation
- Modal confirmation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users
    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, 'john.doe');

    // Select an inactive user (bob.johnson - row 2)
    const userCheckbox = canvas.getByRole('checkbox', { name: 'Select row 2' });
    await user.click(userCheckbox);
    await delay(200);

    // Open kebab menu
    const kebabButton = canvas.getByRole('button', { name: /kebab dropdown toggle/i });
    await user.click(kebabButton);
    await delay(300);

    // Click "Activate users" option
    await clickMenuItem(user, 'Activate users');
    await delay(500);

    // Modal opens - check the confirmation checkbox first
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Check the confirmation checkbox
    const confirmCheckbox = modalContent.getByRole('checkbox', { name: /yes, i confirm that i want to add these users/i });
    await user.click(confirmCheckbox);
    await delay(300);

    // Now click the Activate button (should be enabled now)
    const activateButton = modalContent.getByRole('button', { name: /activate user/i });
    await user.click(activateButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Users / Invite users
 *
 * Tests the user invitation flow from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page
 * 3. Click "Invite users" button
 * 4. Fill in email addresses
 * 5. Optionally add a message and check org admin checkbox
 * 6. Submit the invitation
 * 7. Verify success notification
 */
export const InviteUsersJourney: Story = {
  name: 'Users / Invite users',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests inviting new users to the organization.

**What this tests:**
- Navigating to invite users modal
- Email input validation (required field)
- Optional message field
- Optional org admin checkbox
- Form submission
- Success notification

**Covered interactions:**
- Button clicks
- Text input in textarea
- Checkbox interaction
- Form submission
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users
    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, 'john.doe');

    // Click "Invite users" button
    const inviteButton = canvas.getByRole('button', { name: /invite users/i });
    await user.click(inviteButton);
    await delay(500);

    // Modal should open
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Wait for modal title (use heading role to avoid conflict with button text)
    await modalContent.findByRole('heading', { name: /invite new users/i });

    // Fill in email addresses (required field)
    const emailInput = modalContent.getByRole('textbox', { name: /enter the e-mail addresses/i });
    await user.type(emailInput, 'newuser1@example.com, newuser2@example.com');
    await delay(300);

    // Optional message field: present in some variants (e.g. common-auth). If present, fill it.
    const messageInput = modalContent.queryByRole('textbox', { name: /send a message with the invite/i });
    if (messageInput) {
      await user.type(messageInput, 'Welcome to our organization!');
      await delay(300);
    }

    // Optional org-admin checkbox. In some variants this control is not present.
    const orgAdminCheckbox = modalContent.queryByRole('checkbox', { name: /organization administrators/i });
    if (orgAdminCheckbox) {
      await user.click(orgAdminCheckbox);
      await delay(300);
    }

    // Submit the form
    const submitButton = modalContent.getByRole('button', { name: /invite new users/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await delay(500);

    // Verify success notification (InviteUsersModal uses a specific title)
    const body = within(document.body);
    await expect(body.findByText(/invitation sent successfully/i)).resolves.toBeInTheDocument();
  },
};

/**
 * Copy Default Group on First Edit - Roles Journey
 *
 * Tests the full flow of modifying the "Default access" group for the first time.
 * When a pristine default group is modified, it should:
 * 1. Show a confirmation modal
 * 2. Copy the group to "Custom default access"
 * 3. Apply changes to the copied group
 * 4. Show an alert on the detail page
 *
 * Steps:
 * 1. Navigate to "Default access" group detail page
 * 2. Click Roles tab
 * 3. Click "Add role" button
 * 4. Select a role
 * 5. Confirm addition
 * 6. Verify confirmation modal appears
 * 7. Check checkbox and click Continue
 * 8. Verify group name changed to "Custom default access"
 * 9. Verify alert appears
 */
export const CopyDefaultGroupAddRolesJourney: Story = {
  name: 'Groups / Copy default group (add roles)',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of copying "Default access" group when adding a role for the first time.

**Journey Flow:**
- Navigate to "Default access" group detail page
- Open "Add role" modal
- Select a role
- Click "Add to Group"
- **Confirmation modal appears** warning about copying
- Check confirmation checkbox
- Click "Continue"
- Verify group becomes "Custom default access"
- Verify alert shows on detail page
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Default access');

    // Click on "Default access" link
    const groupLink = canvas.getByRole('link', { name: 'Default access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Default access' })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(500);

    // Click "Add role" - wait for it to be visible and enabled (fetchAddRolesForGroup is async)
    const addRoleBtn = await waitFor(
      () => {
        const btn = canvas.getByRole('button', { name: /add role/i });
        expect(btn).toBeEnabled();
        return btn;
      },
      { timeout: 5000 },
    );
    await user.click(addRoleBtn);

    // Fill and submit the Add Roles modal (select 1 role)
    await fillAddGroupRolesModal(user, 'Default access', 1);

    // Find the warning modal by its OUIA component ID (waitFor handles the waiting)
    // The warning modal has data-ouia-component-id="WarningModal"
    let warningModal: HTMLElement | null = null;
    await waitFor(
      () => {
        const modalContainer = document.getElementById('storybook-modals') || document.body;
        const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));

        // Find the dialog with data-ouia-component-id="WarningModal"
        warningModal = (allDialogs.find((dialog) => dialog.getAttribute('data-ouia-component-id') === 'WarningModal') as HTMLElement) || null;

        expect(warningModal).not.toBeNull();
      },
      { timeout: 5000 },
    );

    // Now interact with the warning modal
    const modalContent = within(warningModal!);

    // Wait for and find the confirmation checkbox by its label
    const confirmCheckbox = await waitFor(
      () => {
        const checkbox = modalContent.getByLabelText(/I understand, and I want to continue/i);
        expect(checkbox).toBeInTheDocument();
        return checkbox;
      },
      { timeout: 5000 },
    );

    await user.click(confirmCheckbox);
    await delay(300);

    // Find and click Continue button by its OUIA ID (more reliable)
    const continueButton = await waitFor(
      () => {
        const modalContainer = document.getElementById('storybook-modals') || document.body;
        const button = modalContainer.querySelector('[data-ouia-component-id="WarningModal-confirm-button"]') as HTMLElement;
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
        return button;
      },
      { timeout: 5000 },
    );

    await user.click(continueButton);

    // Wait for the WARNING modal specifically to close (the "Add roles" modal may still be open)
    await waitFor(() => {
      const modalContainer = document.getElementById('storybook-modals') || document.body;
      const warningModals = modalContainer.querySelectorAll('[data-ouia-component-id="WarningModal"]');
      expect(warningModals.length).toBe(0);
    });

    // Verify group name changed to "Custom default access" in the heading
    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    // Verify alert appears on page
    await waitFor(() => {
      const alert = canvas.getByText(/Default access group has changed/i);
      expect(alert).toBeInTheDocument();
    });

    // NOW: Navigate to a different (non-default) group and verify NO alert shows
    // Click breadcrumb to go back to groups list
    const breadcrumbs = canvas.getByLabelText('Breadcrumb');
    const groupsBreadcrumb = within(breadcrumbs).getByRole('link', { name: 'Groups' });
    await user.click(groupsBreadcrumb);

    // Wait for groups list (waitForPageToLoad handles waiting)
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click on a regular group (Platform Admins)
    const regularGroupLink = canvas.getByRole('link', { name: 'Platform Admins' });
    await user.click(regularGroupLink);

    // Wait for the regular group detail page (waitFor handles waiting)
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Platform Admins/i })).toBeInTheDocument();
    });

    // CRITICAL: Verify the alert does NOT appear for this regular group
    await delay(500); // Give time for any alert to potentially show
    const alertOnRegularGroup = canvas.queryByText(/Default access group has changed/i);
    expect(alertOnRegularGroup).not.toBeInTheDocument();
  },
};

/**
 * No Confirmation for Already-Copied Group Journey
 *
 * Tests that once a default group has been copied, subsequent edits
 * do NOT show the confirmation modal.
 */
export const ModifyAlreadyCopiedGroupJourney: Story = {
  name: 'Groups / Modify already-copied default group (no confirmation)',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: [
          ...defaultGroups.filter((g) => g.uuid !== 'system-default'),
          // Use the actual system-default group but mark it as already modified
          {
            uuid: 'system-default',
            name: 'Custom default access',
            description: 'Modified platform default group',
            platform_default: true,
            admin_default: false,
            system: false, // Key: system=false means it's been modified
            created: '2024-01-15T10:30:00Z',
            modified: '2024-01-16T14:20:00Z',
            principalCount: 5,
            roleCount: 3,
          },
        ],
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests that modifying an already-copied "Custom default access" group does NOT show the confirmation modal.

**Journey Flow:**
- Navigate to "Custom default access" group (already copied)
- Open "Add role" modal
- Select a role
- Click "Add to Group"
- **NO confirmation modal** (direct submission)
- Verify success
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Custom default access');

    // Click on "Custom default access"
    const groupLink = canvas.getByRole('link', { name: 'Custom default access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);

    // Click "Add role" - wait for it to be visible and enabled (fetchAddRolesForGroup is async)
    const addRoleBtn = await waitFor(
      () => {
        const btn = canvas.getByRole('button', { name: /add role/i });
        expect(btn).toBeEnabled();
        return btn;
      },
      { timeout: 5000 },
    );
    await user.click(addRoleBtn);

    // Fill and submit (select 1 role)
    await fillAddGroupRolesModal(user, 'Custom default access', 1);

    // Verify success notification appears first (confirms operation completed)
    await verifySuccessNotification();

    // Verify NO confirmation modal appears - check for the warning modal specifically
    // After success notification, we can be confident the operation completed without warning modal
    const modalContainer = document.getElementById('storybook-modals') || document.body;
    const warningModal = modalContainer.querySelector('[data-ouia-component-id="WarningModal"]');

    // Should NOT see the warning modal (group is already modified, so no confirmation needed)
    expect(warningModal).toBeNull();

    // Verify the alert IS visible on the page (this is correct - shows the group has been modified)
    await waitFor(async () => {
      const alert = canvas.queryByText(/Default access group has changed/i);
      await expect(alert).toBeInTheDocument();
    });
  },
};

/**
 * Remove Roles from Already-Copied Default Group Journey
 *
 * Tests that REMOVING roles from an already-modified "Custom default access" group
 * does NOT show the confirmation modal. This is the counterpart to
 * ModifyAlreadyCopiedGroupJourney which tests adding roles.
 *
 * This test ensures the isChanged flag is correctly derived in GroupRoles.tsx:
 * - isChanged = (platform_default || admin_default) && !system
 * - For system: false, isChanged = true, so NO confirmation modal
 *
 * @see ModifyAlreadyCopiedGroupJourney - tests adding roles (same behavior expected)
 */
export const RemoveRolesFromCopiedDefaultGroupJourney: Story = {
  name: 'Groups / Remove roles from already-copied default group (no confirmation)',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: [
          ...defaultGroups.filter((g) => g.uuid !== 'system-default'),
          // Use the system-default group but mark it as already modified
          {
            uuid: 'system-default',
            name: 'Custom default access',
            description: 'Modified platform default group',
            platform_default: true,
            admin_default: false,
            system: false, // Key: system=false means it's been modified, so isChanged=true
            created: '2024-01-15T10:30:00Z',
            modified: '2024-01-16T14:20:00Z',
            principalCount: 5,
            roleCount: 2,
          },
        ],
        users: defaultUsers,
        roles: defaultRoles,
        // Pre-populate roles for the group so we can remove them
        groupRoles: new Map([['system-default', [defaultRoles[0], defaultRoles[1]]]]),
      }),
    },
    docs: {
      description: {
        story: `
Tests that REMOVING roles from an already-copied "Custom default access" group does NOT show the confirmation modal.

**Why this test matters:**
- Catches bugs where \`isChanged\` is incorrectly calculated or hardcoded
- The \`isChanged\` flag should be derived as: \`(platform_default || admin_default) && !system\`
- For \`system: false\` (already-modified), \`isChanged = true\`, so NO confirmation modal should appear

**Journey Flow:**
- Navigate to "Custom default access" group (already copied, system=false)
- Go to Roles tab
- Select a role to remove
- Click "Remove selected"
- **NO confirmation modal** (direct removal because group is already modified)
- Verify success
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Custom default access');

    // Click on "Custom default access"
    const groupLink = canvas.getByRole('link', { name: 'Custom default access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(500);

    // Wait for roles to load
    await waitFor(async () => {
      await expect(canvas.getByText('Administrator')).toBeInTheDocument();
    });

    // Select first role checkbox
    const roleCheckbox = canvas.getByRole('checkbox', { name: /select row 0/i });
    await user.click(roleCheckbox);
    await delay(300);

    // Use the helper to remove selected roles - but DON'T auto-confirm
    // because we want to check what modal appears
    await removeSelectedRolesFromGroup(user, canvas, false);

    // A WarningModal for confirming the removal should appear
    const warningModal = await within(document.body).findByRole('dialog', {}, { timeout: 5000 });
    expect(warningModal).toBeInTheDocument();

    // CRITICAL: Verify this is NOT the DefaultGroupChangeModal
    // The DefaultGroupChangeModal has a required checkbox with "I understand, and I want to continue"
    // The standard removal modal does NOT have a checkbox
    const confirmationCheckbox = within(warningModal).queryByRole('checkbox');

    // Should NOT have a checkbox (that would indicate DefaultGroupChangeModal appeared due to isChanged being incorrectly false)
    expect(confirmationCheckbox).toBeNull();

    // Click the confirm button in the warning modal
    const confirmButton = within(warningModal).getByRole('button', { name: /remove/i });
    await user.click(confirmButton);

    // Verify success notification appears (confirms operation completed)
    await verifySuccessNotification();
  },
};

/**
 * Restore Default Access Group Journey
 *
 * Tests the "Restore to default" functionality that appears when a default group
 * has been modified. This allows admins to restore the group to its original state.
 *
 * Journey Flow:
 * - Navigate to the modified "Custom default access" group
 * - Click the "Restore to default" link in the header
 * - Confirm the restoration in the warning modal
 * - Verify the group is restored to "Default access"
 */
export const RestoreDefaultGroupJourney: Story = {
  name: 'Groups / Restore default group',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: (() => {
        // Create a custom state manager for this test
        let isRestored = false;

        const baseHandlers = createStatefulHandlers({
          groups: [
            ...defaultGroups.filter((g) => g.uuid !== 'system-default'), // Remove system-default from base groups
            // Start with an already-modified default group
            {
              uuid: 'system-default',
              name: 'Custom default access',
              description: 'Modified platform default group',
              principalCount: 10,
              roleCount: 3,
              created: '2023-01-01T00:00:00Z',
              modified: '2024-01-01T00:00:00Z',
              platform_default: true,
              admin_default: false,
              system: false, // This marks it as modified
            },
          ],
          users: defaultUsers,
          roles: defaultRoles,
        });

        const restoredGroup = {
          uuid: 'system-default',
          name: 'Default access',
          description: 'Default platform group',
          principalCount: 'All users',
          roleCount: 0,
          created: '2023-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          platform_default: true,
          admin_default: false,
          system: true, // Restored to system-managed
        };

        return [
          // Override GET /api/rbac/v1/groups/system-default/ to handle restoration
          // MUST be placed BEFORE baseHandlers to intercept the request
          http.get('/api/rbac/v1/groups/system-default/', () => {
            // Return restored or modified group based on state
            return HttpResponse.json(
              isRestored
                ? restoredGroup
                : {
                    uuid: 'system-default',
                    name: 'Custom default access',
                    description: 'Modified platform default group',
                    principalCount: 10,
                    roleCount: 3,
                    created: '2023-01-01T00:00:00Z',
                    modified: '2024-01-01T00:00:00Z',
                    platform_default: true,
                    admin_default: false,
                    system: false,
                  },
            );
          }),
          // Override GET /api/rbac/v1/groups/ (groups list) to include restored group
          http.get('/api/rbac/v1/groups/', ({ request }) => {
            const url = new URL(request.url);
            const platformDefault = url.searchParams.get('platform_default');

            // If requesting platform_default groups and we're restored, return the restored group
            if (platformDefault === 'true' && isRestored) {
              return HttpResponse.json({
                data: [restoredGroup],
                meta: { count: 1, limit: 1, offset: 0 },
              });
            }

            // For the main groups list, include the restored group if restored
            // Otherwise let baseHandlers handle it
            return;
          }),
          // Mock the BULK DELETE endpoint to RESTORE the default group (not just delete)
          // This endpoint is called with ?uuids=xxx,yyy
          http.delete('/api/rbac/v1/groups/', async ({ request }) => {
            const url = new URL(request.url);
            const uuids = url.searchParams.get('uuids')?.split(',') || [];

            // If deleting system-default, it means we're restoring it
            if (uuids.includes('system-default')) {
              isRestored = true;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            return HttpResponse.json({ message: 'Groups deleted successfully' });
          }),
          // ALSO override the single-group DELETE endpoint (just in case)
          http.delete('/api/rbac/v1/groups/:groupId/', async ({ params }) => {
            const { groupId } = params;

            // If deleting system-default, it means we're restoring it
            if (groupId === 'system-default') {
              isRestored = true;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            return new HttpResponse(null, { status: 204 });
          }),
          ...baseHandlers,
        ];
      })(),
    },
    docs: {
      description: {
        story: `
Tests the "Restore to default" functionality that allows admins to revert a modified
default group back to its original system-managed state.

**Journey Flow:**
- Navigate to "Custom default access" group (modified default)
- Click "Restore to default" link in header
- Confirm restoration in warning modal
- Verify group is restored to "Default access"
- Verify alert no longer shows
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Custom default access');

    // Click on "Custom default access"
    const groupLink = canvas.getByRole('link', { name: 'Custom default access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    // Verify the "Restore to default" link is visible
    const restoreLink = await waitFor(
      () => {
        const link = canvas.getByRole('button', { name: /restore to default/i });
        expect(link).toBeInTheDocument();
        return link;
      },
      { timeout: 5000 },
    );

    // Click "Restore to default"
    await user.click(restoreLink);
    await delay(500);

    // Find the warning modal
    let warningModal: HTMLElement | null = null;
    await waitFor(
      () => {
        const modalContainer = document.getElementById('storybook-modals') || document.body;
        const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));

        // Find the dialog with the restore warning content
        warningModal =
          (allDialogs.find((dialog) => {
            const dialogContent = dialog.textContent || '';
            return dialogContent.includes('Restore Default access group');
          }) as HTMLElement) || null;

        expect(warningModal).not.toBeNull();
      },
      { timeout: 5000 },
    );

    // Interact with the warning modal
    const modalContent = within(warningModal!);

    // Verify the warning message
    expect(modalContent.getByText(/Restore Default access group/i)).toBeInTheDocument();

    // The description text contains bold tags, so we need to check for the text content differently
    // Just verify key parts of the message are present
    expect(warningModal!.textContent).toContain('Restoring Default access group');
    expect(warningModal!.textContent).toContain('Custom default access group');

    // Find and click Continue button
    const continueButton = await waitFor(
      () => {
        const btn = modalContent.getByRole('button', { name: /continue/i });
        expect(btn).toBeInTheDocument();
        expect(btn).toBeEnabled();
        return btn;
      },
      { timeout: 5000 },
    );

    await user.click(continueButton);

    // Wait for the restore warning modal specifically to close
    await waitFor(() => {
      const modalContainer = document.getElementById('storybook-modals') || document.body;
      const restoreModals = modalContainer.querySelectorAll('[role="dialog"]');
      // All modals should close after restore (no "add" modal in this flow)
      expect(restoreModals.length).toBe(0);
    });

    // Verify we're on the restored "Default access" group page
    // The page should show "Default access" instead of "Custom default access"
    await waitFor(() => {
      const heading = canvas.queryByRole('heading', { name: /^Default access$/i });
      expect(heading).toBeInTheDocument();
    });

    // Verify the "Restore to default" link is NO LONGER visible
    await waitFor(() => {
      const restoreLinkAfter = canvas.queryByRole('button', { name: /restore to default/i });
      expect(restoreLinkAfter).not.toBeInTheDocument();
    });

    // Verify the alert is NO LONGER visible
    const alert = canvas.queryByText(/Default access group has changed/i);
    expect(alert).not.toBeInTheDocument();
  },
};

/**
 * Default Admin Access - Members Tab Test
 *
 * Verifies that the "Default admin access" group shows the special card message
 * instead of a table, since all org admins are automatically members.
 */
export const DefaultAdminAccessMembersJourney: Story = {
  name: 'Groups / Default Admin Access Members Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests that the "Default admin access" group Members tab shows the special card
instead of a table, with the message about all org admins being members.

**Journey Flow:**
- Navigate to Groups
- Click on "Default admin access"
- Click on Members tab
- Verifies special card message is shown
- Verifies NO data table is present
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Default admin access');

    // Click on "Default admin access"
    const groupLink = canvas.getByRole('link', { name: 'Default admin access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /Default admin access/i })).toBeInTheDocument();
    });

    // Click Members tab
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(500);

    // Should show the special default card message
    await waitFor(() => {
      expect(canvas.getByText(/All organization administrators in this organization are members of this group/i)).toBeInTheDocument();
    });

    // Should NOT show a data table
    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};

/**
 * Default Access - Members Tab Test
 *
 * Verifies that the "Default access" (platform_default) group shows the special
 * card message about all users being members.
 */
export const DefaultAccessMembersJourney: Story = {
  name: 'Groups / Default Access Members Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests that the "Default access" group Members tab shows the special card
message about all users being members (not admin-specific message).

**Journey Flow:**
- Navigate to Groups
- Click on "Default access"
- Click on Members tab
- Verifies special card message about all users is shown
- Verifies NO data table is present
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Default access');

    // Click on "Default access"
    const groupLink = canvas.getByRole('link', { name: 'Default access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /^Default access$/i })).toBeInTheDocument();
    });

    // Click Members tab
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(500);

    // Should show the special default card message (for all users, not just org admins)
    await waitFor(() => {
      expect(canvas.getByText(/all users in this organization are members of this group/i)).toBeInTheDocument();
    });

    // Should NOT show a data table
    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();

    // Should NOT show the org admin specific message
    const adminMessage = canvas.queryByText(/All organization administrators in this organization are members of this group/i);
    expect(adminMessage).not.toBeInTheDocument();
  },
};

/**
 * Default Admin Access - Service Accounts Tab Test
 *
 * Verifies that the "Default admin access" group shows the special message
 * about service accounts not being automatically included.
 */
export const DefaultAdminAccessServiceAccountsJourney: Story = {
  name: 'Groups / Default Admin Access Service Accounts Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests that the "Default admin access" group Service Accounts tab shows the special
message about service accounts not being automatically included for security reasons.

**Journey Flow:**
- Navigate to Groups
- Click on "Default admin access"
- Click on Service Accounts tab
- Verifies special security message is shown
- Verifies NO data table is present
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Default admin access');

    // Click on "Default admin access"
    const groupLink = canvas.getByRole('link', { name: 'Default admin access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /Default admin access/i })).toBeInTheDocument();
    });

    // Click Service Accounts tab
    const serviceAccountsTab = canvas.getByRole('tab', { name: /service accounts/i });
    await user.click(serviceAccountsTab);
    await delay(500);

    // Should show the special security message
    await waitFor(() => {
      expect(
        canvas.getByText(/In adherence to security guidelines, service accounts are not automatically included in the default admin access group/i),
      ).toBeInTheDocument();
    });

    // Should NOT show a data table
    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};

/**
 * Default Access - Service Accounts Tab Test
 *
 * Verifies that the "Default access" group shows the special message
 * about service accounts not being automatically included.
 */
export const DefaultAccessServiceAccountsJourney: Story = {
  name: 'Groups / Default Access Service Accounts Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests that the "Default access" group Service Accounts tab shows the special
message about service accounts not being automatically included for security reasons.

**Journey Flow:**
- Navigate to Groups
- Click on "Default access"
- Click on Service Accounts tab
- Verifies special security message is shown
- Verifies NO data table is present
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Groups
    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Default access');

    // Click on "Default access"
    const groupLink = canvas.getByRole('link', { name: 'Default access' });
    await user.click(groupLink);
    await delay(500);

    // Wait for group detail page
    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /^Default access$/i })).toBeInTheDocument();
    });

    // Click Service Accounts tab
    const serviceAccountsTab = canvas.getByRole('tab', { name: /service accounts/i });
    await user.click(serviceAccountsTab);
    await delay(500);

    // Should show the special security message (slightly different wording from admin default)
    await waitFor(() => {
      expect(
        canvas.getByText(/In adherence to security guidelines, service accounts are not automatically included in the default access group/i),
      ).toBeInTheDocument();
    });

    // Should NOT show a data table
    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};

/**
 * Roles / Add role to group link visibility test
 *
 * Tests the logic that controls visibility of the "Add role to this group" link
 * when expanding a role to see its assigned groups.
 *
 * The link should:
 * - Show for regular groups (Platform Admins, Support Team, etc.)
 * - NOT show for the admin default group (Default admin access)
 *
 * This prevents accidental attempts to add roles to the special admin group.
 */
export const RolesAddToGroupLinkVisibility: Story = {
  name: 'Roles / Add to group link visibility',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: [...rolesAddToGroupVisibilityFixtures, ...defaultRoles],
      }),
    },
    docs: {
      description: {
        story: `
Tests the visibility logic for the "Add role to this group" link in the expanded roles view.

**Business Logic:**
- The "Add role to this group" link allows admins to navigate to add more roles to a group
- This link should NOT appear for the admin default group (Default admin access)
- The admin group is special - it grants all permissions to org admins automatically

**Test Flow:**
1. Navigate to Roles page
2. Expand "Test Role With Groups" (has 3 groups including admin group)
3. Verify "Add role to this group" link appears for "Platform Admins"
4. Verify "Add role to this group" link does NOT appear for "Default admin access"
5. Verify "Add role to this group" link appears for "Support Team"

**Bug Prevention:**
This test guards against a race condition where the link could incorrectly appear
for the admin group while the adminGroup data is still loading.
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState();

    // Navigate to Roles page
    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, 'Test Role With Groups');

    // Scope to main content area (exclude sidebar navigation)
    const mainElement = document.querySelector('main') || context.canvasElement;
    const mainContent = within(mainElement as HTMLElement);

    // Find and expand the first test role
    const testRoleLink = await mainContent.findByRole('link', { name: 'Test Role With Groups' });
    const { groupsToggle, expandedContent } = await expandRoleGroups(user, testRoleLink);

    // Wait for the expanded groups to appear - scope to expanded content
    const platformAdminsLink = await expandedContent.findByRole('link', { name: 'Platform Admins' });
    const adminAccessLink = await expandedContent.findByRole('link', { name: 'Default admin access' });
    const supportTeamLink = await expandedContent.findByRole('link', { name: 'Support Team' });

    // Verify correct number of "Add role to this group" links in expanded section
    // Should have 2 (Platform Admins and Support Team, NOT Default admin access)
    const addRoleLinks = expandedContent.queryAllByRole('link', { name: /add role to this group/i });
    expect(addRoleLinks).toHaveLength(2);

    // Verify link visibility per group using helpers
    expectAddRoleLinkHidden(getGroupRow(adminAccessLink));
    expectAddRoleLinkVisible(getGroupRow(platformAdminsLink));
    expectAddRoleLinkVisible(getGroupRow(supportTeamLink));

    // Collapse first role and expand another to verify consistent behavior
    await user.click(groupsToggle);

    // Find and expand "Another Test Role" which only has regular groups
    const anotherTestRoleLink = await mainContent.findByRole('link', { name: 'Another Test Role' });
    const { expandedContent: otherExpandedContent } = await expandRoleGroups(user, anotherTestRoleLink);

    // Verify Engineering group has the link (it's a regular group)
    const engineeringLink = await otherExpandedContent.findByRole('link', { name: 'Engineering' });
    expectAddRoleLinkVisible(getGroupRow(engineeringLink));
  },
};
