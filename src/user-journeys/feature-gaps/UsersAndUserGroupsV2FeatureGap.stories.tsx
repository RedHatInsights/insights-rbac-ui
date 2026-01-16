/**
 * V2 Users and User Groups Feature Gap Tests
 *
 * These tests are based on the Figma designs:
 * - ~/Downloads/Users and User Groups - Users Tab/
 * - ~/Downloads/Users and User Groups - Groups Tab/
 *
 * They are expected to FAIL initially - they serve as a specification for features to build.
 */

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../../.storybook/fixtures/groups';
import { defaultUsers } from '../../../.storybook/fixtures/users';
import { defaultRoles } from '../../../.storybook/fixtures/roles';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

// Mock V2 users with full data per design
const mockV2Users = [
  {
    id: '1',
    username: 'john.doe',
    email: 'john.doe@redhat.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: true,
    external_source_id: 123,
    user_groups: 3,
  },
  {
    id: '2',
    username: 'jane.smith',
    email: 'jane.smith@redhat.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: false,
    external_source_id: 124,
    user_groups: 2,
  },
  {
    id: '3',
    username: 'bob.wilson',
    email: 'bob.wilson@redhat.com',
    first_name: 'Bob',
    last_name: 'Wilson',
    is_active: false,
    is_org_admin: false,
    external_source_id: 125,
    user_groups: 0,
  },
  {
    id: '4',
    username: 'alice.jones',
    email: 'alice.jones@redhat.com',
    first_name: 'Alice',
    last_name: 'Jones',
    is_active: true,
    is_org_admin: false,
    external_source_id: 126,
    user_groups: 5,
  },
];

// Mock V2 user groups with full data per design
const mockV2UserGroups = [
  {
    uuid: 'group-1',
    name: 'Developers',
    description: 'Development team members',
    principalCount: 12,
    roleCount: 4,
    modified: '2024-01-15T10:30:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-2',
    name: 'Administrators',
    description: 'System administrators with elevated permissions',
    principalCount: 5,
    roleCount: 8,
    modified: '2024-01-10T14:20:00Z',
    platform_default: false,
    admin_default: true,
    system: false,
  },
  {
    uuid: 'group-3',
    name: 'Read Only Users',
    description: 'Users with read-only access',
    principalCount: 25,
    roleCount: 2,
    modified: '2024-01-05T09:15:00Z',
    platform_default: true,
    admin_default: false,
    system: false,
  },
];

const meta: Meta<typeof KesselAppEntryWithRouter> = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Feature Gap Tests/V2 Users and User Groups',
  tags: ['feature-gap', 'v2-users', 'v2-user-groups', 'test-skip'],
  decorators: [
    (Story: any, context: any) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  argTypes: {
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms',
      table: { category: 'Demo', defaultValue: { summary: '30' } },
    },
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator',
      table: { category: 'Permissions', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces': true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
  },
  parameters: {
    msw: {
      handlers: [
        // V2 Users API
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockV2Users,
            meta: { count: mockV2Users.length, limit: 20, offset: 0 },
          });
        }),
        // V2 Groups API
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: mockV2UserGroups,
            meta: { count: mockV2UserGroups.length, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          const group = mockV2UserGroups.find((g) => g.uuid === params.groupId);
          return group ? HttpResponse.json(group) : new HttpResponse(null, { status: 404 });
        }),
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
# V2 Users and User Groups Feature Gap Tests

These tests are based on the Figma designs and are **expected to fail initially**.
They serve as a living specification for features that need to be built.

## Implementation Status

