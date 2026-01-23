/**
 * V2 Roles - NEW DEVELOPMENT (TBD)
 *
 * These stories define the specification for the NEW Roles page based on Figma designs.
 * Each story represents a feature TO BE DEVELOPED (TBD) with TDD-style tests.
 *
 * Design Mocks:
 * - Roles/Frame 139.png - Roles list table
 * - Roles/Frame 140.png - Role drawer (Permissions tab)
 * - Roles/Frame 141.png - Role drawer (Assigned user groups tab)
 * - Roles/Frame 181.png - Empty permissions state
 * - Editing a role/Frame 147.png - Edit from kebab menu
 * - Editing a role/Frame 157.png - Edit role form
 * - Editing a role/Frame 178.png - Edit success
 * - Deleting a role/Frame 160-180.png - Delete flow
 */

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { FeatureGap, withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../../.storybook/fixtures/groups';
import { defaultUsers } from '../../../.storybook/fixtures/users';
import { defaultRoles } from '../../../.storybook/fixtures/roles';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

/**
 * Helper to create TBD (To Be Developed) decorator
 * Similar to withFeatureGap but with TBD terminology
 */
const withTBD = (spec: FeatureGap) =>
  withFeatureGap(
    {
      ...spec,
      title: `TBD: ${spec.title}`,
    },
    { defaultCollapsed: false },
  );

// =============================================================================
// MOCK DATA - Per Design Specifications
// =============================================================================

// Per Frame 139: Roles table columns
// These mock data structures document the expected data shape per design
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockV2Roles = [
  {
    uuid: 'role-tenant-admin',
    name: 'Tenant admin',
    description: 'description',
    permissions: 5,
    workspaces: 1,
    user_groups: 1,
    modified: '2023-01-01T00:00:00Z',
    system: true, // Canned role - no kebab/checkbox
  },
  {
    uuid: 'role-workspace-admin',
    name: 'Workspace admin',
    description: 'description',
    permissions: 4,
    workspaces: 1,
    user_groups: 1,
    modified: '2023-01-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-rhel-devops',
    name: 'RHEL DevOps',
    description: 'description',
    permissions: 3,
    workspaces: 2,
    user_groups: 2,
    modified: '2023-01-01T00:00:00Z',
    system: false, // Custom role - has kebab/checkbox
  },
  {
    uuid: 'role-cost-mgmt',
    name: 'Cost mgmt role',
    description: 'description',
    permissions: null, // "Not available" per design
    workspaces: null,
    user_groups: null,
    modified: '2023-01-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-rhel-inventory',
    name: 'RHEL Inventory viewer',
    description: 'description',
    permissions: 1,
    workspaces: 1,
    user_groups: 1,
    modified: '2024-01-13T00:00:00Z',
    system: false,
    // Per Frame 140: Permissions in drawer
    access: [{ application: 'inventory', resourceType: 'hosts', operation: 'read' }],
  },
];

// Per Frame 141: Assigned user groups in drawer
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockAssignedUserGroups = [
  { name: 'Powerpuff girls', workspace: 'All of Medical Imaging IT' },
  { name: 'Bad bunny', workspace: 'Cardiac MRI' },
];

const meta: Meta<typeof KesselAppEntryWithRouter> = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Feature Development/Feature Gap Tests/V2 Roles (TBD)',
  tags: ['tbd', 'v2-roles', 'new-development'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    'platform.rbac.workspaces': true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    msw: {
      handlers: [
        ...createStatefulHandlers({
          groups: defaultGroups,
          users: defaultUsers,
          roles: defaultRoles,
          workspaces: defaultWorkspaces,
        }),
      ],
    },
    docs: {
      description: {
        component: `
# V2 Roles - New Development (TBD)

These stories define the **specification** for the new Roles page.
Each story is a feature TO BE DEVELOPED with TDD-style tests.

## Design Reference

| Frame | Description |
|-------|-------------|
| Frame 139 | Roles list table with columns |
| Frame 140 | Role drawer - Permissions tab |
| Frame 141 | Role drawer - Assigned user groups tab |
| Frame 181 | Empty permissions state |
| Frame 147 | Edit role from kebab menu |
| Frame 157 | Edit role full page form |
| Frame 160-180 | Delete role flow |

## Key Requirements

1. **Roles Table**: Columns for Name, Description, Permissions, Workspaces, User groups, Last modified
2. **Row Click → Drawer**: Not full page navigation
3. **Drawer Tabs**: Permissions + Assigned user groups
4. **Canned Roles**: No kebab menu or checkboxes (hidden, not disabled)
5. **Edit Role**: Full page form with Application filter
        `,
      },
    },
  },
};

