import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import {
  clickWizardButton,
  expandWorkspaceInTree,
  expandWorkspaceRow,
  fillWorkspaceForm,
  navigateToPage,
  openWorkspaceKebabMenu,
  openWorkspaceWizard,
  resetStoryState,
  selectParentWorkspace,
  selectWorkspaceFromTree,
  waitForPageToLoad,
} from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import { defaultKesselRoles } from '../../../.storybook/fixtures/kessel-groups-roles';
import { delay } from 'msw';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Workspaces (Kessel)/M2: Hierarchy Management/With Write Permission',
  tags: ['kessel-m2-write'],
  decorators: [
    (Story: any, context: any) => {
      // Create dynamic environment based on current args
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
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': false,
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
      'platform.rbac.workspaces-role-bindings': false,
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
        roles: defaultKesselRoles,
      }),
    },
    docs: {
      description: {
        component: `
# Kessel M2: With Write Permission

**Feature Flags**: \`platform.rbac.workspaces-list\` + \`platform.rbac.workspace-hierarchy\`
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

## Milestone Overview

Kessel M2 adds **workspace hierarchy management**. This includes parent selection, full CRUD operations (Create, Edit, Move, Delete), and subworkspace creation.

## Key Features

- ✅ **Workspace List**: View all workspaces in tree structure (from M1)
- ✅ **Create Workspace**: Full wizard with parent selection
  - Choose any workspace as parent using tree selector
  - Create workspaces at any level of hierarchy
- ✅ **Create Subworkspace**: Create child workspace from parent's kebab menu
  - Opens same wizard with parent context
- ✅ **Move Workspace**: Change workspace parent in hierarchy
  - Modal dialog with tree selector for new parent
  - Updates workspace position in tree
- ✅ **Edit Workspace**: Modify name and description
  - Modal form with validation
  - Updates immediately in list
- ✅ **Delete Workspace**: Remove workspaces
  - Confirmation modal with checkbox
  - Only available for leaf nodes (no children)
- ✅ **External Links**: Workspace names link to Inventory
  - Standard/ungrouped-hosts workspaces are clickable
  - URL format: \`/insights/inventory/workspaces/:id\`
- ❌ **No RBAC Detail Pages**: Workspace details in RBAC not available until M3

## User Capabilities (With Write Permission)

Users with \`inventory:groups:write\` permission can:
- View the complete workspace hierarchy
- Create new workspaces with parent selection
- Create subworkspaces from any workspace
- Move workspaces to different parents
- Edit workspace names and descriptions
- Delete leaf workspaces (no children)
- Navigate to Inventory workspace pages (external to RBAC)

## What's Coming Next

- **M3**: Workspace detail pages in RBAC with Roles tab (replaces Inventory links)
- **M4**: Role bindings write access
- **M5**: Full feature set with master flag

## Testing Notes

This milestone is currently in development. Edit/Move/Delete operations require proper permission checks.
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
    'platform.rbac.workspaces-role-bindings': false,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M2 Manual Testing - With Write Permission

**Feature Flags**: \`platform.rbac.workspaces-list\` + \`platform.rbac.workspace-hierarchy\`  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

### Milestone Context

Kessel M2 adds **workspace hierarchy management**, enabling full CRUD operations (Create, Edit, Move, Delete) and parent workspace selection.

**What's Available in M2:**
- ✅ All M1 features (workspace list view)
- ✅ Create workspace with parent selection
- ✅ Create subworkspace from parent's kebab menu
- ✅ Move workspace to different parent
- ✅ Edit workspace name and description
- ✅ Delete workspace (leaf nodes only)
- ✅ External links to Inventory (workspace names are clickable)
- ❌ No RBAC workspace detail pages (M3+)
- ❌ No role bindings management (M3+)

### Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the RBAC UI in the M2 milestone environment.

**Environment Configuration:**
- Feature flags: \`platform.rbac.workspaces-list\` + \`platform.rbac.workspace-hierarchy\`
- Chrome API mock with \`inventory:groups:write\` permission
- MSW handlers for API mocking
- Mock data for workspaces, groups, and roles

**What to Test:**

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify roles are displayed for each bundle
- Check that data is accurate and loads correctly

**Workspaces Management (M2 Features):**
- Navigate to "Workspaces" using the left navigation
- **Create Workspace**: Click "Create workspace"
  - Parent selector is now INTERACTIVE (no longer disabled)
  - Choose any workspace as parent using tree selector
  - Submit and verify workspace appears in correct location
- **Create Subworkspace**: Open workspace kebab menu
  - Click "Create subworkspace"
  - Parent is pre-selected to the workspace you clicked from
- **Move Workspace**: Open workspace kebab menu → "Move workspace"
  - Select new parent from tree selector
  - Verify workspace moves to new location
- **Edit Workspace**: Open workspace kebab menu → "Edit workspace"
  - Modify name and description
  - Save and verify changes
- **Delete Workspace**: Open workspace kebab menu → "Delete workspace"
  - Only available for leaf nodes (no children)
  - Confirm deletion with checkbox
- **External Links**: Click workspace names
  - Should navigate to Inventory (not RBAC - that comes in M3)
  - URL format: \`/insights/inventory/workspaces/:id\`

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- Try enabling \`platform.rbac.workspaces-role-bindings\` to see M3 features
- The story will automatically remount with new settings when controls change

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
- Compare M2 behavior with M1 (disable \`workspace-hierarchy\`) or M3 (enable \`workspaces-role-bindings\`)

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
 * Workspaces / Create workspace with parent selection
 *
 * Tests that an admin can create a workspace and select a parent.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Workspaces via sidebar
 * 3. Click "Create workspace" button
 * 4. Fill in workspace name and description
 * 5. Parent workspace selector should be present (M2 feature)
 * 6. Submit and verify success
 */
export const CreateWorkspace: Story = {
  name: 'Workspaces / Create workspace with parent selection',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that admins can create a workspace with parent selection in Kessel M2.

**What this tests:**
- Navigation to Workspaces page
- Opening create workspace wizard
- Filling in workspace details (name, description)
- Parent workspace selector is present and interactive (M2 feature)
- Submitting the form successfully

**Expected UI:**
- "Create workspace" button is visible
- Wizard opens with name, description fields
- Parent workspace selector shows hierarchy (tree view)
- Form can be submitted
- Success notification or wizard closes

**M2 Key Feature:**
The parent workspace selector should be interactive, allowing selection from a tree view.
In M1, this would be disabled or auto-select Default Workspace.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Workspaces page first to load the list
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Open the Create Workspace wizard
    const wizard = await openWorkspaceWizard(user, canvas);

    // Fill in workspace details
    await fillWorkspaceForm(user, wizard, 'Test Workspace M2', 'A test workspace for Kessel M2 with parent selection');

    // Verify parent workspace selector is present (M2 feature)
    const parentLabel = await wizard.findByText(/parent workspace/i);
    expect(parentLabel).toBeInTheDocument();

    // Select parent workspace from tree: expand Default Workspace, select Production
    await selectParentWorkspace(user, wizard, 'Default Workspace', 'Production');

    // Navigate to review and submit
    await clickWizardButton(user, wizard, 'Next');
    await clickWizardButton(user, wizard, 'Submit');

    // Wizard should close and we should be back on the workspace list
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Expand Default Workspace (root) to see its children
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Expand Production to reveal the new workspace
    await expandWorkspaceRow(user, canvas, 'Production');

    // Verify the new workspace appears as a child of Production
    const newWorkspace = await canvas.findByText('Test Workspace M2');
    expect(newWorkspace).toBeInTheDocument();

    // Verify it's at the correct hierarchy level (level 3 = grandchild of root)
    const newWorkspaceRow = newWorkspace.closest('tr') as HTMLElement;
    expect(newWorkspaceRow.getAttribute('aria-level')).toBe('3');
  },
};

/**
 * Workspaces / Create subworkspace from kebab menu
 *
 * Tests creating a subworkspace from a parent workspace's action menu.
 *
 * Journey:
 * 1. Navigate to Workspaces
 * 2. Open "Production" workspace actions
 * 3. Click "Create subworkspace"
 * 4. Fill in details
 * 5. Parent should be pre-selected to "Production"
 */
export const CreateSubworkspace: Story = {
  name: 'Workspaces / Create subworkspace from kebab menu',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that admins can create a subworkspace from a parent's action menu in Kessel M2.

**What this tests:**
- Opening workspace action menu
- Clicking "Create subworkspace" action
- Wizard opens with parent pre-selected
- Form submission

**Expected UI:**
- Kebab menu on Production workspace
- "Create subworkspace" action available
- Wizard opens with Production as parent (pre-selected)
- Form can be filled and submitted
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

    // Open Production's kebab menu and click "Create subworkspace"
    const body = await openWorkspaceKebabMenu(user, canvas, 'Production');
    const createSubworkspaceButton = await body.findByText(/create subworkspace/i);
    expect(createSubworkspaceButton).toBeInTheDocument();
    await user.click(createSubworkspaceButton);
    await delay(1000);

    // Wait for wizard to appear
    await body.findByText(/create new workspace/i);
    const wizard = document.querySelector('.pf-v6-c-wizard, .pf-c-wizard');
    expect(wizard).toBeInTheDocument();
    const wizardScope = within(wizard as HTMLElement);

    // Fill in workspace name
    await fillWorkspaceForm(user, wizardScope, 'Test Subworkspace');

    // Verify parent selector is present (M2 feature)
    const parentLabel = await wizardScope.findByText(/parent workspace/i);
    expect(parentLabel).toBeInTheDocument();

    // Select parent workspace: expand Default Workspace, select Production
    await selectParentWorkspace(user, wizardScope, 'Default Workspace', 'Production');

    // Navigate to review and submit
    await clickWizardButton(user, wizardScope, 'Next');
    await clickWizardButton(user, wizardScope, 'Submit');

    // Wizard should close and we should be back on the workspace list
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Expand Default Workspace (root) to see its children
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Expand Production to reveal the new subworkspace
    await expandWorkspaceRow(user, canvas, 'Production');

    // Verify the new subworkspace appears as a child of Production
    const newSubworkspace = await canvas.findByText('Test Subworkspace');
    expect(newSubworkspace).toBeInTheDocument();

    // Verify it's at the correct hierarchy level (level 3 = grandchild of root)
    const newSubworkspaceRow = newSubworkspace.closest('tr') as HTMLElement;
    expect(newSubworkspaceRow.getAttribute('aria-level')).toBe('3');
  },
};

/**
 * Workspaces / Move workspace
 *
 * Tests moving a workspace to a new parent in the hierarchy.
 * This is a core M2 feature since it requires workspace hierarchy support.
 */
export const MoveWorkspace: Story = {
  name: 'Workspaces / Move workspace',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that users with \`inventory:groups:write\` permission can move workspaces in the hierarchy.

**What this tests:**
- Kebab menu on workspace row
- "Move workspace" action available
- Parent selection tree opens
- Can select new parent
- Move is processed

**Expected UI:**
- Kebab menu on Staging workspace
- "Move workspace" action enabled
- Tree selector for choosing new parent
- Confirmation and submission
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

    // Expand Default Workspace to see Staging
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Open Staging's kebab menu and click "Move workspace"
    const body = await openWorkspaceKebabMenu(user, canvas, 'Staging');
    const moveWorkspaceButton = await body.findByText(/^move workspace$/i);
    expect(moveWorkspaceButton).toBeInTheDocument();
    expect(moveWorkspaceButton).not.toHaveAttribute('disabled');
    await user.click(moveWorkspaceButton);
    await delay(1000);

    // Modal should open with parent selector
    const modalHeading = await body.findByRole('heading', { name: /move.*staging/i });
    expect(modalHeading).toBeInTheDocument();

    // The parent selector menu toggle should show the current parent (Default Workspace)
    const parentSelector = await body.findByRole('button', { name: /default workspace/i });
    expect(parentSelector).toBeInTheDocument();

    // Click to open parent selector
    await user.click(parentSelector);
    await delay(500);

    // Find the tree panel and expand Default Workspace to see Production
    const treePanel = document.querySelector('.rbac-c-workspace-selector-menu');
    expect(treePanel).toBeInTheDocument();
    const treePanelScope = within(treePanel as HTMLElement);

    await expandWorkspaceInTree(user, treePanelScope, 'Default Workspace');
    await selectWorkspaceFromTree(user, treePanelScope, 'Production');

    // Verify the Submit button in the modal is enabled and click it
    const submitButton = await body.findByRole('button', { name: /^submit$/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    await delay(1000);

    // Modal should close and we should see the updated workspace list
    await waitForPageToLoad(canvas, 'Default Workspace');

    // Expand Default Workspace (root) to see its children
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Expand Production to reveal the moved Staging workspace
    await expandWorkspaceRow(user, canvas, 'Production');

    // Verify Staging now appears as a child of Production (moved from root level)
    const stagingWorkspace = await canvas.findByText('Staging');
    expect(stagingWorkspace).toBeInTheDocument();

    // Verify it's now at level 3 (was level 2, now moved under Production)
    const stagingRowAfterMove = stagingWorkspace.closest('tr') as HTMLElement;
    expect(stagingRowAfterMove.getAttribute('aria-level')).toBe('3');
  },
};

/**
 * Workspaces / Edit workspace
 *
 * Tests editing a workspace's name and description from the kebab menu.
 * This is a core M2 feature since create, edit, move, delete are typically released together.
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
Tests that users with \`inventory:groups:write\` permission can edit workspace details from the kebab menu.

**What this tests:**
- Kebab menu on workspace row
- "Edit workspace" action available
- Edit form opens (modal or page)
- Can modify name and description
- Changes are saved

**Expected UI:**
- Kebab menu on Production workspace
- "Edit workspace" action enabled
- Form/modal to edit workspace details
- Save button to submit changes
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

    // Open Production's kebab menu and click "Edit workspace"
    const body = await openWorkspaceKebabMenu(user, canvas, 'Production');
    const editButton = await body.findByText(/^edit workspace$/i);
    expect(editButton).toBeInTheDocument();
    await user.click(editButton);
    await delay(500);

    // Edit modal should open
    const modal = await body.findByRole('dialog', { name: /edit workspace information/i });
    const modalScope = within(modal);
    await delay(1000);

    // Get form inputs
    const nameInput = await modalScope.findByDisplayValue('Production');
    const descriptionInput = await modalScope.findByDisplayValue('Production environment workspace');

    // Modify the name
    await user.clear(nameInput);
    await user.type(nameInput, 'Production Updated');

    // Modify the description
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated production environment');
    await delay(300);

    // Save changes
    const saveButton = modalScope.getByRole('button', { name: /^save$/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);
    await delay(1000);

    // Verify modal closed and workspace list updated
    await waitForPageToLoad(canvas, 'Default Workspace');
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Verify the updated workspace appears in the list
    const updatedWorkspace = await canvas.findByText('Production Updated');
    expect(updatedWorkspace).toBeInTheDocument();
  },
};

/**
 * Workspaces / Delete workspace
 *
 * Tests deleting a workspace from the kebab menu.
 * This is a core M2 feature since create, edit, move, delete are typically released together.
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
Tests that users with \`inventory:groups:write\` permission can delete workspaces from the kebab menu.

**What this tests:**
- Kebab menu on workspace row
- "Delete workspace" action available
- Confirmation modal opens
- Requires confirmation checkbox
- Delete button is enabled after confirmation

**Permission requirements:**
- \`inventory:groups:write\` or \`inventory:groups:*\`
- Workspace type must be 'standard'
- Workspace must not have children (delete is disabled for parents)

**Expected UI:**
- Kebab menu on Staging workspace (leaf node)
- "Delete workspace" action enabled
- Confirmation modal with checkbox
- Delete button enabled after confirmation
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

    // Expand Default Workspace to see Staging
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Open Staging's kebab menu and click "Delete workspace"
    const body = await openWorkspaceKebabMenu(user, canvas, 'Staging');
    const deleteButton = await body.findByText(/^delete workspace$/i);
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton);
    await delay(1000);

    // Confirmation modal should open
    const modalHeading = await body.findByRole('heading', { name: /delete.*workspace/i });
    expect(modalHeading).toBeInTheDocument();

    // Find the confirmation checkbox
    const checkbox = await body.findByRole('checkbox', { name: /understand.*cannot be undone/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Check the confirmation checkbox
    await user.click(checkbox);
    await delay(300);

    // The delete/confirm button should now be enabled
    const confirmButton = await body.findByRole('button', { name: /^delete$/i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();

    // Click delete to confirm
    await user.click(confirmButton);

    // CRITICAL: Verify the workspace is removed from the list
    // This tests that cache invalidation is working correctly
    await waitForPageToLoad(canvas, 'Default Workspace');
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Verify Staging is no longer in the list
    await waitFor(
      () => {
        expect(canvas.queryByText('Staging')).not.toBeInTheDocument();
        // Production should still be there
        expect(canvas.getByText('Production')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/**
 * Workspaces / View workspace detail links to Inventory
 *
 * In M2, workspace names should link to Inventory (not RBAC), since workspace
 * detail pages in RBAC are not available until M3.
 */
export const ViewWorkspaceDetailLinksToInventory: Story = {
  name: 'Workspaces / View workspace detail links to Inventory',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that workspace names link to Inventory in M2 (before workspace detail pages are added in M3).

**What this tests:**
- Workspace names are clickable links
- Links navigate to Inventory workspace view
- URL format: /insights/inventory/workspaces/:workspaceId

**Expected behavior:**
- M1-M2: Links go to Inventory
- M3+: Links go to RBAC detail pages with Roles tab
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

    // Click on "Production" workspace link
    const productionLink = await canvas.findByRole('link', { name: /^production$/i });
    await user.click(productionLink);
    await delay(500);

    // In M2, should navigate to Inventory
    const addressBar = canvas.getByTestId('fake-address-bar');
    expect(addressBar).toHaveTextContent(/\/insights\/inventory\/workspaces\/ws-1/i);
  },
};