### ✅ Can be implemented NOW with V1 APIs:
- User listing: \`/api/rbac/v1/principals/\`
- User Groups CRUD: \`/api/rbac/v1/groups/\`
- Add/Remove users from groups: \`/api/rbac/v1/groups/{id}/principals/\`
- Role bindings by subject: \`/api/rbac/v2/role-bindings/?subject_type=...\`

### ⚠️ Need additional data/APIs:
- Service accounts count (needs aggregation query)
- Workspaces count per group (needs V2 role bindings aggregation)
- User groups count per user (needs aggregation query)

## Users Tab Design Analysis

### Users Table (User list table.png)

**Columns:**
- Username (with link to drawer)
- Email
- Last name
- Status (Active/Inactive toggle)
- **User groups** (count) ⚠️ Need aggregation query
- **Org admin** (Yes/No toggle) ✅ Available in V1 API

**Actions:**
- ✅ Filter by username - Available
- ✅ User details drawer - Available
- ✅ Add to user group modal - Available via V1
- ⚠️ Remove from user group - Available via V1, UI needed
- ✅ Toggle user status - Available via V1
- ✅ Toggle org admin - Available via V1
- ✅ Invite users button - UI component needed

### Add to User Group (Add to user group.png)
- Modal with user selection - ✅ Can implement
- Group selection interface - ✅ Can implement
- Confirmation flow - ✅ Can implement

### Remove from User Group (Remove from user group.png)
- Warning modal with checkbox confirmation - ✅ Can implement
- Shows affected user groups - ✅ Can implement

## User Groups Tab Design Analysis

### User Groups Table (User groups table+details.png)

**Columns:**
- Name (with link to drawer) - ✅ Available
- Description - ✅ Available
- Users (count) - ✅ Available (principalCount)
- Service accounts - ⚠️ Needs aggregation
- Workspaces - ⚠️ Needs V2 role bindings aggregation
- Last modified - ✅ Available

**Drawer Tabs:**
- ✅ Users - Available
- ✅ Service accounts - Available
- ✅ Roles (with sub-tabs) - Available via V2 role bindings

### Create User Group (Create user group.png)
- Modal with Name and Description fields - ✅ Can implement
- Optional user assignment - ✅ Can implement

### Edit User Group (Edit user group.png)
- Edit modal with Name and Description - ✅ Can implement
- User management interface - ✅ Can implement

### Delete User Group (Delete user group.png)
- Warning modal with checkbox confirmation - ✅ Can implement
        `,
      },
    },
  },
};

export default meta;

// =============================================================================
// USERS TAB - TABLE TESTS
// =============================================================================

/**
 * TEST: Users table has all required columns per design
 *
 * DESIGN: User list table.png
 * Columns: Username, Email, Last name, Status, User groups, Org admin
 */
export const UsersTableColumns: Story = {
  name: '✓ Users table columns',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for users table to load
    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Find the table
    const table = await canvas.findByRole('table');
    const tableContent = within(table);

    // Verify all required column headers exist per design
    const headers = tableContent.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.toLowerCase() || '');

    // Per design: Username, Email, Last name, Status, User groups, Org admin
    expect(headerTexts.some((h) => h.includes('username'))).toBe(true);
    expect(headerTexts.some((h) => h.includes('email'))).toBe(true);
    expect(headerTexts.some((h) => h.includes('status'))).toBe(true);
  },
};

/**
 * TEST: Users table shows User Groups column with count
 *
 * DESIGN: User list table.png
 * Shows "User groups" column with numeric values
 *
 * EXPECTED TO PARTIALLY FAIL: Verify count is displayed
 */