export default meta;

// =============================================================================
// FRAME 139 - ROLES LIST TABLE
// =============================================================================

/**
 * TBD: Roles table with required columns
 *
 * DESIGN: Roles/Frame 139.png
 * Columns: Name, Description, Permissions, Workspaces, User groups, Last modified
 */
export const RolesTableColumns: Story = {
  name: '📋 TBD: Roles table columns (Frame 139)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Roles Table Columns',
      designRef: 'Roles/Frame 139.png',
      designImage: '/mocks/Roles/Frame 139.png',
      currentState: 'Current table has: Name, Description, Groups, Permissions, Last modified',
      expectedBehavior: [
        'Table should have columns: Name, Description, Permissions, Workspaces, User groups, Last modified',
        'Permissions column shows count (e.g., "5", "4", "3")',
        'Workspaces column shows count (e.g., "1", "2")',
        'User groups column shows count (e.g., "1", "2")',
        'Some roles show "Not available" for permissions/workspaces/user groups',
      ],
      implementation: [
        'Add "Workspaces" column to RolesTable',
        'Rename "Groups" to "User groups"',
        'Fetch workspace count for each role',
        'Handle "Not available" display for canned roles',
      ],
      relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for roles to load
    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    const headers = within(table).getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.toLowerCase() || '');

    // TDD: These assertions define what SHOULD exist
    expect(headerTexts.some((h) => h.includes('name'))).toBe(true);
    expect(headerTexts.some((h) => h.includes('description'))).toBe(true);
    expect(headerTexts.some((h) => h.includes('permissions'))).toBe(true);
    expect(headerTexts.some((h) => h.includes('workspaces'))).toBe(true); // TBD
    expect(headerTexts.some((h) => h.includes('user groups'))).toBe(true); // TBD
    expect(headerTexts.some((h) => h.includes('last modified'))).toBe(true);
  },
};

/**
 * TBD: Row click opens drawer (not full page)
 *
 * DESIGN: Roles/Frame 139.png annotation: "The rows should be clickable to reveal a drawer"
 */
export const RolesRowClickOpensDrawer: Story = {
  name: '📋 TBD: Row click opens drawer (Frame 139)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Row Click Opens Drawer',
      designRef: 'Roles/Frame 139.png',
      designImage: '/mocks/Roles/Frame 139.png',
      currentState: 'Clicking role name navigates to full page detail view',
      expectedBehavior: [
        'Clicking anywhere on a role row opens a drawer panel',
        'Drawer shows role details with tabs',
        'URL does NOT change (drawer is overlay)',
        'Similar behavior to Users/User Groups drawer',
      ],
      implementation: [
        'Replace link-based navigation with drawer pattern',
        'Create RoleDetailsDrawer component',
        'Handle row click to open drawer',
        'Maintain table in background while drawer is open',
      ],
      relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx', 'Create: RoleDetailsDrawer.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Click on a role row
    const rows = canvas.getAllByRole('row');
    if (rows.length > 1) {
      await user.click(rows[1]); // Click first data row
      await delay(500);

      // TDD: Drawer should open (not navigate to new page)
      // Look for drawer panel or panel with role name
      const drawer = canvas.queryByRole('complementary') || canvas.queryByRole('dialog');
      expect(drawer).toBeInTheDocument();
    }
  },
};

/**
 * TBD: Canned roles have no kebab menu or checkboxes
 *
 * DESIGN: Roles/Frame 139.png annotation: "Canned roles should NOT have kebab or checkboxes"
 */
export const CannedRolesNoActions: Story = {
  name: '📋 TBD: Canned roles - no kebab/checkboxes (Frame 139)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Canned Roles Have No Actions',
      designRef: 'Roles/Frame 139.png',
      designImage: '/mocks/Roles/Frame 139.png',
      currentState: 'Canned roles show disabled kebab menus',
      expectedBehavior: [
        'Canned/system roles should NOT show kebab menu (hidden, not disabled)',
        'Canned roles should NOT have row selection checkboxes',
        'Custom roles SHOULD have kebab menu and checkboxes',
        'Design note: "today they are disabled, in future they should be hidden"',
      ],
      implementation: [
        'Check role.system property to determine if canned',
        'Conditionally render kebab menu only for custom roles',
        'Conditionally render checkbox only for custom roles',
      ],
      relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // TDD: Find a canned role row and verify no kebab
    // This test will fail until the feature is implemented
    const rows = within(table).getAllByRole('row');

    // Look for "Tenant admin" row (canned role per design)
    const cannedRoleRow = rows.find((row) => row.textContent?.includes('Organization Administrator'));
    if (cannedRoleRow) {
      // Canned role should NOT have a kebab button
      const kebab = within(cannedRoleRow).queryByRole('button', { name: /actions/i });
      expect(kebab).not.toBeInTheDocument();

      // Canned role should NOT have a checkbox
      const checkbox = within(cannedRoleRow).queryByRole('checkbox');
      expect(checkbox).not.toBeInTheDocument();
    }
  },
};

