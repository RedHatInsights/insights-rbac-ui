import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, resetStoryState } from '../_shared/helpers';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../../.storybook/fixtures/groups';
import { defaultUsers } from '../../../.storybook/fixtures/users';
import { defaultRoles } from '../../../.storybook/fixtures/roles';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.workspaces-organization-management'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  'platform.rbac.common.userstable'?: boolean;
  initialRoute?: string;
}

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/User Viewer',
  tags: ['prod-v2-user-viewer'],
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
    'platform.rbac.workspaces-list': {
      control: 'boolean',
      description: 'Kessel M1 - Workspace list view',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-organization-management': {
      control: 'boolean',
      description: 'V2 Navigation - Access Management layout',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.USER_VIEWER,
    orgAdmin: false,
    // V2/Management Fabric flags enabled
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': true,
    'platform.rbac.workspaces-organization-management': true,
    'platform.rbac.group-service-accounts': true,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.USER_VIEWER,
      orgAdmin: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': false,
      'platform.rbac.workspaces': true,
      'platform.rbac.workspaces-organization-management': true,
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
# Production V2: User Viewer Persona

This environment simulates a **production** V2 (Management Fabric) instance with **minimal viewer** privileges.

## Permission Configuration

| Permission | Has Access? |
|------------|-------------|
| \`rbac:principal:read\` | ✅ Yes |
| \`rbac:group:read\` | ❌ No |
| \`rbac:role:read\` | ❌ No |
| \`inventory:groups:read\` | ❌ No |
| Org Admin | ❌ No |

## V2 Navigation Context

With \`platform.rbac.workspaces-organization-management\` enabled, the navigation shows:
- Access Management → Users and User Groups, Roles, Workspaces
- Organization Management (org admin only)

## What This Tests

This validates that the V2 navigation respects the **granular permission model**:
- ✅ Can access Users tab in "Users and User Groups" page
- ❌ Gets "Access Denied" for User Groups tab (requires rbac:group:read)
- ❌ Gets "Access Denied" for Roles page
- ❌ Gets "Access Denied" for Workspaces page
- ❌ Cannot see Organization Management (not org admin)
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
  tags: ['autodocs'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Entry point for manual testing of the V2 User Viewer persona.

**Expected Sidebar:**
- My Access
- Access Management → Users and User Groups only (no Workspaces, no Roles)
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for the permissions section to render - this is the most reliable indicator the page is ready
    await expect(canvas.findByText(/your red hat enterprise linux/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
  },
};

/**
 * Sidebar validation - verify correct items visible
 */
export const SidebarValidation: Story = {
  name: 'Sidebar / Correct items visible',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that V2 User Viewer sees the correct sidebar items.

**Checks:**
- ✅ "My Access" link IS present (V2 label)
- ✅ "Access Management" expandable section IS present
- ✅ "Users and Groups" link IS present (has rbac:principal:read)
- ❌ "Workspaces" link is NOT present (no inventory:groups:read)
- ❌ "Roles" link is NOT present (no rbac:role:read)
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ✅ My Access should be visible (V2 uses "My Access" label)
    const myAccess = await canvas.findByRole('link', { name: /my access/i });
    expect(myAccess).toBeInTheDocument();

    // ✅ Access Management should be visible (has principal read permission)
    const accessMgmtSection = await canvas.findByRole('button', { name: /access management/i });
    expect(accessMgmtSection).toBeInTheDocument();

    // ✅ Users and Groups should be visible
    const usersLink = await canvas.findByRole('link', { name: /users and groups/i });
    expect(usersLink).toBeInTheDocument();

    // ❌ Workspaces should NOT be visible (no inventory:groups:read)
    const workspacesLink = canvas.queryByRole('link', { name: /workspaces/i });
    expect(workspacesLink).not.toBeInTheDocument();

    // ❌ Roles should NOT be visible (no rbac:role:read)
    const rolesLink = canvas.queryByRole('link', { name: /roles/i });
    expect(rolesLink).not.toBeInTheDocument();
  },
};

/**
 * Users Tab / Authorized Access
 *
 * Tests that User Viewer can access the Users tab in Users and User Groups page.
 */
export const UsersTabAuthorized: Story = {
  name: 'Users Tab / Authorized access',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
**KEY VALIDATION**: User Viewer with \`rbac:principal:read\` CAN access the Users tab.

The Users and User Groups page uses OR logic (\`rbac:principal:read\` OR \`rbac:group:read\`),
so a user with either permission can access the page.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Page should load (has OR permission check)
    await expect(canvas.findByRole('heading', { name: /users and (user )?groups/i })).resolves.toBeInTheDocument();

    // Users tab should be present and accessible
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toBeInTheDocument();

    // User data should be visible (using fixture data)
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
  },
};

/**
 * User Groups Tab / Access Denied
 *
 * Tests that User Viewer cannot access User Groups tab content.
 */
export const UserGroupsTabDenied: Story = {
  name: 'User Groups Tab / Access denied',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that User Viewer (only \`rbac:principal:read\`) cannot view User Groups content.

When clicking the User Groups tab, the user should see limited or no data
since they lack \`rbac:group:read\` permission.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Should NOT see group data (no rbac:group:read)
    const groupName = canvas.queryByText('Platform Admins');
    expect(groupName).not.toBeInTheDocument();
  },
};

/**
 * Roles Page / Access Denied
 *
 * Tests that User Viewer gets access denied for Roles page via direct URL.
 */
export const RolesPageDenied: Story = {
  name: 'Roles / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that:
1. Roles link is NOT in sidebar (no rbac:role:read)
2. Direct URL navigation shows access denied
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ❌ Roles link should NOT be in sidebar
    const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
    expect(rolesLink).not.toBeInTheDocument();

    // Should see access denied message (navigated via direct URL)
    const accessDenied = await canvas.findByText(/you don't have permission to view this page|unauthorized|access denied/i);
    expect(accessDenied).toBeInTheDocument();
  },
};

/**
 * Workspaces Page / Access Denied
 *
 * Tests that User Viewer gets access denied for Workspaces page via direct URL.
 */
export const WorkspacesPageDenied: Story = {
  name: 'Workspaces / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that:
1. Workspaces link is NOT in sidebar (no inventory:groups:read)
2. Direct URL navigation shows access denied
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ❌ Workspaces link should NOT be in sidebar
    const workspacesLink = canvas.queryByRole('link', { name: /workspaces/i });
    expect(workspacesLink).not.toBeInTheDocument();

    // Should see access denied message (navigated via direct URL)
    const accessDenied = await canvas.findByText(/you don't have permission to view this page|unauthorized|access denied/i);
    expect(accessDenied).toBeInTheDocument();

    // Should NOT see workspace data
    const workspaceName = canvas.queryByText('Default Workspace');
    expect(workspaceName).not.toBeInTheDocument();
  },
};
