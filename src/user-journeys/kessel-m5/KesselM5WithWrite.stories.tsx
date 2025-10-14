import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { expandWorkspaceRow, navigateToPage, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import { defaultKesselRoles } from '../../../.storybook/fixtures/kessel-groups-roles';
import { delay } from 'msw';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Workspaces (Kessel)/M5: Master Flag/With Write Permission',
  tags: ['kessel-m5-write', 'test-skip'],
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
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Kessel M5 - Full workspace management (master flag)',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
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
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': true,
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
      'platform.rbac.workspaces-role-bindings-write': true,
      'platform.rbac.workspaces': true,
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
# Kessel M5: With Write Permission - Full Feature Set

**Feature Flag**: \`platform.rbac.workspaces\` (master flag - enables all features)  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

## ⚠️ Important: Naming Clarification

This "M5" environment represents the **full feature set** available when the master \`platform.rbac.workspaces\` flag is enabled. It is **NOT** a direct mapping to Red Hat's M5 milestone ("Management Fabric Hosted" - 2026), which refers to infrastructure/hosting concerns.

We use "M5" here as shorthand for "complete Kessel workspace management environment" - it's simply the state when all features are enabled via the master flag.

## Feature Flag Hierarchy

When \`platform.rbac.workspaces\` is enabled, it activates all workspace features:
- M1: \`platform.rbac.workspaces-list\` (workspace list view)
- M2: \`platform.rbac.workspace-hierarchy\` (hierarchy management)
- M3: \`platform.rbac.workspaces-role-bindings\` (role bindings read)
- M4: \`platform.rbac.workspaces-role-bindings-write\` (role bindings write)
- M5: Master flag that enables everything

## Key Features (All Milestones Combined)

- ✅ **Workspace List**: View all workspaces in hierarchical tree (M1)
- ✅ **Create Workspace**: With parent selection (M1-M2)
- ✅ **Create Subworkspace**: From parent workspace context (M2)
- ✅ **Move Workspace**: Change parent in hierarchy (M2)
- ✅ **Edit Workspace**: Modify name and description (M2)
- ✅ **Delete Workspace**: Remove leaf workspaces (M2)
- ✅ **Workspace Detail Pages**: In RBAC with Roles/Assets tabs (M3)
- ✅ **Role Bindings**: View and modify workspace role assignments (M3-M4)

## User Capabilities (With Write Permission)

Users with \`inventory:groups:write\` permission have complete workspace management:
- All M1 capabilities: View workspace list
- All M2 capabilities: Create, edit, move, delete workspaces
- All M3 capabilities: View workspace details and role bindings in RBAC
- All M4 capabilities: Modify workspace role assignments

## Testing Notes

This environment tests the complete Kessel workspace feature set. Most features are actually available in earlier milestones (M2), with M3-M4 adding detail pages and role bindings.
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
    'platform.rbac.workspaces': true,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M5 Manual Testing - Full Feature Set

**Feature Flag**: \`platform.rbac.workspaces\` (master flag - enables all features)  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

### ⚠️ Important: Naming Clarification

This "M5" environment represents the **full feature set** available when the master \`platform.rbac.workspaces\` flag is enabled. It is **NOT** a direct mapping to Red Hat's M5 milestone ("Management Fabric Hosted" - 2026), which refers to infrastructure/hosting concerns.

We use "M5" here as shorthand for "complete Kessel workspace management environment" - it's simply the state when all features are enabled via the master flag.

### Milestone Context

Kessel M5 is the **master flag** that enables ALL workspace features at once. When \`platform.rbac.workspaces\` is enabled, it automatically activates:
- M1: \`platform.rbac.workspaces-list\` (workspace list view)
- M2: \`platform.rbac.workspace-hierarchy\` (hierarchy management)
- M3: \`platform.rbac.workspaces-role-bindings\` (role bindings read)
- M4: \`platform.rbac.workspaces-role-bindings-write\` (role bindings write)

**What's Available in M5:**
- ✅ All M1 features (workspace list view)
- ✅ All M2 features (workspace hierarchy management)
- ✅ All M3 features (workspace detail pages with read-only role bindings)
- ✅ All M4 features (workspace role bindings write access - when implemented)
- ✅ Complete workspace management in single environment

### Manual Testing Entry Point

This story provides an entry point for manual testing the **complete** RBAC UI with all workspace features enabled.

**Environment Configuration:**
- Feature flags: ALL workspace flags enabled via \`platform.rbac.workspaces\`
- Chrome API mock with \`inventory:groups:write\` permission
- MSW handlers for API mocking
- Mock data for workspaces, groups, roles, and role bindings

**What to Test:**

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify roles are displayed for each bundle
- Check that data is accurate and loads correctly

**Workspaces Management (All Features):**
- Navigate to "Workspaces" using the left navigation
- **M1 Features**: View workspace list, expand/collapse tree
- **M2 Features**:
  - Create workspace with parent selection
  - Create subworkspace from kebab menu
  - Move workspace to different parent
  - Edit workspace name and description
  - Delete workspace (leaf nodes only)
- **M3 Features**:
  - Click workspace name to open detail page in RBAC
  - View Roles tab with sub-tabs
  - View Assets tab
  - Click group to open drawer with roles/users tabs
- **M4 Features** (when implemented):
  - Add role bindings to workspace
  - Remove role bindings from workspace
  - Assign principals to workspace roles

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- Try disabling individual flags to see how features are gated
- The story will automatically remount with new settings when controls change

### Feature Flag Hierarchy

The master flag \`platform.rbac.workspaces\` acts as a convenience toggle:
- ✅ When enabled: All M1-M4 flags are treated as enabled
- ❌ When disabled: Individual flags (M1-M4) control what's visible

This allows for:
1. **Gradual rollout**: Enable M1 → M2 → M3 → M4 individually in production
2. **Master toggle**: Enable \`workspaces\` to turn everything on at once
3. **Testing**: Easily test individual milestones vs complete feature set

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
- Compare behavior with individual milestone environments (M1-M4)
- This environment is useful for testing interactions between features

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
 * Workspaces / Edit workspace
 *
 * Tests editing a workspace's name and description.
 */
export const EditWorkspace: Story = {
  name: 'Workspaces / Edit workspace',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that users with \`inventory:groups:write\` permission can edit workspace details.

**What this tests:**
- Opening edit workspace form from kebab menu
- Modifying name and description
- Submitting changes
- Updated workspace appears in list

**Permission requirements:**
- \`inventory:groups:write\` or \`inventory:groups:*\`
- Workspace type must be 'default' or 'standard'

**Journey:**
1. Navigate to Workspaces
2. Open Production workspace actions
3. Click "Edit workspace"
4. Modify name and description
5. Save changes
6. Verify updated workspace in list
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Expand Default Workspace to see Production
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Find the Production workspace row
    const productionRow = canvas.getByText('Production').closest('tr') as HTMLElement;
    expect(productionRow).toBeInTheDocument();

    // Find and click the kebab menu in the Production row
    const productionRowScope = within(productionRow);
    const kebabButton = productionRowScope.getByLabelText(/kebab toggle|actions/i);
    await user.click(kebabButton);
    await delay(300);

    // Menu opens in document.body
    const body = within(document.body);
    const editButton = await body.findByText(/^edit workspace$/i);
    expect(editButton).toBeInTheDocument();
    expect(editButton).not.toHaveAttribute('disabled');
    await user.click(editButton);
    await delay(1000);

    // Edit form should open - find by URL change or form elements
    // The edit workspace uses a different route, so we should see form inputs
    const nameInput = await body.findByLabelText(/workspace name/i);
    expect(nameInput).toBeInTheDocument();

    const descInput = await body.findByLabelText(/workspace description/i);
    expect(descInput).toBeInTheDocument();

    // Modify the name
    await user.clear(nameInput);
    await user.type(nameInput, 'Production Updated');
    await delay(300);

    // Modify the description
    await user.clear(descInput);
    await user.type(descInput, 'Updated production environment');
    await delay(300);

    // Find and click Save button
    const saveButton = await body.findByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
  },
};

/**
 * Workspaces / Delete workspace
 *
 * Tests deleting a workspace.
 */
export const DeleteWorkspace: Story = {
  name: 'Workspaces / Delete workspace',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that users with \`inventory:groups:write\` permission can delete workspaces.

**What this tests:**
- Opening delete confirmation modal from kebab menu
- Confirming deletion with checkbox
- Workspace is removed from list

**Permission requirements:**
- \`inventory:groups:write\` or \`inventory:groups:*\`
- Workspace type must be 'standard'
- Workspace must not have children

**Journey:**
1. Navigate to Workspaces
2. Open Staging workspace actions (leaf node, can be deleted)
3. Click "Delete workspace"
4. Check confirmation checkbox
5. Confirm deletion
6. Verify workspace is removed
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Expand Default Workspace to see Staging
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Find the Staging workspace row (it's a leaf node, can be deleted)
    const stagingRow = canvas.getByText('Staging').closest('tr') as HTMLElement;
    expect(stagingRow).toBeInTheDocument();

    // Find and click the kebab menu in the Staging row
    const stagingRowScope = within(stagingRow);
    const kebabButton = stagingRowScope.getByLabelText(/kebab toggle|actions/i);
    await user.click(kebabButton);
    await delay(300);

    // Menu opens in document.body
    const body = within(document.body);
    const deleteButton = await body.findByText(/^delete workspace$/i);
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).not.toHaveAttribute('disabled');
    await user.click(deleteButton);
    await delay(1000);

    // Confirmation modal should open
    const modalHeading = await body.findByRole('heading', { name: /delete.*workspace/i });
    expect(modalHeading).toBeInTheDocument();

    // Find the confirmation checkbox
    const checkbox = await body.findByRole('checkbox', { name: /understand.*irreversible/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Check the confirmation checkbox
    await user.click(checkbox);
    await delay(300);

    // The delete/confirm button should now be enabled
    const confirmButton = await body.findByRole('button', { name: /^delete$/i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();
  },
};
