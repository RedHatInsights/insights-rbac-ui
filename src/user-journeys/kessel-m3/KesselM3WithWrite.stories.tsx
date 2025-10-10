import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { expandWorkspaceRow, navigateToPage, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import {
  defaultKesselGroupMembers,
  defaultKesselGroupRoles,
  defaultKesselGroups,
  defaultKesselRoles,
} from '../../../.storybook/fixtures/kessel-groups-roles';
import { workspaceRoleBindings } from '../../../.storybook/fixtures/workspace-role-bindings';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { delay } from 'msw';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Kessel M3/With Write Permission',
  tags: ['kessel-m3-write', 'test-skip'],
  decorators: [
    (Story: any, context: any) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      // Replace parameters entirely instead of mutating to ensure React sees the change
      context.parameters = { ...context.parameters, ...dynamicEnv };
      // Force remount when controls change by using args as key
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
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
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': false,
    'platform.rbac.common-auth-model': false,
    'platform.rbac.common.userstable': false,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      userAccessAdministrator: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': false,
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': false,
      'platform.rbac.common-auth-model': false,
      'platform.rbac.common.userstable': false,
    }),
    msw: {
      handlers: createStatefulHandlers({
        workspaces: defaultWorkspaces,
        groups: defaultKesselGroups,
        roles: defaultKesselRoles,
        groupMembers: defaultKesselGroupMembers,
        groupRoles: defaultKesselGroupRoles,
        workspaceRoleBindings,
      }),
    },
    docs: {
      description: {
        component: `
# Kessel M3: With Write Permission

**Feature Flags**: \`platform.rbac.workspaces-list\` + \`platform.rbac.workspace-hierarchy\` + \`platform.rbac.workspaces-role-bindings\`  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

## Milestone Overview

Kessel M3 adds **workspace detail pages within RBAC** with a **Roles tab** for viewing role bindings. This is a major change: workspace names now link to RBAC detail pages instead of Inventory.

## Key Features

- ✅ **Workspace List**: View all workspaces in tree structure (from M1)
- ✅ **Workspace Hierarchy**: Full CRUD operations from M2
  - Create workspace with parent selection
  - Create subworkspace
  - Move workspace
  - Edit workspace (name/description)
  - Delete workspace (leaf nodes only)
- ✅ **Workspace Detail Pages**: Click workspace name to see detail page **in RBAC**
  - Previously linked to Inventory (M1-M2)
  - Now links to RBAC detail page
  - URL format: \`/iam/user-access/workspaces/detail/:id\`
- ✅ **Roles Tab**: View role bindings (read-only in M3)
  - **Default tab** when opening workspace details
  - Sub-tabs: "Roles assigned in this workspace" and "Roles assigned in parent workspaces"
  - View principals and their role assignments
- ✅ **Assets Tab**: View assets associated with workspace
  - Shows Inventory hosts/groups linked to workspace
- ❌ **No Role Bindings Write**: Cannot modify role assignments until M4

## User Capabilities (With Write Permission)

Users with \`inventory:groups:write\` permission can:
- View workspace details in RBAC UI
- Navigate between Roles and Assets tabs
- View role bindings assigned to the workspace (read-only)
- View role bindings inherited from parent workspaces
- All M2 capabilities: create, edit, move, delete workspaces

## What's Coming Next

- **M4**: Role bindings write access (modify workspace role assignments)
- **M5**: Full feature set with master flag

## Testing Notes

This milestone introduces RBAC detail pages. The Roles tab is read-only; write access comes in M4.
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
import { ManualTestingWithWrite } from '../_shared/stories/ManualTestingStory';
export const ManualTesting: Story = {
  ...ManualTestingWithWrite,
  name: 'Manual Testing',
  args: {
    ...ManualTestingWithWrite.args,
    // Explicitly include feature flag args to ensure controls work
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
  },
};

/**
 * Workspaces / View workspace detail with Roles tab
 *
 * Tests that an admin can view workspace detail and switch to Roles tab.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Workspaces via sidebar
 * 3. Click on a workspace name
 * 4. Verify detail page loads
 * 5. Switch to Roles tab
 * 6. Verify roles tab content
 */
export const ViewWorkspaceDetailWithRoles: Story = {
  name: 'Workspaces / View workspace detail with Roles tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that admins can view workspace detail pages with Roles tab in Kessel M3.

**What this tests:**
- Navigation to Workspaces page
- Clicking workspace name opens detail page
- Detail page shows workspace information
- Tabs are present (Assets, Roles)
- Roles tab is accessible and shows role bindings

**Expected UI:**
- Workspace detail page with name and description
- Tabs for "Assets" and "Roles"
- Roles tab shows role bindings table
- Back button or breadcrumb navigation

**Note:** With M3, workspace names link to RBAC detail pages instead of Inventory.
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

    // Expand Default Workspace to see Production
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Click on "Production" workspace to view detail
    // In M3, this should link to RBAC detail page, not Inventory
    const productionLink = await canvas.findByRole('link', { name: /^production$/i });
    await user.click(productionLink);
    await delay(1000);

    // Verify we're on the detail page with Roles tab
    // Check the URL has activeTab=roles
    const addressBar = canvas.getByTestId('fake-address-bar');
    expect(addressBar).toHaveTextContent(/activeTab=roles/i);

    // Verify both tabs exist
    const assetsTab = await canvas.findByRole('tab', { name: /^assets$/i });
    expect(assetsTab).toBeInTheDocument();

    // Verify the Roles tab shows role assignment data
    // Should see the sub-tabs for "Roles assigned in this workspace" and "Roles assigned in parent workspaces"
    await canvas.findByText(/roles assigned in this workspace/i);
    await canvas.findByText(/roles assigned in parent workspaces/i);

    // Verify the role assignments table shows workspace-specific groups
    // Production workspace should show only Production Admins and Viewers
    await canvas.findByText('Production Admins');
    await canvas.findByText('Viewers');

    // Development Team should NOT appear (it's assigned to ws-2)
    expect(canvas.queryByText('Development Team')).not.toBeInTheDocument();

    // Click on a group name (the row is clickable) to open the drawer
    const productionAdminsText = await canvas.findByText('Production Admins');
    await user.click(productionAdminsText);
    await delay(500);

    // Verify the drawer opens - scope queries to the drawer panel
    await delay(300); // Wait for drawer animation
    const drawerPanel = document.querySelector('.pf-v5-c-drawer__panel') as HTMLElement;
    expect(drawerPanel).toBeInTheDocument();
    const drawer = within(drawerPanel);

    // Verify drawer title
    await drawer.findByRole('heading', { name: 'Production Admins' });

    // Verify drawer tabs exist
    const rolesTab = await drawer.findByRole('tab', { name: /^roles$/i });
    const usersTab = await drawer.findByRole('tab', { name: /^users$/i });
    expect(rolesTab).toBeInTheDocument();
    expect(usersTab).toBeInTheDocument();

    // Verify Roles tab shows mock data (default active tab)
    await drawer.findByText('Workspace Administrator');
    await drawer.findByText('Workspace Viewer');

    // Switch to Users tab
    await user.click(usersTab);
    await delay(300);

    // Verify Users tab shows mock members
    await drawer.findByText('john.doe');
    await drawer.findByText('Jane');
    await drawer.findByText('Wilson');

    // Switch to "Roles assigned in parent workspaces" tab
    // The drawer should automatically close when switching tabs
    const parentWorkspacesTab = await canvas.findByRole('tab', { name: /roles assigned in parent workspaces/i });
    await user.click(parentWorkspacesTab);
    await delay(500);

    // Verify the drawer is closed (component unmounted)
    const drawerAfterSwitch = document.querySelector('.pf-v5-c-drawer__panel');
    expect(drawerAfterSwitch).not.toBeInTheDocument();

    // Verify parent workspace role bindings (inherited from Default Workspace/root-1)
    // Should show Viewers group from root workspace
    const viewersText = await canvas.findByText('Viewers');

    // Production Admins should NOT appear in parent tab (it's only in ws-1)
    expect(canvas.queryByText('Production Admins')).not.toBeInTheDocument();

    // Click on Viewers group to open drawer and verify its details
    await user.click(viewersText);
    await delay(500);

    // Verify the drawer opens for Viewers group
    const viewersDrawerPanel = document.querySelector('.pf-v5-c-drawer__panel') as HTMLElement;
    expect(viewersDrawerPanel).toBeInTheDocument();
    const viewersDrawer = within(viewersDrawerPanel);

    // Verify drawer title
    await viewersDrawer.findByRole('heading', { name: 'Viewers' });

    // Verify drawer tabs exist
    const viewersRolesTab = await viewersDrawer.findByRole('tab', { name: /^roles$/i });
    const viewersUsersTab = await viewersDrawer.findByRole('tab', { name: /^users$/i });
    expect(viewersRolesTab).toBeInTheDocument();
    expect(viewersUsersTab).toBeInTheDocument();

    // Verify Roles tab shows mock data (Workspace Viewer role)
    await viewersDrawer.findByText('Workspace Viewer');

    // Switch to Users tab
    await user.click(viewersUsersTab);
    await delay(300);

    // Verify Users tab shows mock member
    await viewersDrawer.findByText('viewer.user');
    await viewersDrawer.findByText('Viewer');
    await viewersDrawer.findByText('User');
  },
};
