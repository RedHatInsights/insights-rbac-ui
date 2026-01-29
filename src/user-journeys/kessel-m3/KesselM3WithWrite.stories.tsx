import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, expandWorkspaceRow, navigateToPage, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
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
  title: 'User Journeys/Management Fabric/Workspaces (Kessel)/Kessel M3: RBAC Detail Pages/With Write Permission',
  tags: ['kessel-m3-write'],
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
    'platform.rbac.workspaces-organization-management': true,
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
      'platform.rbac.workspaces-organization-management': true,
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
  name: 'Kessel M3 Manual Testing',
  tags: ['autodocs'],
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
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M3 Manual Testing - With Write Permission

**Feature Flags**: \`platform.rbac.workspaces-list\` + \`platform.rbac.workspace-hierarchy\` + \`platform.rbac.workspaces-role-bindings\`  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

### Milestone Context

Kessel M3 adds **workspace detail pages within RBAC** with a **Roles tab** for viewing role bindings. This is a major change: workspace names now link to RBAC detail pages instead of Inventory.

**What's Available in M3:**
- ✅ All M1 features (workspace list view)
- ✅ All M2 features (workspace hierarchy management)
- ✅ Workspace detail pages in RBAC UI
- ✅ Roles tab with sub-tabs:
  - "Roles assigned in this workspace" (direct assignments)
  - "Roles assigned in parent workspaces" (inherited assignments)
- ✅ Assets tab (view hosts/groups linked to workspace)
- ✅ View role bindings (read-only)
- ✅ Group drawer with roles and users tabs
- ✅ Workspace names now link to RBAC (not Inventory)
- ❌ No role bindings write access (M4+)

### Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the RBAC UI in the M3 milestone environment.

**Environment Configuration:**
- Feature flags: M1 + M2 + M3 (\`workspaces-role-bindings\`)
- Chrome API mock with \`inventory:groups:write\` permission
- MSW handlers for API mocking
- Mock data for workspaces, groups, roles, and role bindings

**What to Test:**

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify roles are displayed for each bundle
- Check that data is accurate and loads correctly

**Workspaces Management (M3 Features):**
- Navigate to "Workspaces" using the left navigation
- All M2 CRUD operations still available (Create, Edit, Move, Delete)
- **Workspace Detail Pages**: Click workspace name
  - Should navigate to RBAC detail page (NOT Inventory)
  - URL format: \`/iam/user-access/workspaces/detail/:id?activeTab=roles\`
  - Roles tab opens by default
- **Roles Tab (Read-Only)**: View role bindings
  - Switch between "Roles assigned in this workspace" and "Roles assigned in parent workspaces"
  - Click on group name to open drawer
  - Drawer shows group details with Roles and Users tabs
  - Verify correct data for each workspace
- **Assets Tab**: View Inventory hosts/groups
  - Click "Assets" tab to see associated resources

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- Try enabling \`platform.rbac.workspaces-role-bindings-write\` to see M4 features
- The story will automatically remount with new settings when controls change

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
- Compare M3 behavior with M2 (workspace links to RBAC vs Inventory)

### Automated Checks

This story includes automated verification:
- ✅ My User Access page loads successfully
- ✅ Roles table is displayed with data
- ✅ Specific roles like "Workspace Administrator" are present
- ✅ Navigation works correctly
        `,
      },
    },
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

    // Verify we're on the detail page with Roles tab (waitFor handles navigation timing)
    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/activeTab=roles/i);
    });

    // Verify both tabs exist
    const assetsTab = await canvas.findByRole('tab', { name: /^assets$/i });
    expect(assetsTab).toBeInTheDocument();

    // Verify the Roles tab shows role assignment data
    // Should see the sub-tabs for "Roles assigned in this workspace" and "Roles assigned in parent workspaces"
    await canvas.findByText(/roles assigned in this workspace/i);
    await canvas.findByText(/roles assigned in parent workspaces/i);

    // Verify the role assignments table shows workspace-specific groups
    // Production workspace should show only Production Admins and Viewers
    // Wait for the table to load completely with data
    await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // Wait for data to load - look for either loading state to disappear or data to appear
    await waitFor(
      async () => {
        const loadingElements = canvas.queryAllByText(/loading/i);
        const hasData = canvas.queryByText('Production Admins') || canvas.queryByText('Viewers');
        expect(loadingElements.length === 0 || hasData).toBe(true);
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    // The table should now have data loaded
    await canvas.findByText('Production Admins');
    await canvas.findByText('Viewers');

    // Development Team should NOT appear (it's assigned to ws-2)
    expect(canvas.queryByText('Development Team')).not.toBeInTheDocument();

    // Click on a group name (the row is clickable) to open the drawer
    const productionAdminsText = await canvas.findByText('Production Admins');
    await user.click(productionAdminsText);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the drawer opens - scope queries to the drawer panel
    await delay(TEST_TIMEOUTS.AFTER_CLICK); // Wait for drawer animation
    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
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
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify Users tab shows mock members
    await drawer.findByText('john.doe');
    await drawer.findByText('Jane');
    await drawer.findByText('Wilson');

    // Switch to "Roles assigned in parent workspaces" tab
    // The drawer should automatically close when switching tabs
    const parentWorkspacesTab = await canvas.findByRole('tab', { name: /roles assigned in parent workspaces/i });
    await user.click(parentWorkspacesTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the drawer is closed (component unmounted)
    const drawerAfterSwitch = document.querySelector('.pf-v6-c-drawer__panel');
    expect(drawerAfterSwitch).not.toBeInTheDocument();

    // Verify parent workspace role bindings (inherited from Default Workspace/root-1)
    // Should show Viewers group from root workspace
    const viewersText = await canvas.findByText('Viewers');

    // Production Admins should NOT appear in parent tab (it's only in ws-1)
    expect(canvas.queryByText('Production Admins')).not.toBeInTheDocument();

    // Click on Viewers group to open drawer and verify its details
    await user.click(viewersText);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the drawer opens for Viewers group
    const viewersDrawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
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
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify Users tab shows mock member
    await viewersDrawer.findByText('viewer.user');
    await viewersDrawer.findByText('Viewer');
    await viewersDrawer.findByText('User');
  },
};
