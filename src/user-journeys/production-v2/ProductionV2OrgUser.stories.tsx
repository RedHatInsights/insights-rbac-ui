import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, navigateToPage, resetStoryState } from '../_shared/helpers';
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
  title: 'User Journeys/Production/V2 (Management Fabric)/Org User',
  tags: ['prod-v2-org-user', 'test-skip'],
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
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
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
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
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
    orgAdmin: false,
    userAccessAdministrator: false,
    // All V2/Management Fabric flags enabled, but limited write permissions
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': false, // Regular users don't have write
    'platform.rbac.workspaces': true,
    'platform.rbac.group-service-accounts': true,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: false,
      userAccessAdministrator: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': false,
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
# Production V2: Org User with Management Fabric

This environment simulates a **production** RBAC instance with **regular user** (non-admin) privileges and **V2 Management Fabric features enabled**.

## Environment Configuration

- **User Role**: Organization User (non-admin)
- **Permissions**: Read-only RBAC access
- **V2 Features Enabled**:
  - ✅ Kessel Workspaces (read-only)
  - ✅ Access Management Navigation
  - ✅ New Users and User Groups page (read-only)
  - ✅ Common Auth Model
  - ✅ New Users Table with Drawer

## Expected Behavior for Regular Users

| Feature | V1 Behavior | V2 Behavior |
|---------|-------------|-------------|
| Navigation | User Access (limited) | Access Management (visible) |
| Users | Limited view | Users tab (read-only) |
| Groups | Limited view | User Groups tab (read-only) |
| Workspaces | Not available | Visible (read-only) |
| Write Actions | Hidden | Hidden |

## Usage

Use this environment to verify that regular users see the V2 navigation but cannot perform admin actions.
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
  name: 'V2 Org User Manual Testing',
  tags: ['autodocs'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## V2 Org User Manual Testing

Entry point for exploring the Management Fabric experience as a regular (non-admin) user.

### What Regular Users Should See

**Access Management Navigation:**
- Visible but with limited functionality
- Overview, Workspaces (read-only), Users and User Groups (read-only)

**Expected Restrictions:**
- ❌ No "Create" buttons or actions
- ❌ No "Edit" or "Delete" actions
- ❌ No bulk actions
- ✅ Can view data in read-only mode
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for the page to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify My User Access page loads
    await expect(canvas.findByText(/my user access/i)).resolves.toBeInTheDocument();
  },
};

/**
 * View Users and User Groups (Read Only)
 */
export const ViewUsersAndUserGroupsReadOnly: Story = {
  name: 'View Users and User Groups (Read Only)',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users can view the V2 Users and User Groups page in read-only mode.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the page loads
    await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();

    // Verify tabs are present
    await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('tab', { name: /user groups/i })).resolves.toBeInTheDocument();

    // Regular users should NOT see "Invite users" button
    const inviteButton = canvas.queryByRole('button', { name: /invite users/i });
    expect(inviteButton).not.toBeInTheDocument();

    // Switch to User Groups tab
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(groupsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Regular users should NOT see "Create group" button
    const createGroupButton = canvas.queryByRole('button', { name: /create group/i });
    expect(createGroupButton).not.toBeInTheDocument();
  },
};

/**
 * View Workspaces (Read Only)
 */
export const ViewWorkspacesReadOnly: Story = {
  name: 'View Workspaces (Read Only)',
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users can view workspaces but cannot create, edit, or delete them.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify workspaces are visible
    await expect(canvas.findByText('Default Workspace')).resolves.toBeInTheDocument();

    // Regular users should NOT see "Create workspace" button
    const createButton = canvas.queryByRole('button', { name: /create workspace/i });
    expect(createButton).not.toBeInTheDocument();
  },
};

/**
 * Navigate V2 Sidebar (Limited Access)
 */
export const NavigateV2SidebarLimitedAccess: Story = {
  name: 'Navigate V2 Sidebar (Limited Access)',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users can navigate the V2 sidebar but with appropriate restrictions.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to Overview (should work)
    await navigateToPage(user, canvas, 'Overview');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to Users and User Groups (should work, read-only)
    await navigateToPage(user, canvas, 'Users and User Groups');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();

    // Navigate to Workspaces (should work, read-only)
    await navigateToPage(user, canvas, 'Workspaces');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify no admin actions are available
    const createButton = canvas.queryByRole('button', { name: /create workspace/i });
    expect(createButton).not.toBeInTheDocument();
  },
};