// =============================================================================
// FRAME 140 - ROLE DRAWER (PERMISSIONS TAB)
// =============================================================================

/**
 * TBD: Role drawer with Permissions tab
 *
 * DESIGN: Roles/Frame 140.png
 * Drawer with 2 tabs, Permissions tab shows table with Application, Resource type, Operation
 */
export const RoleDrawerPermissionsTab: Story = {
  name: '📋 TBD: Role drawer - Permissions tab (Frame 140)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Role Drawer Permissions Tab',
      designRef: 'Roles/Frame 140.png',
      designImage: '/mocks/Roles/Frame 140.png',
      currentState: 'No role drawer exists - clicking navigates to full page',
      expectedBehavior: [
        'Drawer opens with role name as title',
        'Two tabs: "Permissions" and "Assigned user groups"',
        'Permissions tab shows table with columns: Application, Resource type, Operation',
        'Example row: "inventory | hosts | read"',
      ],
      implementation: [
        'Create RoleDetailsDrawer component',
        'Add tab container with Permissions and Assigned user groups tabs',
        'Create PermissionsTable showing Application, Resource type, Operation',
        'Parse permission string (e.g., "inventory:hosts:read") into columns',
      ],
      relatedFiles: ['Create: src/features/roles/components/RoleDetailsDrawer.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Click on a role to open drawer
    const rows = canvas.getAllByRole('row');
    if (rows.length > 1) {
      await user.click(rows[1]);
      await delay(500);

      // TDD: Drawer should have two tabs
      const permissionsTab = canvas.queryByRole('tab', { name: /permissions/i });
      const assignedGroupsTab = canvas.queryByRole('tab', { name: /assigned user groups/i });

      expect(permissionsTab).toBeInTheDocument();
      expect(assignedGroupsTab).toBeInTheDocument();

      // TDD: Permissions tab should show table with specific columns
      if (permissionsTab) {
        await user.click(permissionsTab);
        await delay(300);

        const permTable = canvas.queryByRole('table');
        if (permTable) {
          const headers = within(permTable).getAllByRole('columnheader');
          const headerTexts = headers.map((h) => h.textContent?.toLowerCase() || '');

          expect(headerTexts.some((h) => h.includes('application'))).toBe(true);
          expect(headerTexts.some((h) => h.includes('resource type'))).toBe(true);
          expect(headerTexts.some((h) => h.includes('operation'))).toBe(true);
        }
      }
    }
  },
};

// =============================================================================
// FRAME 141 - ROLE DRAWER (ASSIGNED USER GROUPS TAB)
// =============================================================================

/**
 * TBD: Role drawer with Assigned user groups tab
 *
 * DESIGN: Roles/Frame 141.png
 * Shows which user groups have this role, via which workspace
 */
export const RoleDrawerAssignedUserGroupsTab: Story = {
  name: '📋 TBD: Role drawer - Assigned user groups tab (Frame 141)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Role Drawer Assigned User Groups Tab',
      designRef: 'Roles/Frame 141.png',
      designImage: '/mocks/Roles/Frame 141.png',
      currentState: 'No role drawer exists',
      expectedBehavior: [
        '"Assigned user groups" tab with ? icon showing popover explanation',
        'Table columns: User group, Workspace assignment (TBD)',
        'Popover text: "User groups are granted roles... Roles are limited to the workspace in which they were assigned."',
        'Example rows: "Powerpuff girls | All of Medical Imaging IT"',
      ],
      implementation: [
        'Add Assigned user groups tab to RoleDetailsDrawer',
        'Create table with User group and Workspace columns',
        'Add ? icon with Popover component explaining the tab',
        'Fetch role assignments by user group',
      ],
      relatedFiles: ['Create: src/features/roles/components/RoleDetailsDrawer.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Click on a role to open drawer
    const rows = canvas.getAllByRole('row');
    if (rows.length > 1) {
      await user.click(rows[1]);
      await delay(500);

      // TDD: Click on Assigned user groups tab
      const assignedGroupsTab = canvas.queryByRole('tab', { name: /assigned user groups/i });
      if (assignedGroupsTab) {
        await user.click(assignedGroupsTab);
        await delay(300);

        // TDD: Should show table with User group and Workspace columns
        const table = canvas.queryByRole('table');
        if (table) {
          const headers = within(table).getAllByRole('columnheader');
          const headerTexts = headers.map((h) => h.textContent?.toLowerCase() || '');

          expect(headerTexts.some((h) => h.includes('user group'))).toBe(true);
          expect(headerTexts.some((h) => h.includes('workspace'))).toBe(true);
        }

        // TDD: Should have ? icon for popover
        const infoIcon = canvas.queryByRole('button', { name: /info/i }) || canvas.queryByLabelText(/info/i);
        expect(infoIcon).toBeInTheDocument();
      }
    }
  },
};

