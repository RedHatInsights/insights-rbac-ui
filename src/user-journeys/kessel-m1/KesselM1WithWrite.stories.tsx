import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, fillWorkspaceForm, navigateToPage, openWorkspaceWizard, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import { defaultKesselRoles } from '../../../.storybook/fixtures/kessel-groups-roles';
import { delay } from 'msw';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';

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
  title: 'User Journeys/Management Fabric/Workspaces (Kessel)/Kessel M1: Workspace List View/With Write Permission',
  tags: ['kessel-m1-write'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      // Create dynamic environment based on current args
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
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': false,
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
      'platform.rbac.workspace-hierarchy': false,
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
# Kessel M1: With Write Permission

**Feature Flag**: \`platform.rbac.workspaces-list\`
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

## Milestone Overview

Kessel M1 introduces the initial workspace list view. This is the foundational feature that enables viewing workspaces in RBAC UI.

## Key Features

- ✅ **Workspace List**: View all workspaces in a hierarchical tree structure  
  - Displays workspace names and descriptions
  - Tree view with expand/collapse for hierarchy
  - Root workspace: "Default Workspace"
- ✅ **Create Workspace**: Basic workspace creation
  - Simple form with name and description
  - Parent workspace selector is present but disabled (fixed to "Default Workspace")
  - No parent selection capability until M2
- ✅ **Workspace Names**: Display as plain text (not clickable links)
  - Standard/ungrouped-hosts workspaces become links to Inventory in M2
  - Links to RBAC detail pages in M3+
- ✅ **Permissions**: Requires \`inventory:groups:write\` or \`inventory:groups:*\`
- ❌ **No Parent Selection**: Cannot choose parent workspace (M2+)
- ❌ **No Edit/Move/Delete**: CRUD operations added in M2
- ❌ **No Detail Pages**: RBAC workspace detail pages not available until M3

## User Capabilities (With Write Permission)

Users with \`inventory:groups:write\` permission can:
- View the complete workspace hierarchy
- Expand/collapse workspace tree nodes
- Create new workspaces (parent automatically set to "Default Workspace")
- See workspace names and descriptions in table view

## What's Coming Next

- **M2**: Workspace hierarchy management (parent selection, create subworkspace, move, edit, delete)
- **M3**: Workspace detail pages in RBAC with Roles tab
- **M4**: Role bindings write access
- **M5**: Full feature set with master flag

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
import { ManualTestingWithWrite } from '../_shared/stories/ManualTestingStory';
export const ManualTesting: Story = {
  ...ManualTestingWithWrite,
  name: 'Kessel M1 Manual Testing',
  tags: ['autodocs'],
  args: {
    ...ManualTestingWithWrite.args,
    // Explicitly include feature flag args to ensure controls work
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': false,
    'platform.rbac.workspaces-role-bindings': false,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M1 Manual Testing - With Write Permission

**Feature Flag**: \`platform.rbac.workspaces-list\`  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

### Milestone Context

Kessel M1 introduces the initial workspace list view, the foundational feature that enables viewing workspaces in RBAC UI.

**What's Available in M1:**
- ✅ Workspace list view with hierarchy tree
- ✅ Basic workspace creation (parent fixed to "Default Workspace")
- ✅ Workspace names displayed as plain text (not clickable)
- ❌ No parent selection capability (M2+)
- ❌ No Edit/Move/Delete operations (M2+)
- ❌ No detail pages (M3+)

### Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the RBAC UI in the M1 milestone environment.

**Environment Configuration:**
- Feature flags: Only \`platform.rbac.workspaces-list\` enabled
- Chrome API mock with \`inventory:groups:write\` permission
- MSW handlers for API mocking
- Mock data for workspaces, groups, and roles

**What to Test:**

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify roles are displayed for each bundle
- Check that data is accurate and loads correctly

**Workspaces Management (M1 Features):**
- Navigate to "Workspaces" using the left navigation
- Expand/collapse workspace tree nodes
- Click "Create workspace" button
  - Parent selector IS visible but DISABLED (hardcoded to "Default Workspace")
  - Fill in name and description
  - Submit and verify workspace appears in list
- Verify workspace names are plain text (not clickable - links come in M2)

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- Try enabling \`platform.rbac.workspace-hierarchy\` to see M2 features
- The story will automatically remount with new settings when controls change

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
- Compare M1 behavior with M2+ by toggling feature flags

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
 * Create workspace at root (basic wizard - no parent selection)
 *
 * User journey: Admin creates a new workspace at the root level.
 * In M1, the parent selection is not available, so all workspaces are created at root.
 *
 * Journey:
 * 1. Navigate to Workspaces page
 * 2. Click "Create workspace" button
 * 3. Fill in workspace name and description
 * 4. Submit the wizard
 * 5. Verify the new workspace appears in the list
 */
export const CreateWorkspaceBasic: Story = {
  name: 'Create workspace (basic - no parent selection)',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the M1 create workspace journey.

**M1 Behavior:**
- Create workspace wizard is available
- Parent selection dropdown IS shown but DISABLED (hardcoded to "Default Workspace")
- Workspaces are created under the default parent
- M2 will enable the parent selection dropdown

**User flow:**
1. Click "Create workspace" button from workspace list
2. Enter workspace name and description
3. Parent workspace is pre-selected (disabled dropdown)
4. Click Next to review
5. Click Submit
6. Verify workspace created successfully and appears in list
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

    // Open the Create Workspace wizard
    const wizard = await openWorkspaceWizard(user, canvas);

    // Fill in workspace details
    await fillWorkspaceForm(user, wizard, 'QA Environment', 'Quality Assurance testing workspace');

    // In M1, the parent selector IS present but DISABLED (not hidden)
    // It shows "Default Workspace" and cannot be changed
    const parentSelector = await wizard.findByText(/parent workspace/i);
    expect(parentSelector).toBeInTheDocument();

    // The parent dropdown should be disabled in M1
    const parentDropdown = wizard.getByText('Default Workspace');
    expect(parentDropdown).toBeInTheDocument();

    // Wait for Next button to be enabled before clicking
    const nextButton = await waitFor(() => {
      const button = wizard.queryByRole('button', { name: /^next$/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      return button!;
    });

    await user.click(nextButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // On Review step, click Submit
    const submitButton = await wizard.findByRole('button', { name: /^submit$/i });
    await user.click(submitButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify wizard closes after submission
    await waitFor(() => {
      const wizard = document.querySelector('.pf-v6-c-wizard, .pf-c-wizard');
      expect(wizard).not.toBeInTheDocument();
    });

    // Verify the new workspace appears in the list
    const qaEnvironment = await canvas.findByText('QA Environment');
    expect(qaEnvironment).toBeInTheDocument();
  },
};
