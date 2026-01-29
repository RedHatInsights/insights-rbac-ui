import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, navigateToPage, resetStoryState, verifySuccessNotification, waitForPageToLoad } from '../_shared/helpers';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../../.storybook/fixtures/groups';
import { defaultUsers } from '../../../.storybook/fixtures/users';
import { defaultRoles } from '../../../.storybook/fixtures/roles';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  'platform.rbac.common.userstable'?: boolean;
  initialRoute?: string;
}

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin',
  tags: ['prod-v2-org-admin', 'test-skip'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    }) as Decorator<StoryArgs>,
  ],
  argTypes: {
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator',
      table: { category: 'Permissions', defaultValue: { summary: 'true' } },
    },
    userAccessAdministrator: {
      control: 'boolean',
      description: 'User Access Administrator',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces-list': {
      control: 'boolean',
      description: 'Kessel M1 - Workspace list view',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspace-hierarchy': {
      control: 'boolean',
      description: 'Kessel M2 - Parent workspace selection',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-role-bindings': {
      control: 'boolean',
      description: 'Kessel M3 - Workspace role bindings',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-role-bindings-write': {
      control: 'boolean',
      description: 'Kessel M4 - Write access to workspace role bindings',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Kessel M5 - Full workspace management',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Group service accounts feature',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Group service accounts stable release',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common authentication model',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'New unified users table with drawer',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    userAccessAdministrator: false,
    // All V2/Management Fabric flags enabled
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': true,
    'platform.rbac.group-service-accounts': true,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      userAccessAdministrator: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': true,
      'platform.rbac.workspaces': true,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common.userstable': true,
    }),
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        workspaces: defaultWorkspaces,
      }),
    },
    docs: {
      description: {
        component: `
# Production V2: Org Admin with Management Fabric

This environment simulates a **production** RBAC instance with **Org Admin** privileges and **all Management Fabric features enabled**.

## Environment Configuration

- **User Role**: Organization Administrator
- **Permissions**: Full RBAC access (\`rbac:*:*\`)
- **V2 Features Enabled**:
  - ✅ Kessel Workspaces (M1-M5)
  - ✅ Access Management Navigation
  - ✅ New Users and User Groups page
  - ✅ Common Auth Model
  - ✅ New Users Table with Drawer

## What's Different from V1

| Feature | V1 | V2 |
|---------|----|----|
| Navigation | User Access | Access Management |
| Users Page | Separate Users page | Users and User Groups (tabbed) |
| Groups Page | Separate Groups page | User Groups tab |
| Workspaces | Not available | Full workspace management |
| Users Table | Legacy table | New table with drawer |

## Usage

Use this environment to test the full Management Fabric experience as an org admin.
Toggle individual V2 flags in the Controls panel to test partial rollouts.
        `,
      },
    },
  },
};

export default meta;

/**
 * Manual Testing Entry Point
 */
export const ManualTesting: Story = {
  name: 'V2 Org Admin Manual Testing',
  tags: ['autodocs'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## V2 Org Admin Manual Testing

Entry point for exploring the full Management Fabric experience as an org admin.

### New V2 Features to Test

**Access Management Navigation:**
- New sidebar with "Access Management" expandable section
- Overview, Workspaces, Users and User Groups, Roles

**Users and User Groups:**
- New unified page at /iam/access-management/users-and-user-groups
- Tabbed interface (Users | User Groups)
- New Users table with details drawer
- New User Groups table with details drawer

**Workspaces:**
- Full workspace management (create, edit, move, delete)
- Workspace detail pages with role bindings

### Controls

Use the Controls panel to:
- Toggle individual V2 flags to test partial rollouts
- Switch between admin and user permissions
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for the page to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the V2 Users and User Groups page loads
    await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();

    // Verify tabs are present
    await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('tab', { name: /user groups/i })).resolves.toBeInTheDocument();
  },
};

/**
 * Navigate the V2 sidebar
 */
export const NavigateV2Sidebar: Story = {
  name: 'Navigate V2 Sidebar',
  args: {
    initialRoute: '/iam/access-management/overview',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigation through all V2 Access Management sidebar items.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to Users and User Groups
    await navigateToPage(user, canvas, 'Users and User Groups');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();

    // Navigate to Workspaces
    await navigateToPage(user, canvas, 'Workspaces');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await expect(canvas.findByText('Default Workspace')).resolves.toBeInTheDocument();

    // Navigate back to Overview
    await navigateToPage(user, canvas, 'Overview');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
  },
};

/**
 * Users and User Groups - Full Flow
 */