// =============================================================================
// FRAME 181 - EMPTY PERMISSIONS STATE
// =============================================================================

/**
 * TBD: Empty permissions state with Edit role button
 *
 * DESIGN: Roles/Frame 181.png
 * Shows empty state when role has no displayable permissions
 */
export const RoleDrawerEmptyPermissions: Story = {
  name: '📋 TBD: Empty permissions state (Frame 181)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Empty Permissions State',
      designRef: 'Roles/Frame 181.png',
      designImage: '/mocks/Roles/Frame 181.png',
      currentState: 'No role drawer exists',
      expectedBehavior: [
        'Empty state shows "No permissions" with + icon',
        'Text: "There are no permissions in this role."',
        'Custom roles: Show "Edit role" button',
        'Canned roles: DO NOT show the Edit button, just empty state',
      ],
      implementation: [
        'Create EmptyPermissionsState component',
        'Show "Edit role" button conditionally (only for custom roles)',
        'Handle OCM roles or roles where permissions cannot be displayed',
      ],
      relatedFiles: ['Create: src/features/roles/components/EmptyPermissionsState.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // TDD: When viewing a role with no permissions, should show empty state
    // This test describes expected behavior for empty state
    // Note: This test will only pass once the drawer and empty state are implemented
    // and we navigate to a role with no permissions

    // Placeholder assertion - actual test would:
    // 1. Open a role drawer for a role with no permissions
    // 2. Verify "No permissions" empty state appears
    // 3. Verify "Edit role" button appears for custom roles
    expect(true).toBe(true); // Placeholder until feature is built
  },
};

// =============================================================================
// FRAME 147, 157, 178 - EDITING A ROLE
// =============================================================================

/**
 * TBD: Edit role from kebab menu
 *
 * DESIGN: Editing a role/Frame 147.png
 * Shows kebab menu with "Edit role" option
 */
export const EditRoleFromKebab: Story = {
  name: '📋 TBD: Edit role from kebab menu (Frame 147)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Edit Role from Kebab Menu',
      designRef: 'Editing a role/Frame 147.png',
      designImage: '/mocks/Editing a role/Frame 147.png',
      currentState: 'Kebab menu exists with Edit option',
      expectedBehavior: [
        'Kebab menu on custom role rows has "Edit role" option',
        'Clicking "Edit role" navigates to edit form',
        'Only custom roles have edit option (not canned roles)',
      ],
      implementation: ['Verify Edit role option in kebab menu', 'Navigate to edit page on click'],
      relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Find kebab menu for a custom role
    const kebabButtons = canvas.getAllByRole('button', { name: /actions/i });
    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);
      await delay(300);

      // TDD: Should have Edit option
      const editOption = canvas.queryByRole('menuitem', { name: /edit/i });
      expect(editOption).toBeInTheDocument();
    }
  },
};

/**
 * TBD: Edit role full page form with Application filter
 *
 * DESIGN: Editing a role/Frame 157.png
 * Shows full page form with Application dropdown filter
 */