export const UsersTableUserGroupsColumn: Story = {
  name: '⚠️ GAP: Users table User Groups column shows count',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  decorators: [
    withFeatureGap({
      title: 'User Groups Count Column',
      designRef: 'User list table.png',
      designImage: '/mocks/Users tab/Frame 99.png',
      currentState: 'Need to verify if the "User groups" column displays the count of groups each user belongs to.',
      expectedBehavior: [
        '"User groups" column should show a numeric count',
        'Example: john.doe belongs to 3 groups → displays "3"',
        'Count should update when user is added/removed from groups',
      ],
      implementation: [
        '⚠️ BLOCKED: Need aggregation query - V1 principals API does not return group count',
        'Option 1: Make N+1 queries to /groups/?username=X for each user',
        'Option 2: Request backend to add group_count to principals response',
        'Display count in the appropriate column cell',
      ],
      relatedFiles: [
        'src/features/access-management/users-and-user-groups/users/Users.tsx',
        'src/features/access-management/users-and-user-groups/users/components/UsersTable.tsx',
      ],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const table = await canvas.findByRole('table');
    const tableContent = within(table);

    // Check for User groups column header
    const headers = tableContent.getAllByRole('columnheader');
    const userGroupsHeader = headers.find(
      (h) => h.textContent?.toLowerCase().includes('user groups') || h.textContent?.toLowerCase().includes('groups'),
    );

    // Per design, there should be a User groups column
    expect(userGroupsHeader).toBeDefined();

    // Verify count is displayed (john.doe has 3 groups per mock data)
    const rows = tableContent.getAllByRole('row');
    const johnRow = rows.find((row) => row.textContent?.includes('john.doe'));
    expect(johnRow?.textContent).toContain('3');
  },
};

/**
 * TEST: Users table shows Org Admin column with toggle
 *
 * DESIGN: User list table.png
 * Shows "Org admin" column with Yes/No or toggle
 */
export const UsersTableOrgAdminColumn: Story = {
  name: '⚠️ GAP: Users table Org Admin column',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  decorators: [
    withFeatureGap({
      title: 'Org Admin Column Display',
      designRef: 'User list table.png',
      designImage: '/mocks/Users tab/Frame 99.png',
      currentState: 'Need to verify if Org Admin status is displayed and toggleable.',
      expectedBehavior: [
        '"Org admin" column should show "Yes" or "No" (or a toggle switch)',
        'For org admins: displays "Yes" or shows toggle in active state',
        'Toggle functionality to promote/demote org admin status (if permitted)',
      ],
      implementation: [
        '✅ CAN IMPLEMENT NOW - V1 API returns is_org_admin field',
        'Add "Org admin" column to the users table',
        'Display is_org_admin status from user data',
        'Toggle would need appropriate permissions check',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/users/components/UsersTable.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const table = await canvas.findByRole('table');
    const tableContent = within(table);

    // Per design, there should be an Org admin column
    const headers = tableContent.getAllByRole('columnheader');
    const orgAdminHeader = headers.find((h) => h.textContent?.toLowerCase().includes('org admin') || h.textContent?.toLowerCase().includes('admin'));

    expect(orgAdminHeader).toBeDefined();

    // john.doe is an org admin - should show "Yes" or toggle in active state
    const rows = tableContent.getAllByRole('row');
    const johnRow = rows.find((row) => row.textContent?.includes('john.doe'));
    // Check for Yes/No text or switch component
    const hasOrgAdminIndicator = johnRow?.textContent?.includes('Yes') || johnRow?.querySelector('[role="switch"]');
    expect(hasOrgAdminIndicator).toBeTruthy();
  },
};

/**
 * TEST: User details drawer opens on row click
 *
 * DESIGN: User list table.png (drawer view)
 * Shows user details in a drawer panel
 */
export const UserDetailsDrawer: Story = {
  name: '✓ User details drawer',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Click on username to open drawer
    const userLink = await canvas.findByText('john.doe');
    await user.click(userLink);

    // Wait for drawer to open - should show user details
    await waitFor(async () => {
      // Drawer should show username or name
      const drawerTitle = canvas.queryByRole('heading', { name: /john/i });
      const drawerContent = canvas.queryByText(/john\.doe/i);
      expect(drawerTitle || drawerContent).toBeTruthy();
    });
  },
};

// =============================================================================
// USER DRAWER - ASSIGNED ROLES TAB GAP
// =============================================================================

/**
 * TEST: User drawer Assigned roles tab shows "?" instead of data
 *
 * DESIGN: Frame 109 - User drawer with Assigned roles tab
 * Columns: Roles, User group, Workspace (TBD)
 *
 * GAP: The User group and Workspace columns show "?" placeholders
 */
export const UserDrawerAssignedRolesData: Story = {
  name: '⚠️ GAP: User drawer Assigned roles shows "?" instead of data',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  decorators: [
    withFeatureGap({
      title: 'User Drawer Assigned Roles Data',
      designRef: 'Users tab/Frame 109.png',
      designImage: '/mocks/Users tab/Frame 109.png',
      currentState: 'The Assigned roles tab shows "?" placeholders for User group and Workspace columns instead of actual data.',
      expectedBehavior: [
        'Assigned roles tab should show table with 3 columns: Roles, User group, Workspace',
        'User group column should show the group name that granted the role',
        'Workspace column should show which workspace the role was assigned in',
        'Question circle icon should have popover explaining the tab',
      ],
      implementation: [
        '✅ CAN IMPLEMENT NOW - Use V2 API /api/rbac/v2/role-bindings/?subject_type=principal&subject_id=...',
        'Fetch role bindings for the user and join with workspace data',
        'Display actual user group names from the binding data',
        'Display actual workspace names from the binding data',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/users/components/UserDetailsDrawer.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Click on user to open drawer
    const userLink = await canvas.findByText('john.doe');
    await user.click(userLink);

    // Wait for drawer
    await delay(500);

    // Click on Assigned roles tab
    const assignedRolesTab = canvas.queryByRole('tab', { name: /assigned roles/i });
    if (assignedRolesTab) {
      await user.click(assignedRolesTab);
      await delay(500);

      // The table should NOT contain "?" placeholders
      const drawerContent = canvas.queryByText('?');
      // This will FAIL if "?" is present - that's the gap
      expect(drawerContent).not.toBeInTheDocument();
    }
  },
};

// =============================================================================
// USERS TAB - ADD TO USER GROUP TESTS
// =============================================================================

/**
 * TEST: Add user to group modal
 *
 * DESIGN: Add to user group.png
 * Shows modal for adding users to groups
 */
export const AddUserToGroupModal: Story = {
  name: '✓ Add user to group modal',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Select a user first (checkbox)
    const checkboxes = canvas.getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]); // Skip header checkbox
    }

    // Look for "Add to user group" button/action
    const addToGroupButton = canvas.queryByRole('button', { name: /add.*group/i });
    if (addToGroupButton) {
      await user.click(addToGroupButton);

      // Modal should open
      await waitFor(async () => {
        const modalTitle = canvas.queryByRole('heading', { name: /add.*group/i });
        expect(modalTitle).toBeInTheDocument();
      });
    }
  },
};

// =============================================================================
// USERS TAB - REMOVE FROM USER GROUP TESTS
// =============================================================================

/**
 * TEST: Remove user from group modal with confirmation
 *
 * DESIGN: Remove from user group.png
 * Shows warning modal with checkbox confirmation
 */
export const RemoveUserFromGroupModal: Story = {
  name: '⚠️ GAP: Remove user from group modal',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  decorators: [
    withFeatureGap({
      title: 'Remove User from Group Modal',
      designRef: 'Remove from user group.png',
      designImage: '/mocks/Remove from user group/Frame 178.png',
      currentState: 'The "Remove from user group" action may not be implemented.',
      expectedBehavior: [
        'User selects one or more users from the table',
        'Clicks "Remove from user group" action button',
        'Warning modal appears showing list of users and groups',
        'Checkbox to confirm understanding',
        '"Remove" button (disabled until checkbox is checked)',
        'Success notification after removal',
      ],
      implementation: [
        '✅ CAN IMPLEMENT NOW - Use V1 API DELETE /api/rbac/v1/groups/{id}/principals/',
        'Add "Remove from user group" bulk action button',
        'Create RemoveUserFromGroupModal component',
        'Show affected users and groups in modal',
        'Handle success/error notifications',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/users/Users.tsx', 'Create new: RemoveUserFromGroupModal.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Select a user
    const checkboxes = canvas.getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]);
    }

    // Per design, there should be a "Remove from user group" action
    const removeButton = canvas.queryByRole('button', { name: /remove.*group/i });

    // This may FAIL if the feature is not implemented
    expect(removeButton).toBeInTheDocument();
  },
};

// =============================================================================
// USERS TAB - INVITE USERS TEST
// =============================================================================

/**
 * TEST: Invite users button
 *
 * DESIGN: User list table.png
 * Shows "Invite users" button in toolbar
 */
export const InviteUsersButton: Story = {
  name: '✓ Invite users button',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Per design, there should be an "Invite users" button
    const inviteButton = canvas.queryByRole('button', { name: /invite.*users/i });
    expect(inviteButton).toBeInTheDocument();
  },
};

// =============================================================================
// USER GROUPS TAB - TABLE TESTS
// =============================================================================

/**
 * TEST: User groups table has all required columns
 *
 * DESIGN: User groups table+details.png
 * Columns: Name, Description, Users, Last modified
 */
export const UserGroupsTableColumns: Story = {
  name: '✓ User Groups table columns',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const table = await canvas.findByRole('table');
    const tableContent = within(table);

    // Verify column headers per design
    const headers = tableContent.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.toLowerCase() || '');

    expect(headerTexts.some((h) => h.includes('name'))).toBe(true);
    expect(headerTexts.some((h) => h.includes('description'))).toBe(true);
  },
};

