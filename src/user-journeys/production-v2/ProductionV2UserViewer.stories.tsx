import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, resetStoryState } from '../_shared/helpers';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { defaultV2Seed } from '../../v2/data/mocks/seed';

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
  initialRoute?: string;
}

const db = createV2MockDb(defaultV2Seed());
const mswHandlers = createV2Handlers(db);

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/User Viewer',
  tags: ['prod-v2-user-viewer'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      db.reset();
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
    }),
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: 'Minimal viewer with rbac:principal:read only. See the Documentation page for full details.',
      },
    },
  },
};

export default meta;

/**
 * Manual Testing Entry Point
 */
export const ManualTesting: Story = {
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
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
    await resetStoryState(db);
    const canvas = within(context.canvasElement);

    // User Viewer has rbac:principal:read - can access Users tab; wait for page heading (h1 to avoid multiple matches)
    const heading = await canvas.findByRole(
      'heading',
      {
        level: 1,
        name: /users and (user )?groups/i,
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
    expect(heading).toBeInTheDocument();
  },
};

/**
 * Sidebar validation - verify correct items visible
 */
export const SidebarValidation: Story = {
  name: 'Correct items visible',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
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
    await resetStoryState(db);
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
  name: 'Authorized access (Users Tab)',
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
    await resetStoryState(db);
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
  name: 'Access denied (User Groups Tab)',
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
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Should NOT see group data in table (no rbac:group:read) - may see Access denied or empty state
    const table = canvas.queryByRole('grid', { name: /user groups/i });
    if (table) {
      const groupName = within(table).queryByText('Platform Admins');
      expect(groupName).not.toBeInTheDocument();
    }
  },
};

/**
 * Roles Page / Access Denied
 *
 * Tests that User Viewer gets access denied for Roles page via direct URL.
 */
export const RolesPageDenied: Story = {
  name: 'Direct URL - Unauthorized (Roles)',
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
    await resetStoryState(db);
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
  name: 'Direct URL - Unauthorized (Workspaces)',
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
    await resetStoryState(db);
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ❌ Workspaces link should NOT be in sidebar
    const workspacesLink = canvas.queryByRole('link', { name: /workspaces/i });
    expect(workspacesLink).not.toBeInTheDocument();

    // Should see access denied message (navigated via direct URL)
    const accessDenied = await canvas.findByText(/you don't have permission to view this page|unauthorized|access denied/i);
    expect(accessDenied).toBeInTheDocument();

    // Should NOT see workspace data
    const workspaceName = canvas.queryByText('Root Workspace');
    expect(workspaceName).not.toBeInTheDocument();
  },
};