export const EditRoleForm: Story = {
  name: '📋 TBD: Edit role form with Application filter (Frame 157)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Edit Role Form with Application Filter',
      designRef: 'Editing a role/Frame 157.png',
      designImage: '/mocks/Editing a role/Frame 157.png',
      currentState: 'Edit form exists but may not have Application filter',
      expectedBehavior: [
        'Full page form (not wizard)',
        'Pre-filled fields: Name, Description',
        'Application dropdown filter for permissions',
        'Table with columns: Application, Resource type, Operation',
        'All/Selected toggle for permissions view',
        'Save/Cancel buttons',
      ],
      implementation: [
        'Add Application dropdown filter to edit form',
        'Fetch applications from /api/rbac/v1/applications/',
        'Filter permissions table based on selected application',
        'Add All/Selected toggle',
      ],
      relatedFiles: ['src/features/roles/edit-role/EditRole.tsx', 'src/features/roles/edit-role/EditRolePermissions.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Open kebab and click Edit
    const kebabButtons = canvas.getAllByRole('button', { name: /actions/i });
    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);
      await delay(300);

      const editOption = await canvas.findByRole('menuitem', { name: /edit/i });
      await user.click(editOption);
      await delay(500);

      // TDD: Edit form should have Application filter
      const applicationFilter = canvas.queryByRole('button', { name: /application/i }) || canvas.queryByLabelText(/application/i);
      expect(applicationFilter).toBeInTheDocument();

      // TDD: Should have table with specific columns
      const editTable = canvas.queryByRole('table');
      if (editTable) {
        const headers = within(editTable).getAllByRole('columnheader');
        const headerTexts = headers.map((h) => h.textContent?.toLowerCase() || '');

        expect(headerTexts.some((h) => h.includes('application'))).toBe(true);
        expect(headerTexts.some((h) => h.includes('resource type'))).toBe(true);
        expect(headerTexts.some((h) => h.includes('operation'))).toBe(true);
      }
    }
  },
};

// =============================================================================
// FRAME 160-180 - DELETING A ROLE
// =============================================================================

/**
 * TBD: Delete role confirmation modal
 *
 * DESIGN: Deleting a role/Frame 160.png
 * Shows delete confirmation with checkbox
 */
export const DeleteRoleConfirmation: Story = {
  name: '📋 TBD: Delete role confirmation (Frame 160)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Delete Role Confirmation Modal',
      designRef: 'Deleting a role/Frame 160.png',
      designImage: '/mocks/Deleting a role/Frame 160.png',
      currentState: 'Delete modal exists - verify checkbox behavior',
      expectedBehavior: [
        'Warning modal appears on delete action',
        'Shows role name being deleted',
        'Checkbox to confirm: "I understand this action cannot be undone"',
        'Delete button disabled until checkbox is checked',
        'Success notification after deletion',
      ],
      implementation: ['Verify checkbox disables Delete button', 'Handle bulk delete with proper messaging'],
      relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Open kebab and click Delete
    const kebabButtons = canvas.getAllByRole('button', { name: /actions/i });
    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);
      await delay(300);

      const deleteOption = canvas.queryByRole('menuitem', { name: /delete/i });
      if (deleteOption) {
        await user.click(deleteOption);
        await delay(500);

        // TDD: Modal should have checkbox
        const checkbox = canvas.queryByRole('checkbox');
        expect(checkbox).toBeInTheDocument();

        // TDD: Delete button should be disabled initially
        const deleteButton = canvas.queryByRole('button', { name: /^delete$/i });
        if (deleteButton && checkbox) {
          expect(deleteButton).toBeDisabled();

          // Check the checkbox
          await user.click(checkbox);

          // Now delete should be enabled
          expect(deleteButton).toBeEnabled();
        }
      }
    }
  },
};

/**
 * TBD: Bulk delete roles
 *
 * DESIGN: Deleting a role/Frame 161.png
 * Shows bulk selection and delete
 */
export const BulkDeleteRoles: Story = {
  name: '📋 TBD: Bulk delete roles (Frame 161)',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  decorators: [
    withTBD({
      title: 'Bulk Delete Roles',
      designRef: 'Deleting a role/Frame 161.png',
      designImage: '/mocks/Deleting a role/Frame 161.png',
      currentState: 'Need to verify bulk selection and delete works',
      expectedBehavior: [
        'Checkboxes appear on custom role rows',
        'Selecting multiple roles enables bulk actions',
        'Delete action shows count of roles to delete',
        'Modal lists all selected roles',
      ],
      implementation: ['Verify bulk selection UI', 'Verify bulk delete modal shows all selected roles'],
      relatedFiles: ['src/features/roles/RolesWithWorkspaces.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // TDD: Select multiple rows
    const checkboxes = canvas.getAllByRole('checkbox');
    if (checkboxes.length > 2) {
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);
      await delay(300);

      // TDD: Bulk delete action should be available
      const bulkDeleteButton = canvas.queryByRole('button', { name: /delete/i });
      expect(bulkDeleteButton).toBeInTheDocument();
    }
  },
};

// =============================================================================
// NAVIGATION
// =============================================================================

/**
 * TBD: Navigate to Roles from sidebar
 */
export const NavigateToRoles: Story = {
  name: '✓ Navigate to Roles from sidebar',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/overview',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');

    // Verify we're on the Roles page
    const pageTitle = await canvas.findByRole('heading', { name: /roles/i });
    expect(pageTitle).toBeInTheDocument();
  },
};
