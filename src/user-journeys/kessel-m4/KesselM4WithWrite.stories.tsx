import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
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
  title: 'User Journeys/Management Fabric/Workspaces (Kessel)/Kessel M4: Role Bindings Write/With Write Permission',
  tags: ['kessel-m4-write', 'test-skip'],
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
      description: 'Kessel M3 - Workspace role bindings (read-only)',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-role-bindings-write': {
      control: 'boolean',
      description: 'Kessel M4 - Workspace role bindings (write)',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
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
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true, // User identity
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': false,
    'platform.rbac.workspaces-organization-management': true,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': false,
    'platform.rbac.common-auth-model': false,
    'platform.rbac.common.userstable': false,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': true,
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
# Kessel M4: Admin Environment — Role Bindings Write

**Feature Flag**: \`platform.rbac.workspaces-role-bindings-write\`

## Milestone Overview

Kessel M4 adds **Access Management v2 Write** capabilities, allowing administrators to modify role bindings directly from workspace detail pages. This builds upon M3's read-only role bindings view.

## Key Features

- ✅ **All M3 Features**: Workspace list, hierarchy, detail pages with role bindings
- ✅ **Edit Role Access**: Open the RoleAccessModal from the group drawer to grant or remove roles for a group in a workspace

## Admin Capabilities

In M4, admins can:
- Navigate to workspace detail page (from M3)
- View role assignments in the Roles tab
- Click a group to open the drawer
- Click "Edit access for this workspace" to open the RoleAccessModal
- Select/deselect roles to grant or revoke access
- Submit changes and return to the workspace detail page
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
  name: 'Kessel M4 Manual Testing',
  tags: ['autodocs'],
  args: {
    ...ManualTestingWithWrite.args,
    // Explicitly include feature flag args to ensure controls work
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': false,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M4 Manual Testing - With Write Permission

**Feature Flag**: \`platform.rbac.workspaces-role-bindings-write\`  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

### Milestone Context

Kessel M4 adds **workspace role bindings write access**, allowing administrators to modify role assignments directly from workspace detail pages. This builds upon M3's read-only role bindings view.

**What's Available in M4:**
- ✅ All M1 features (workspace list view)
- ✅ All M2 features (workspace hierarchy management)
- ✅ All M3 features (workspace detail pages with role bindings)
- ✅ Edit role access for a group in a workspace via RoleAccessModal

### Manual Testing Entry Point

This story provides an entry point for manual testing the RBAC UI in the M4 milestone environment.

**Environment Configuration:**
- Feature flags: M1 + M2 + M3 + M4 (\`workspaces-role-bindings-write\`)
- Chrome API mock with \`inventory:groups:write\` permission
- MSW handlers with stateful data for workspaces, groups, roles, and role bindings

**What to Test:**

**Workspaces Management (M4 Features):**
- Navigate to "Workspaces" using the left navigation
- Click workspace name to open detail page
- View role assignments in the Roles tab
- Click a group name to open the group drawer
- Click "Edit access for this workspace" to open the RoleAccessModal
- Select/deselect roles and click Update

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- The story will automatically remount with new settings when controls change

### Additional Test Stories

- **[EditRoleAccess](?path=/story/user-journeys-management-fabric-workspaces-kessel-kessel-m4-role-bindings-write-with-write-permission--edit-role-access)**: Full journey — navigate to workspace, open group drawer, edit role access via modal

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
 * Workspace Role Bindings / Edit role access for a group
 *
 * Journey:
 * 1. Navigate to Workspaces page
 * 2. Expand hierarchy to Production workspace
 * 3. Click Production to open detail page
 * 4. See role assignments table (Production Admins, Viewers)
 * 5. Click "Production Admins" to open group drawer
 * 6. Click "Edit access for this workspace" in the drawer
 * 7. RoleAccessModal opens with roles (Workspace Administrator + Viewer pre-selected)
 * 8. Deselect a role to make a change
 * 9. Click "Update"
 * 10. Verify navigation back to workspace detail
 */
export const EditRoleAccess: Story = {
  name: 'Workspace Role Bindings / Edit role access',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Edit Role Access Journey

Complete user flow for editing role access for a group in a workspace via the RoleAccessModal.

### Journey Flow
1. Navigate to **Workspaces** page
2. Expand hierarchy to reach the **Production** workspace
3. Click **Production** to open the workspace detail page
4. Roles tab shows role assignments (**Production Admins**, **Viewers**)
5. Click **Production Admins** to open the group details drawer
6. Click **Edit access for this workspace** button in the drawer
7. **RoleAccessModal** opens with all roles listed; Workspace Administrator and Workspace Viewer are pre-selected
8. Deselect **Workspace Viewer** to change the role assignment
9. Click **Update**
10. Navigates back to workspace detail page

### Verification
- ✅ Workspace detail page loads with role assignments
- ✅ Group drawer opens with roles and users tabs
- ✅ "Edit access for this workspace" button is present and clickable
- ✅ RoleAccessModal opens with correct pre-selected roles
- ✅ Role selection can be changed
- ✅ Update button becomes enabled after changes
- ✅ After clicking Update, user returns to workspace detail
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // 1. Navigate to Workspaces
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Root Workspace');

    // 2. Expand hierarchy: Root Workspace → Default Workspace → see Production
    await expandWorkspaceRow(user, canvas, 'Root Workspace');
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // 3. Click Production to open detail page
    const productionLink = await canvas.findByRole('link', { name: /^production$/i });
    await user.click(productionLink);

    // 4. Verify workspace detail page loads with Roles tab
    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/activeTab=roles/i);
    });

    // Wait for role assignments table to load
    await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    await waitFor(
      async () => {
        const hasData = canvas.queryByText('Production Admins') || canvas.queryByText('Viewers');
        await expect(hasData).toBeTruthy();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await canvas.findByText('Production Admins');
    await canvas.findByText('Viewers');

    // 5. Click "Production Admins" to open group drawer
    const productionAdminsText = await canvas.findByText('Production Admins');
    await user.click(productionAdminsText);
    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    // Verify the drawer opens
    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    await expect(drawerPanel).toBeInTheDocument();
    const drawer = within(drawerPanel);

    await drawer.findByRole('heading', { name: 'Production Admins' });

    // 6. Click "Edit access for this workspace" button in the drawer
    const editAccessButton = await drawer.findByRole('button', { name: /edit access for this workspace/i });
    await expect(editAccessButton).toBeInTheDocument();
    await user.click(editAccessButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    // 7. RoleAccessModal opens (route mode — renders a Modal in document.body)
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await expect(dialog).toBeInTheDocument();

    // Verify modal header
    await expect(body.findByText(/edit access/i)).resolves.toBeInTheDocument();

    // Wait for roles to load in the modal table
    await waitFor(
      async () => {
        await expect(body.findByText('Workspace Administrator')).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    // 8. Verify pre-selected roles — find the table inside the modal
    const modalScope = within(dialog);
    const table = await modalScope.findByRole('grid', { name: /roles selection table/i });
    const tableScope = within(table);

    // Workspace Administrator (role-1) should be checked
    const adminRow = (await tableScope.findByText('Workspace Administrator')).closest('tr') as HTMLElement;
    const adminCheckbox = adminRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(adminCheckbox).toBeInTheDocument();
    await expect(adminCheckbox.checked).toBe(true);

    // Workspace Viewer (role-2) should be checked
    const viewerRow = (await tableScope.findByText('Workspace Viewer')).closest('tr') as HTMLElement;
    const viewerCheckbox = viewerRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(viewerCheckbox).toBeInTheDocument();
    await expect(viewerCheckbox.checked).toBe(true);

    // 9. Deselect Workspace Viewer to create a change
    await user.click(viewerCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify checkbox is now unchecked
    await expect(viewerCheckbox.checked).toBe(false);

    // Verify Update button is now enabled (changes detected)
    const updateButton = await modalScope.findByRole('button', { name: /update/i });
    await expect(updateButton).not.toBeDisabled();

    // 10. Click Update
    await user.click(updateButton);

    // Verify the modal closes and we're back on the workspace detail page
    await waitFor(
      () => {
        expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    // Verify we navigated back to the workspace detail page
    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
    });
  },
};

/**
 * Workspace Role Bindings / Add role binding
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page
 * 2. Click "Roles" tab
 * 3. Click "Add role" button
 * 4. Select a role from available roles
 * 5. Select principals (users/groups) to bind
 * 6. Submit and verify role binding appears in table
 */
export const AddRoleBinding: Story = {
  name: 'Workspace Role Bindings / Add role binding',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to add role bindings to workspaces from the workspace detail page.

**Journey:**
1. Navigate to Workspaces page
2. Click on "Production" workspace
3. Switch to "Roles" tab
4. Click "Add role" button
5. Modal opens with role selector
6. Select a role (e.g., "Viewer")
7. Select principals (users/groups) to bind
8. Submit
9. Role binding appears in the Roles table

**UI Components Needed:**
- "Add role" button in Roles tab toolbar
- Add role binding modal/wizard
- Role selector dropdown
- Principal selector (users/groups)
- Success notification

**API Calls Expected:**
\`\`\`
POST /api/rbac/v2/workspaces/ws-1/role-bindings
{
  "role_id": "viewer-role",
  "principals": ["user1", "user2"],
  "workspace_id": "ws-1"
}
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder: Navigate to workspace detail
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Click workspace link to detail page
    // TODO: Switch to Roles tab
    // TODO: Click "Add role" button
    // TODO: Fill in role binding form
    // TODO: Submit and verify
  },
};

/**
 * Workspace Role Bindings / Remove role binding
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page with existing role bindings
 * 2. Click "Roles" tab
 * 3. Open kebab menu for a role binding
 * 4. Click "Remove"
 * 5. Confirm deletion
 * 6. Verify role binding is removed from table
 */
export const RemoveRoleBinding: Story = {
  name: 'Workspace Role Bindings / Remove role binding',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to remove role bindings from workspaces.

**Journey:**
1. Navigate to workspace detail page
2. Switch to "Roles" tab (shows existing role bindings)
3. Find a role binding row
4. Click kebab menu on that row
5. Click "Remove role binding"
6. Confirmation modal appears
7. Confirm deletion
8. Role binding removed from table
9. Success notification

**API Calls Expected:**
\`\`\`
DELETE /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Implement when M4 is available
  },
};

/**
 * Workspace Role Bindings / Assign principals to role
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page
 * 2. Click "Roles" tab
 * 3. Click on a role to expand details
 * 4. Click "Add principals" button
 * 5. Select users/groups
 * 6. Submit and verify principals are assigned
 */
export const AssignPrincipalsToRole: Story = {
  name: 'Workspace Role Bindings / Assign principals to role',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to add users/groups to existing workspace role bindings.

**Journey:**
1. Navigate to workspace detail page
2. Switch to "Roles" tab
3. Expand a role binding to see assigned principals
4. Click "Add principals" or "Add members"
5. Modal opens with user/group selector
6. Select users and/or groups
7. Submit
8. Principals appear in the role binding

**API Calls Expected:**
\`\`\`
PATCH /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123
{
  "add_principals": ["user3", "group1"]
}
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Implement when M4 is available
  },
};

/**
 * Workspace Role Bindings / Remove principals from role
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page
 * 2. Click "Roles" tab
 * 3. Expand a role binding
 * 4. Select principals to remove
 * 5. Click "Remove"
 * 6. Confirm and verify principals are removed
 */
export const RemovePrincipalsFromRole: Story = {
  name: 'Workspace Role Bindings / Remove principals from role',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to remove users/groups from workspace role bindings.

**Journey:**
1. Navigate to workspace detail page
2. Switch to "Roles" tab
3. Expand a role binding to see assigned principals
4. Select checkboxes for users/groups to remove
5. Click "Remove" in bulk actions or kebab menu
6. Confirmation modal appears
7. Confirm
8. Principals removed from role binding

**API Calls Expected:**
\`\`\`
PATCH /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123
{
  "remove_principals": ["user2"]
}
\`\`\`

Or potentially:
\`\`\`
DELETE /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123/principals/user2
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Implement when M4 is available
  },
};