export const UsersAndUserGroupsFlow: Story = {
  name: 'Users and User Groups Flow',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the new Users and User Groups page functionality.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify Users tab is active
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Switch to User Groups tab
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(groupsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify User Groups tab is now active
    expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Users
    await user.click(usersTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    expect(usersTab).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Workspaces with Full Features
 */
export const WorkspacesFullFeatures: Story = {
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests workspace management with all M5 features enabled.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for workspaces to load
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Verify create button is enabled (M5 features)
    const createButton = await canvas.findByRole('button', { name: /create workspace/i });
    expect(createButton).toBeEnabled();
  },
};

// API spy for invite users - tracks API calls made by the invite modal
const inviteUsersSpyV2 = fn();

// Expected URL pattern for invite users API (stage environment in tests)
// Format: https://api.access.stage.redhat.com/account/v1/accounts/{accountId}/users/invite
const EXPECTED_INVITE_URL_PATTERN_V2 = /^https:\/\/api\.access\.(stage\.)?redhat\.com\/account\/v1\/accounts\/\d+\/users\/invite$/;

/**
 * Users / Invite users (V2)
 *
 * Tests the user invitation flow from the V2 Users and User Groups page.
 * CRITICAL: Also verifies the correct API URL is called (regression test for /management bug).
 *
 * Journey:
 * 1. Start on V2 Users and User Groups page (Users tab)
 * 2. Click "Invite users" button
 * 3. Fill in email addresses
 * 4. Optionally add a message and check org admin checkbox
 * 5. Submit the invitation
 * 6. Verify success notification
 * 7. Verify API was called with exact expected URL format
 */
export const InviteUsersJourney: Story = {
  name: 'Users / Invite users',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests inviting new users to the organization from the V2 interface.

**What this tests:**
- Navigating to invite users modal from V2 Users tab
- Email input validation (required field)
- Optional message field
- Optional org admin checkbox
- Form submission
- Success notification
- **API URL verification** - ensures the exact URL format is correct (regression test)

**Expected API URL format:**
\`https://api.access.stage.redhat.com/account/v1/accounts/{accountId}/users/invite\`

**NOT:**
\`https://api.access.stage.redhat.com/management/account/v1/accounts/{accountId}/users/invite\`
        `,
      },
    },
    msw: {
      handlers: [
        // Intercept ALL calls to the invite endpoint (both correct and incorrect URLs)
        http.post(/https:\/\/api\.access\.(stage\.)?redhat\.com\/(management\/)?account\/v1\/accounts\/.*\/users\/invite/, async ({ request }) => {
          const body = (await request.json()) as { emails: string[]; roles?: string[]; message?: string };

          // Record the exact URL that was called
          inviteUsersSpyV2({
            url: request.url,
            emails: body.emails,
            roles: body.roles,
          });

          return HttpResponse.json({ success: true }, { status: 200 });
        }),
        ...createStatefulHandlers({
          groups: defaultGroups,
          users: defaultUsers,
          roles: defaultRoles,
          workspaces: defaultWorkspaces,
        }),
      ],
    },
  },
  play: async (context) => {
    await resetStoryState();
    inviteUsersSpyV2.mockClear();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for the V2 Users tab to load
    await delay(500);

    // Verify we're on the Users tab
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Wait for users to load
    await waitForPageToLoad(canvas, 'john.doe');

    // Click "Invite users" button
    const inviteButton = await canvas.findByRole('button', { name: /invite users/i });
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

    // Optionally add a message
    const messageInput = modalContent.getByRole('textbox', { name: /send a message with the invite/i });
    await user.type(messageInput, 'Welcome to our organization!');
    await delay(300);

    // Check the org admin checkbox
    const orgAdminCheckbox = modalContent.getByRole('checkbox', { name: /organization administrators/i });
    await user.click(orgAdminCheckbox);
    await delay(300);

    // Submit the form
    const submitButton = modalContent.getByRole('button', { name: /invite new users/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await delay(500);

    // Verify success notification
    await verifySuccessNotification();

    // CRITICAL: Verify API was called
    await waitFor(
      () => {
        expect(inviteUsersSpyV2).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );

    // Verify the API call details
    const spyCall = inviteUsersSpyV2.mock.calls[0][0];
    expect(spyCall).toBeDefined();

    // CRITICAL: Verify the URL matches the exact expected format
    // Should be: https://api.access.stage.redhat.com/account/v1/accounts/{accountId}/users/invite
    // Should NOT be: https://api.access.stage.redhat.com/management/account/v1/...
    expect(spyCall.url).toMatch(EXPECTED_INVITE_URL_PATTERN_V2);

    // Verify correct data was sent
    expect(spyCall.emails).toContain('newuser1@example.com');
    expect(spyCall.emails).toContain('newuser2@example.com');

    // Verify org admin role was included (checkbox was checked)
    expect(spyCall.roles).toContain('organization_administrator');
  },
};