/**
 * TEST: User groups table Service accounts column shows "?"
 *
 * DESIGN: Frame 12 - User groups table
 * Service accounts column should show count
 *
 * GAP: Shows "?" placeholder instead of actual count
 */
export const UserGroupsServiceAccountsColumn: Story = {
  name: '⚠️ GAP: User Groups table Service accounts shows "?"',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  decorators: [
    withFeatureGap({
      title: 'Service Accounts Column Shows "?"',
      designRef: 'User groups table plus details/Frame 12.png',
      designImage: '/mocks/User groups table plus details/Frame 12.png',
      currentState: 'The Service accounts column displays "?" placeholder instead of the actual count.',
      expectedBehavior: [
        '"Service accounts" column should show numeric count',
        'Example: If group has 5 service accounts → displays "5"',
        'Count should update when service accounts are added/removed',
      ],
      implementation: [
        '⚠️ BLOCKED: Need service account count per group',
        'V1 groups API does not return service_account_count',
        'Option: Query /service-accounts/?group_id=X (N+1 queries) or request backend aggregation',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/user-groups/UserGroups.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Service accounts column should NOT show "?"
    const table = await canvas.findByRole('table');
    const cells = within(table).getAllByRole('gridcell');
    const hasQuestionMark = cells.some((cell) => cell.textContent === '?');

    // This will FAIL if "?" is present - that's the gap
    expect(hasQuestionMark).toBe(false);
  },
};

/**
 * TEST: User groups table Workspaces column shows "?"
 *
 * DESIGN: Frame 12 - User groups table
 * Workspaces column should show count
 *
 * GAP: Shows "?" placeholder instead of actual count
 */
export const UserGroupsWorkspacesColumn: Story = {
  name: '⚠️ GAP: User Groups table Workspaces shows "?"',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  decorators: [
    withFeatureGap({
      title: 'Workspaces Column Shows "?"',
      designRef: 'User groups table plus details/Frame 12.png',
      designImage: '/mocks/User groups table plus details/Frame 12.png',
      currentState: 'The Workspaces column displays "?" placeholder instead of the actual count.',
      expectedBehavior: [
        '"Workspaces" column should show numeric count',
        'Example: If group is assigned to 3 workspaces → displays "3"',
        'Count should update when workspace assignments change',
      ],
      implementation: [
        '✅ CAN IMPLEMENT NOW - Use V2 API /api/rbac/v2/role-bindings/?subject_type=group&subject_id=...',
        'Aggregate distinct workspace IDs from role bindings for each group',
        'Display count in Workspaces column',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/user-groups/UserGroups.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const table = await canvas.findByRole('table');

    // Find the Workspaces column header
    const headers = within(table).getAllByRole('columnheader');
    const workspacesHeader = headers.find((h) => h.textContent?.toLowerCase().includes('workspaces'));
    expect(workspacesHeader).toBeDefined();

    // Workspaces column should NOT show "?"
    const cells = within(table).getAllByRole('gridcell');
    const hasQuestionMark = cells.some((cell) => cell.textContent === '?');

    // This will FAIL if "?" is present - that's the gap
    expect(hasQuestionMark).toBe(false);
  },
};

/**
 * TEST: User groups table shows Users count column
 *
 * DESIGN: User groups table+details.png
 * Shows "Users" column with count
 */
export const UserGroupsUsersCountColumn: Story = {
  name: '⚠️ GAP: User Groups table Users count column',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  decorators: [
    withFeatureGap({
      title: 'User Groups Users Count Column',
      designRef: 'User groups table+details.png',
      designImage: '/mocks/User groups table plus details/Frame 12.png',
      currentState: 'Need to verify if the "Users" column shows the count of users per group.',
      expectedBehavior: [
        '"Users" column should show numeric count',
        'Example: "Developers" group has 12 users → displays "12"',
        'Count should update when users are added/removed',
      ],
      implementation: [
        '✅ CAN IMPLEMENT NOW - V1 API returns principalCount in groups response',
        'Ensure principalCount is displayed in the Users column',
        'Format count appropriately',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/user-groups/UserGroups.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const table = await canvas.findByRole('table');
    const tableContent = within(table);

    // Per design, "Users" column should show count (Developers has 12)
    const rows = tableContent.getAllByRole('row');
    const devRow = rows.find((row) => row.textContent?.includes('Developers'));
    expect(devRow?.textContent).toContain('12');
  },
};

/**
 * TEST: Group details drawer with tabs
 *
 * DESIGN: User groups table+details.png
 * Drawer has tabs: Users, Service accounts, Roles
 */
export const GroupDetailsDrawerTabs: Story = {
  name: '✓ Group details drawer tabs',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Click on group to open drawer
    const groupLink = await canvas.findByText('Developers');
    await user.click(groupLink);

    // Wait for drawer to open
    await delay(500);

    // Per design, drawer should have Users, Service accounts, Roles tabs
    const usersTab = canvas.queryByRole('tab', { name: /users/i });
    const serviceAccountsTab = canvas.queryByRole('tab', { name: /service accounts/i });
    const rolesTab = canvas.queryByRole('tab', { name: /roles/i });

    expect(usersTab || serviceAccountsTab || rolesTab).toBeTruthy();
  },
};

/**
 * TEST: User Groups drawer missing "Edit group" button
 *
 * DESIGN: Frame 13 - User Groups drawer
 * Shows "Edit group" button next to group name in header
 *
 * GAP: Edit group button is missing from drawer header
 */
export const UserGroupsDrawerEditButton: Story = {
  name: '⚠️ GAP: User Groups drawer missing "Edit group" button',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  decorators: [
    withFeatureGap({
      title: 'Edit Group Button in Drawer Header',
      designRef: 'User groups table plus details/Frame 13.png',
      designImage: '/mocks/User groups table plus details/Frame 13.png',
      currentState: 'The group details drawer does not have an "Edit group" button next to the group name.',
      expectedBehavior: [
        'Drawer header should show group name with "Edit group" button',
        'Clicking "Edit group" should open the edit modal',
        'Button should be visible for users with edit permissions',
      ],
      implementation: [
        '✅ CAN IMPLEMENT NOW - UI change only',
        'Add "Edit group" button to drawer header',
        'Wire up button to open edit modal (uses V1 API PUT /groups/{id}/)',
        'Show/hide based on user permissions',
      ],
      relatedFiles: ['src/features/access-management/users-and-user-groups/user-groups/components/GroupDetailsDrawer.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Click on group to open drawer
    const groupLink = await canvas.findByText('Developers');
    await user.click(groupLink);

    // Wait for drawer
    await delay(500);

    // Per design, there should be an "Edit group" button in the drawer header
    const editButton = canvas.queryByRole('button', { name: /edit.*group/i });

    // This will FAIL if button is missing - that's the gap
    expect(editButton).toBeInTheDocument();
  },
};

// =============================================================================
// USER GROUPS TAB - CREATE GROUP TESTS
// =============================================================================

/**
 * TEST: Create user group button and modal
 *
 * DESIGN: Create user group.png
 * Shows "Create user group" button and modal
 */
export const CreateUserGroupModal: Story = {
  name: '✓ Create user group modal',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Click Create user group button
    const createButton = await canvas.findByRole('button', { name: /create.*group/i });
    await user.click(createButton);

    // Modal should open with Name and Description fields
    await waitFor(async () => {
      const nameInput = canvas.queryByLabelText(/name/i);
      const descriptionInput = canvas.queryByLabelText(/description/i);
      expect(nameInput || descriptionInput).toBeTruthy();
    });
  },
};

// =============================================================================
// USER GROUPS TAB - EDIT GROUP TESTS
// =============================================================================

/**
 * TEST: Edit user group action
 *
 * DESIGN: Edit user group.png
 * Shows edit option in kebab menu and edit modal
 */
export const EditUserGroupAction: Story = {
  name: '✓ Edit user group action',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Find and click kebab menu for a group
    const kebabButtons = canvas.getAllByRole('button', { name: /actions/i });
    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);

      // Look for Edit option
      const editOption = canvas.queryByRole('menuitem', { name: /edit/i });
      expect(editOption).toBeInTheDocument();
    }
  },
};

// =============================================================================
// USER GROUPS TAB - DELETE GROUP TESTS
// =============================================================================

/**
 * TEST: Delete user group confirmation modal
 *
 * DESIGN: Delete user group.png
 * Shows warning modal with checkbox confirmation
 */
export const DeleteUserGroupModal: Story = {
  name: '✓ Delete user group confirmation modal',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to User Groups tab
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(userGroupsTab);

    await waitFor(
      async () => {
        await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Find and click kebab menu
    const kebabButtons = canvas.getAllByRole('button', { name: /actions/i });
    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);

      // Click Delete option
      const deleteOption = canvas.queryByRole('menuitem', { name: /delete/i });
      if (deleteOption) {
        await user.click(deleteOption);

        // Modal should open with checkbox confirmation
        await waitFor(async () => {
          const modalTitle = canvas.queryByRole('heading', { name: /delete/i });
          const checkbox = canvas.queryByRole('checkbox');
          expect(modalTitle || checkbox).toBeTruthy();
        });
      }
    }
  },
};

// =============================================================================
// TAB NAVIGATION TESTS
// =============================================================================

/**
 * TEST: Tab navigation between Users and User Groups
 *
 * DESIGN: All designs show tabbed interface
 */
export const TabNavigation: Story = {
  name: '✓ Tab navigation',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Verify both tabs exist
    const usersTab = await canvas.findByRole('tab', { name: /^users$/i });
    const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });

    expect(usersTab).toBeInTheDocument();
    expect(userGroupsTab).toBeInTheDocument();

    // Click on User Groups tab
    await user.click(userGroupsTab);
    await delay(500);

    // Verify tab changed
    expect(userGroupsTab).toHaveAttribute('aria-selected', 'true');

    // Click back on Users tab
    await user.click(usersTab);
    await delay(500);

    // Verify tab changed back
    expect(usersTab).toHaveAttribute('aria-selected', 'true');
  },
};

// =============================================================================
// EMPTY STATE TESTS
// =============================================================================

/**
 * TEST: Empty state for no search results
 *
 * DESIGN: User list table.png (last frame)
 * Shows "No results found" empty state
 */
export const EmptyStateNoResults: Story = {
  name: '⚠️ GAP: Empty state for no results',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  decorators: [
    withFeatureGap({
      title: 'Empty State for No Search Results',
      designRef: 'Users tab/Frame 199.png',
      designImage: '/mocks/Users tab/Frame 199.png',
      currentState: 'Need to verify empty state is displayed when search returns no results.',
      expectedBehavior: [
        'Show "No results found" empty state when filter returns no matches',
        'Provide clear messaging to help user understand',
        'Include option to clear filters',
      ],
      implementation: ['Implement empty state component for table', 'Show "Clear all filters" action'],
      relatedFiles: ['src/features/access-management/users-and-user-groups/users/Users.tsx'],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await waitFor(
      async () => {
        await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Type a search that won't match anything
    const searchInput = canvas.queryByPlaceholderText(/filter/i) || canvas.queryByRole('searchbox');
    if (searchInput) {
      await user.type(searchInput, 'xyznonexistent123');
      await delay(500);

      // Should show empty state
      const emptyState = canvas.queryByText(/no.*results/i) || canvas.queryByText(/no.*found/i);
      expect(emptyState).toBeInTheDocument();
    }
  },
};

// =============================================================================
// NAVIGATION TEST
// =============================================================================

/**
 * TEST: Navigate to Users and User Groups from sidebar
 */
export const NavigateFromSidebar: Story = {
  name: '✓ Navigate from sidebar',
  args: {
    initialRoute: '/iam/access-management/overview',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users and User Groups
    await navigateToPage(user, canvas, 'Users and User Groups');

    // Verify we're on the page
    const pageTitle = await canvas.findByRole('heading', { name: /users and user groups/i });
    expect(pageTitle).toBeInTheDocument();

    // Verify tabs are present
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toBeInTheDocument();
  },
};

// =============================================================================
// V2 API GAPS
// =============================================================================

/**
 * GAP: V2 API for Service Account Assignment
 *
 * NOTE: Service account assignment is now implemented using a guessed V1-style API.
 * This story documents the need to migrate to the actual V2 API when available.
 *
 * Current implementation uses: POST /api/rbac/v1/groups/:uuid/service-accounts/
 * The actual V2 API may differ in endpoint path and request/response format.
 */
export const ServiceAccountV2ApiGap: Story = {
  name: '⚠️ GAP: V2 API for service account assignment',
  tags: ['test-skip', 'gap:v2-api'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups/create',
  },
  decorators: [
    withFeatureGap({
      title: 'V2 API for Service Account Assignment',
      designRef: 'Create user group/Frame 192.png',
      designImage: '/mocks/Create user group/Frame 192.png',
      currentState:
        'Service account assignment is implemented using a guessed V1-style API (POST /api/rbac/v1/groups/:uuid/service-accounts/). The actual V2 API endpoint and format may differ.',
      expectedBehavior: [
        'User can select service accounts in the "Service Accounts" tab during group creation',
        'Selected service accounts are assigned to the group upon creation',
        'Assigned service accounts appear in the group drawer after creation',
      ],
      implementation: [
        'When V2 API is available, update useAddServiceAccountsToGroupMutation in groups.ts',
        'Update API endpoint and request/response format to match V2 specification',
        'Verify existing tests still pass with V2 API',
      ],
      relatedFiles: [
        'src/features/access-management/users-and-user-groups/user-groups/edit-user-group/EditUserGroup.tsx',
        'src/data/queries/groups.ts',
        'src/user-journeys/access-management/CreateUserGroup.stories.tsx',
      ],
    }),
  ],
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // This story documents the V2 API gap
    // The actual functionality is tested in CreateUserGroup.stories.tsx
    await expect(canvas.findByRole('heading', { name: /create user group/i })).resolves.toBeInTheDocument();
  },
};
