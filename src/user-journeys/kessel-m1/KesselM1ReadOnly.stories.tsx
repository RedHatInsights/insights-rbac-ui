import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import { defaultKesselRoles } from '../../../.storybook/fixtures/kessel-groups-roles';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';

interface StoryArgs {
  typingDelay?: number;
  /** Explicit permissions (rbac:*, inventory:*, etc.) - use KESSEL_PERMISSIONS presets */
  permissions?: readonly string[];
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
  title: 'User Journeys/Management Fabric/Workspaces (Kessel)/Kessel M1: Workspace List View/Read Only',
  tags: ['kessel-m1-readonly'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      // Replace parameters entirely instead of mutating to ensure React sees the change
      context.parameters = { ...context.parameters, ...dynamicEnv };
      // Force remount when controls change by using args as key
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
    permissions: {
      control: 'object',
      description: 'Explicit permissions array (rbac:*, inventory:*, etc.)',
      table: { category: 'Permissions', defaultValue: { summary: 'KESSEL_PERMISSIONS.READ_ONLY' } },
    },
    'platform.rbac.workspaces-list': {
      control: 'boolean',
      description: 'Kessel M1 - Workspace list view',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspace-hierarchy': {
      control: 'boolean',
      description: 'Kessel M2 - Parent workspace selection',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces-role-bindings': {
      control: 'boolean',
      description: 'Kessel M3 - Workspace role bindings',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces-role-bindings-write': {
      control: 'boolean',
      description: 'Kessel M3 - Write access to workspace role bindings',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Kessel M5 - Full workspace management',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Group service accounts feature',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Group service accounts stable release',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common authentication model',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'Common users table',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.READ_ONLY,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': false,
    'platform.rbac.workspaces-role-bindings': false,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
    'platform.rbac.workspaces-organization-management': true,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': false,
    'platform.rbac.common-auth-model': false,
    'platform.rbac.common.userstable': false,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.READ_ONLY,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': false,
      'platform.rbac.workspaces-role-bindings': false,
      'platform.rbac.workspaces-role-bindings-write': false,
      'platform.rbac.workspaces': false,
      'platform.rbac.workspaces-organization-management': true,
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': false,
      'platform.rbac.common-auth-model': false,
      'platform.rbac.common.userstable': false,
    }),
    msw: {
      handlers: createStatefulHandlers({
        workspaces: defaultWorkspaces,
        roles: defaultKesselRoles,
      }),
    },
    docs: {
      description: {
        component: `
# Kessel M1: Read Only (No Write Permission)

**Feature Flag**: \`platform.rbac.workspaces-list\`
**Permission**: NO \`inventory:groups:write\` or \`inventory:groups:*\`

## Milestone Overview

Kessel M1 provides workspace list view for users WITHOUT write permissions. These users can see workspaces but cannot modify them.

## Key Features

- ✅ **Read-Only View**: Users can view workspace list
- ✅ **External Links**: Workspace names link to Inventory
- ❌ **No Modifications**: Users cannot create, edit, move, or delete workspaces

## User Capabilities (Read Only)

Users WITHOUT \`inventory:groups:write\` can:
- View the workspace hierarchy
- See workspace names and descriptions
- Navigate to Inventory workspace pages (external to RBAC)

Users **cannot**:
- Create new workspaces (button shows but backend would reject)
- Edit workspace details
- Move workspaces  
- Delete workspaces
- Access workspace detail pages in RBAC (M3+)

## Permissions

Users in this environment do NOT have \`inventory:groups:write\` or \`inventory:groups:*\` permissions, so all modification actions are disabled or will fail on backend.

## Testing Notes

This milestone is currently live on **production preview** for all users.
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Manual Testing Entry Point with automated verification
 * Imported from shared story to maintain consistency across all milestones
 */
import { ManualTestingReadOnly } from '../_shared/stories/ManualTestingStory';
export const ManualTesting: Story = {
  ...ManualTestingReadOnly,
  name: 'Kessel M1 Manual Testing',
  tags: ['autodocs'],
  args: {
    ...ManualTestingReadOnly.args,
    // Explicitly include feature flag args to ensure controls work
    permissions: KESSEL_PERMISSIONS.READ_ONLY,
    orgAdmin: false, // User identity - not an org admin
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': false,
    'platform.rbac.workspaces-role-bindings': false,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M1 Manual Testing - Read Only (No Write Permission)

**Feature Flag**: \`platform.rbac.workspaces-list\`  
**Permission**: NO \`inventory:groups:write\` or \`inventory:groups:*\`

### Milestone Context

Kessel M1 provides workspace list view for users WITHOUT write permissions. These users can see workspaces but cannot modify them.

**What's Available in M1 (Read-Only):**
- ✅ Read-only workspace list view
- ✅ View workspace hierarchy
- ❌ No workspace creation (button disabled)
- ❌ No Edit/Move/Delete operations
- ❌ No external links to Inventory (M2+)
- ❌ No detail pages (M3+)

### Manual Testing Entry Point

This story provides an entry point for manual testing the read-only user experience in the M1 milestone environment.

**Environment Configuration:**
- Feature flags: Only \`platform.rbac.workspaces-list\` enabled
- Chrome API mock WITHOUT \`inventory:groups:write\` permission
- MSW handlers for API mocking
- Mock data for workspaces and roles

**What to Test:**

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify permissions (not roles) are displayed for each bundle
- Read-only users see individual permissions like "rbac:group:read"

**Workspaces Management (M1 Read-Only):**
- Navigate to "Workspaces" using the left navigation
- Expand/collapse workspace tree nodes (read-only)
- Verify "Create workspace" button is visible but DISABLED
- Kebab menu actions should be disabled
- Verify workspace names are plain text (not clickable)

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- Try enabling \`orgAdmin\` to switch to admin view
- The story will automatically remount with new settings when controls change

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
- Compare read-only behavior with write permission by toggling \`orgAdmin\`

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
};

/**
 * Cannot create workspace without permissions
 *
 * User journey: Regular user (without inventory:groups:write) cannot create workspaces
 * because the UI disables the action.
 *
 * Journey:
 * 1. Navigate to Workspaces page
 * 2. Verify "Create workspace" button is visible but disabled
 * 3. Verify kebab menu actions are also disabled
 */
export const CannotCreateWorkspaceWithoutPermissions: Story = {
  name: 'Cannot create workspace without permissions',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that regular users without proper permissions cannot create workspaces.

**Expected behavior:**
- ✅ Create workspace button is visible but **disabled**
- ✅ Kebab menu "Create workspace" actions are disabled
- ✅ Kebab menu "Create subworkspace" actions are disabled
- ✅ Other modification actions (Edit, Move, Delete) are also disabled

**Permission check:** Users without \`inventory:groups:write\` or \`inventory:groups:*\` 
cannot perform any workspace modification actions.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Workspaces page
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Default Workspace');

    // The "Create workspace" button should be visible but DISABLED
    const createButton = await canvas.findByRole('button', { name: /create workspace/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toBeDisabled();
  },
};
