import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, within } from 'storybook/test';
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
  initialRoute?: string;
}

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org User',
  tags: ['prod-v2-org-user', 'test-skip'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      const dynamicEnv = createDynamicEnvironment({
        ...context.args,
        permissions: KESSEL_PERMISSIONS.NONE, // No RBAC permissions
        'platform.rbac.workspaces-organization-management': true,
      });
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
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: false,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.NONE, // No RBAC permissions
      orgAdmin: false,
      'platform.rbac.workspaces-organization-management': true, // V2 Navigation
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
# Production V2: Org User Persona

This environment simulates a **regular user** with **NO RBAC permissions** in V2 navigation.

## Permission Configuration

- **Permissions**: \`[]\` (empty - no RBAC permissions)
- **Org Admin**: false
- **Feature Flags**: V2 navigation (workspaces-organization-management: true)

## Expected Sidebar

- ✅ My Access (visible, V2 label)
- ❌ Access Management section (NOT visible - requires rbac permissions)

## User Journeys

### What Regular Users Can Do
- View their own access via "My Access" page

### What Regular Users CANNOT Do
- Access Users, Groups, Workspaces, or Roles pages (no sidebar link, unauthorized if direct URL)
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
Entry point for manual testing of the V2 Org User persona.

**Expected:** Only "My Access" in sidebar - NO "Access Management" section.
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
 * Sidebar validation - verify Access Management is NOT visible
 */
export const SidebarValidation: Story = {
  name: 'Sidebar / Only My Access visible',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that V2 Org User (no permissions) only sees "My Access" in the sidebar.

**Checks:**
- ✅ "My Access" link IS present (V2 label)
- ❌ "Access Management" expandable section is NOT present
- ❌ "Users and Groups" link is NOT present
- ❌ "Workspaces" link is NOT present
- ❌ "Roles" link is NOT present
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

    // ❌ Access Management expandable should NOT be visible (no permissions)
    const accessMgmtSection = canvas.queryByRole('button', { name: /access management/i });
    expect(accessMgmtSection).not.toBeInTheDocument();

    // ❌ V2 navigation items should NOT be visible
    const usersLink = canvas.queryByRole('link', { name: /users and groups/i });
    expect(usersLink).not.toBeInTheDocument();

    const workspacesLink = canvas.queryByRole('link', { name: /workspaces/i });
    expect(workspacesLink).not.toBeInTheDocument();

    const rolesLink = canvas.queryByRole('link', { name: /roles/i });
    expect(rolesLink).not.toBeInTheDocument();
  },
};

/**
 * Direct navigation to Users and Groups - should show unauthorized
 */
export const UsersAndUserGroupsUnauthorized: Story = {
  name: 'Users and Groups / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Users and Groups shows unauthorized.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Should show unauthorized
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
  },
};

/**
 * Direct navigation to Workspaces - should show unauthorized
 */
export const WorkspacesUnauthorized: Story = {
  name: 'Workspaces / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Workspaces shows unauthorized.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Should show unauthorized
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
  },
};

/**
 * Direct navigation to Roles - should show unauthorized
 */
export const RolesUnauthorized: Story = {
  name: 'Roles / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Roles shows unauthorized.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Should show unauthorized
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
  },
};
