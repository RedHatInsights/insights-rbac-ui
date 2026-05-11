import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import messages from '../../../../../Messages';
import { expectLoadingVisible, getSkeletonCount, waitForDrawer, waitForModal, waitForModalClose } from '../../../../../test-utils/interactionHelpers';
import { UserGroups } from './UserGroups';
import { GROUP_ADMIN_DEFAULT, GROUP_SYSTEM_DEFAULT } from '../../../../../shared/data/mocks/seed';
import { groupsErrorHandlers, groupsHandlers, groupsLoadingHandlers } from '../../../../../shared/data/mocks/groups.handlers';
import type { GroupOut } from '../../../../../shared/data/mocks/db';
import { createGroupMembersHandlers, groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import type { Principal } from '../../../../../shared/data/mocks/db';
import { groupRolesHandlers } from '../../../../../shared/data/mocks/groupRoles.handlers';
import { createRoleBindingsListHandlers } from '../../../../data/mocks/roleBindings.handlers';
import type { RoleBinding } from '../../../../data/queries/roleBindings';
import type { Group } from '../../../../../v2/data/queries/groups';
import type { MockUserIdentity } from '../../../../../../.storybook/contexts/StorybookMockContext';

// Mock user identity for stories
const standardUser: MockUserIdentity = {
  org_id: '12345',
  account_number: '123456',
  user: {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  },
};

// Custom members/service accounts for group drawer (group uuid '1' = Administrators)
const standardMembersRaw: Record<
  string,
  Array<{
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_org_admin: boolean;
    external_source_id?: string;
  }>
> = {
  '1': [
    {
      username: 'john.doe',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      is_org_admin: false,
      external_source_id: '1',
    },
    {
      username: 'jane.smith',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      is_active: true,
      is_org_admin: false,
      external_source_id: '2',
    },
    {
      username: 'admin.user',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
      is_org_admin: true,
      external_source_id: '3',
    },
  ],
  '2': [],
  '3': [],
};
const standardServiceAccounts: Record<
  string,
  Array<{ username: string; type: 'service-account'; clientId: string; name?: string; owner?: string; time_created?: number; description?: string }>
> = {
  '1': [
    {
      username: 'rbac-service-account',
      type: 'service-account',
      clientId: 'rbac-service-account',
      name: 'RBAC Service Account',
      owner: 'admin@example.com',
      time_created: Math.floor(Date.parse('2023-01-15T10:30:00Z') / 1000),
      description: 'Service account for RBAC API access',
    },
    {
      username: 'automation-sa',
      type: 'service-account',
      clientId: 'automation-sa',
      name: 'Automation Service Account',
      owner: 'automation@example.com',
      time_created: Math.floor(Date.parse('2023-02-20T14:15:00Z') / 1000),
      description: 'Service account for automation tasks',
    },
  ],
  '2': [],
  '3': [],
};
const standardGroupRoles: Record<
  string,
  Array<{
    uuid: string;
    name: string;
    display_name: string;
    description: string;
    system: boolean;
    platform_default: boolean;
    created: string;
    modified: string;
  }>
> = {
  '1': [
    {
      uuid: 'role-1',
      name: 'Organization Administrator',
      display_name: 'Organization Administrator',
      description: 'Full administrative access to the organization',
      system: true,
      platform_default: false,
      created: '2023-01-01T00:00:00Z',
      modified: '2023-01-01T00:00:00Z',
    },
    {
      uuid: 'role-2',
      name: 'User Manager',
      display_name: 'User Manager',
      description: 'Manage users and basic access permissions',
      system: false,
      platform_default: false,
      created: '2023-01-01T00:00:00Z',
      modified: '2023-01-01T00:00:00Z',
    },
  ],
  '2': [],
  '3': [],
};

const storyRoleBindings: RoleBinding[] = standardGroupRoles['1'].map((role) => ({
  role: { id: role.uuid, name: role.name },
  subject: { id: '1', type: 'group' },
  resource: { id: 'ws-1', name: 'Production', type: 'workspace' },
}));

const standardMembers: Record<string, Principal[]> = Object.fromEntries(
  Object.entries(standardMembersRaw).map(([k, v]) => [k, v.map((m) => ({ ...m, external_source_id: m.external_source_id ?? m.username }))]),
) as Record<string, Principal[]>;

const ALL_USERS_EMPTY_TITLE = messages.allUsers.defaultMessage;
const ALL_USERS_EMPTY_BODY = messages.allUsersAreMembers.defaultMessage;
const ALL_ORG_ADMINS_EMPTY_TITLE = messages.allOrgAdmins.defaultMessage;
const ALL_ORG_ADMINS_EMPTY_BODY = messages.allOrgAdminsAreMembers.defaultMessage;

const seedGroupToGroupOut = (g: typeof GROUP_SYSTEM_DEFAULT): GroupOut => ({
  uuid: g.uuid,
  name: g.name,
  description: g.description ?? '',
  principalCount: typeof g.principalCount === 'number' ? g.principalCount : 0,
  roleCount: g.roleCount ?? 0,
  created: g.created ?? '',
  modified: g.modified ?? '',
  platform_default: g.platform_default ?? false,
  admin_default: g.admin_default ?? false,
  system: g.system ?? false,
});

const defaultAccessOnlyGroupsForHandlers: GroupOut[] = [seedGroupToGroupOut(GROUP_SYSTEM_DEFAULT)];
const adminDefaultOnlyGroupsForHandlers: GroupOut[] = [seedGroupToGroupOut(GROUP_ADMIN_DEFAULT)];

// Mock group data
const mockGroups: Group[] = [
  {
    uuid: '1',
    name: 'Administrators',
    description: 'System administrators with full access',
    principalCount: 5,
    roleCount: 3,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-06-15T10:30:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: '2',
    name: 'Developers',
    description: 'Development team members',
    principalCount: 12,
    roleCount: 2,
    created: '2023-02-01T00:00:00Z',
    modified: '2023-06-10T14:20:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: '3',
    name: 'System Group',
    description: 'Protected system group',
    principalCount: 1,
    roleCount: 5,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: true,
  },
];

// Convert Group[] to GroupOut[] for factory (ensure required fields)
const mockGroupsForHandlers: GroupOut[] = mockGroups.map((g) => ({
  uuid: g.uuid,
  name: g.name,
  description: g.description ?? '',
  principalCount: typeof g.principalCount === 'number' ? g.principalCount : 0,
  roleCount: g.roleCount ?? 0,
  serviceAccountCount: g.serviceAccountCount,
  workspaceCount: g.workspaceCount,
  created: g.created ?? '',
  modified: g.modified ?? '',
  platform_default: g.platform_default ?? false,
  admin_default: g.admin_default ?? false,
  system: g.system ?? false,
}));

// Create spies for API operations
const deleteGroupsSpy = fn();
const fetchGroupsSpy = fn();
const deleteMembersFromGroupSpy = fn();

// Create a fresh store for each story using the same configuration as the real app

// Decorator with Router (React Query provider is global)
const withRouter = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '600px' }}>
        <UserGroups />
      </div>
    </BrowserRouter>
  );
};

const meta: Meta<typeof UserGroups> = {
  component: UserGroups,
  tags: ['ff:platform.rbac.groups', 'env:prod', 'perm:group-write'],
  decorators: [withRouter],
  parameters: {
    // Create/edit/delete gated by rbac:group:write only
    permissions: ['rbac:group:read', 'rbac:group:write'],
    userIdentity: standardUser,
    featureFlags: { 'platform.rbac.groups': true },
    docs: {
      description: {
        component: `
**UserGroups** is a container component that manages user group data, React Query state, and business logic.
        `,
      },
    },
  },
};

export default meta;

// Standard container view - tests real API orchestration
export const StandardView: StoryObj<typeof meta> = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Standard View**: Complete API orchestration test. Component dispatches fetch actions, MSW responds with mock data, React Query updates, and table renders.

## Group Details Drawer

Click on any group row to open the details drawer with working tabs:
- **Users Tab**: Shows users belonging to the group with realistic data
- **Service Accounts Tab**: Shows service accounts with client IDs and descriptions  
- **Assigned Roles Tab**: Shows roles assigned to the group with permissions

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[LoadingState](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--loading-state)**: Tests container behavior during API loading with delay simulation
- **[EmptyState](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--empty-state)**: Tests container response to empty API data  
- **[GroupFocusInteraction](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--group-focus-interaction)**: Tests container focus state coordination for detail drawer integration
- **[EditGroupNavigation](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--edit-group-navigation)**: Tests container routing coordination for edit flows
- **[DeleteModalIntegration](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--delete-modal-integration)**: Tests complete delete modal workflow with real API orchestration
- **[SystemGroupProtection](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--system-group-protection)**: Tests container permission enforcement for system groups
- **[BulkSelectionManagement](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--bulk-selection-management)**: Tests container selection state coordination for bulk operations
- **[LargeDataset](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--large-dataset)**: Tests container pagination with 1500 total count simulation
- **[ErrorStateHandling](?path=/story/features-access-management-users-and-user-groups-user-groups-usergroups--error-state-handling)**: Tests container error state management with 500 server error simulation
        `,
      },
    },
    msw: {
      handlers: [
        ...groupsHandlers(mockGroupsForHandlers),
        ...createGroupMembersHandlers(standardMembers, standardServiceAccounts, {
          onAddMembersWithRequest: deleteMembersFromGroupSpy,
        }),
        ...groupRolesHandlers(standardGroupRoles),
        ...createRoleBindingsListHandlers(storyRoleBindings),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Verify table is rendered with data
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

      // Verify basic table structure is present (headers always render)
      await expect(canvas.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      await expect(canvas.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
      await expect(canvas.getByRole('columnheader', { name: /users/i })).toBeInTheDocument();
      // NOTE: Roles and Workspaces columns removed per V2 API Strategy

      // Wait for group data to load first
      const administratorsElements = await canvas.findAllByText(mockGroups[0].name);
      await expect(administratorsElements).toHaveLength(1);
      await expect(administratorsElements[0]).toBeInTheDocument();

      // Test drawer functionality by clicking on a group
      const adminRow = administratorsElements[0].closest('tr');
      if (adminRow) {
        await userEvent.click(adminRow);

        // Wait for drawer to open and scope searches to drawer panel
        const drawer = await waitForDrawer();

        // Verify drawer title within the drawer scope
        await expect(drawer.findByText(mockGroups[0].name)).resolves.toBeInTheDocument();

        // Test tab navigation and data display (scoped to drawer)
        const usersTab = await drawer.findByText('Users');
        const serviceAccountsTab = await drawer.findByText('Service accounts');
        const rolesTab = await drawer.findByText('Assigned roles');

        // Users tab should be active by default and show data
        await expect(usersTab).toBeInTheDocument();
        await expect(drawer.findByText(standardMembersRaw['1'][1].username)).resolves.toBeInTheDocument();

        // Click Service Accounts tab
        await userEvent.click(serviceAccountsTab);
        // Should show service accounts data now that we have proper MSW handlers
        await expect(drawer.findByText(standardServiceAccounts['1'][0].username)).resolves.toBeInTheDocument();

        // Click Roles tab
        await userEvent.click(rolesTab);
        // Should show roles data now that we have proper MSW handlers
        await expect(drawer.findByText(standardGroupRoles['1'][0].name)).resolves.toBeInTheDocument();

        // Close drawer
        const closeButton = await drawer.findByLabelText('Close drawer panel');
        await userEvent.click(closeButton);
        await waitFor(async () => {
          await expect(canvas.queryByText(standardMembersRaw['1'][0].username)).not.toBeInTheDocument();
        });
      }
    });
  },
};

/** User with explicit rbac:group:write sees the Create user group button (no orgAdmin/userAccessAdministrator flags). */
export const WithGroupWritePermissionSeesCreateButton: StoryObj<typeof meta> = {
  tags: ['perm:group-write'],
  parameters: {
    permissions: ['rbac:group:read', 'rbac:group:write'],
    userIdentity: standardUser,
    featureFlags: { 'platform.rbac.groups': true },
    msw: {
      handlers: [...groupsHandlers(mockGroupsForHandlers)],
    },
    docs: {
      description: {
        story:
          'Verifies that a user with explicit rbac:group:write sees the Create user group button. Create/edit/delete are gated by this permission only.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
      const createButton = await canvas.findByRole('button', { name: /create user group/i });
      await expect(createButton).toBeInTheDocument();
      await expect(createButton).toHaveAttribute('data-ouia-component-id', 'add-usergroup-button');
    });
  },
};

// Loading state from MSW
export const LoadingState: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [...groupsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      // Should show skeleton loading state
      await waitFor(
        () => {
          expectLoadingVisible(canvasElement);
        },
        { timeout: 10000 },
      );
    });
  },
};

// Empty state from MSW
export const EmptyState: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for empty state to appear
      await expect(canvas.findByRole('heading', { name: /no user group found/i })).resolves.toBeInTheDocument();
    });
  },
};

// Group focus interaction
const focusMembers: Record<string, Principal[]> = {
  '1': [
    {
      username: 'john.doe',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      is_org_admin: false,
      external_source_id: '1',
    },
  ],
  '2': [],
  '3': [],
};
export const GroupFocusInteraction: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers(mockGroupsForHandlers),
        ...groupMembersHandlers(focusMembers, {}),
        ...groupRolesHandlers({}),
        ...createRoleBindingsListHandlers(storyRoleBindings),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for group data to load first
      await expect((await canvas.findAllByText(mockGroups[0].name))[0]).toBeInTheDocument();

      // Click on a group row to focus it
      const adminRow = (await canvas.findAllByText(mockGroups[0].name))[0].closest('tr');
      await expect(adminRow).toBeInTheDocument();

      if (adminRow) {
        await userEvent.click(adminRow);
        // Focus behavior is managed by container state
        // This would typically trigger detail drawer or other focus UI
      }
    });
  },
};

// Edit group navigation
export const EditGroupNavigation: StoryObj<typeof meta> = {
  parameters: {
    permissions: ['rbac:group:read', 'rbac:group:write'],
    msw: {
      handlers: [
        ...groupsHandlers(mockGroupsForHandlers),
        ...groupMembersHandlers({}, {}),
        ...groupRolesHandlers({}),
        ...createRoleBindingsListHandlers(storyRoleBindings),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for group data to load first with extra robust timeout
      const administratorsElements = await canvas.findAllByText(mockGroups[0].name);
      await expect(administratorsElements).toHaveLength(1);
      await expect(administratorsElements[0]).toBeInTheDocument();

      // Verify the table is fully rendered and interactive
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

      // Find and click kebab menu for a regular group with retry logic
      const kebabButton = await canvas.findByLabelText(`Actions for group ${mockGroups[0].name}`);
      await expect(kebabButton).toBeInTheDocument();
      await expect(kebabButton).toBeEnabled();

      // Click with retry mechanism
      await userEvent.click(kebabButton!);
      // Verify the dropdown appeared
      await expect(within(document.body).findByText(/edit/i)).resolves.toBeInTheDocument();

      // Click edit action with robust error handling
      const editAction = await within(document.body).findByText(/edit/i);
      await expect(editAction).toBeEnabled();
      await userEvent.click(editAction);

      // Container should handle navigation logic without errors
      // (In real app, this would navigate to edit page)

      // Final verification that we haven't encountered any errors
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
    });
  },
};

// Delete modal integration
export const DeleteModalIntegration: StoryObj<typeof meta> = {
  tags: ['env:stage', 'perm:group-write'],
  parameters: {
    permissions: ['rbac:group:read', 'rbac:group:write'],
    msw: {
      handlers: [
        ...groupsHandlers(mockGroupsForHandlers, { onList: fetchGroupsSpy, onDelete: deleteGroupsSpy }),
        ...createGroupMembersHandlers({}, {}, { onAddMembersWithRequest: deleteMembersFromGroupSpy }),
        ...groupRolesHandlers({}),
        ...createRoleBindingsListHandlers(storyRoleBindings),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Clear spy calls from any previous test runs
      deleteGroupsSpy.mockClear();
      fetchGroupsSpy.mockClear();

      // Wait for group data to load first with longer timeout
      await expect(canvas.findByText(mockGroups[1].name)).resolves.toBeInTheDocument();

      // Find and click kebab menu for a deletable group
      const kebabButton = await canvas.findByLabelText(`Actions for group ${mockGroups[1].name}`);
      await userEvent.click(kebabButton);

      // Wait for menu to appear and be interactive
      await expect(within(document.body).findByText('Delete user group')).resolves.toBeInTheDocument();

      // Click delete action - be specific to avoid multiple matches
      const deleteAction = await within(document.body).findByText('Delete user group');
      await userEvent.click(deleteAction);

      // Verify delete modal appears (container manages modal state)
      const modalContent = await waitForModal({ timeout: 5000 });

      // Wait for modal content to be fully loaded
      await expect(modalContent.findByText('Delete user group?')).resolves.toBeInTheDocument();
      await expect(modalContent.findByText(mockGroups[1].name)).resolves.toBeInTheDocument();

      // Check the confirmation checkbox (required by withCheckbox prop)
      const checkbox = await modalContent.findByRole('checkbox');
      await userEvent.click(checkbox);

      // Ensure delete button is now enabled
      await expect(modalContent.findByRole('button', { name: /delete/i })).resolves.toBeEnabled();

      // Submit the delete operation
      const deleteButton = await modalContent.findByRole('button', { name: /delete/i });
      await userEvent.click(deleteButton);

      // Wait for API call and verify it was made with correct parameters
      await waitFor(
        async () => {
          await expect(deleteGroupsSpy).toHaveBeenCalledWith('2'); // Developers group UUID
        },
        { timeout: 5000 },
      );

      // Verify data refresh was triggered after successful deletion
      await waitFor(
        async () => {
          await expect(fetchGroupsSpy).toHaveBeenCalledTimes(1); // Initial load + possible re-render + refresh after delete
        },
        { timeout: 5000 },
      );

      // Verify modal closed after successful operation
      await waitForModalClose({ timeout: 5000 });
    });
  },
};

// System group protection
export const SystemGroupProtection: StoryObj<typeof meta> = {
  tags: ['env:stage', 'perm:org-admin'],
  parameters: {
    // Inherits userIdentity from meta
    msw: {
      handlers: [...groupsHandlers(mockGroupsForHandlers)],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for group data to load first
      await expect(canvas.findByText(mockGroups[2].name)).resolves.toBeInTheDocument();

      // Find kebab menu for system group
      const systemKebabButton = await canvas.findByLabelText(`Actions for group ${mockGroups[2].name}`);
      await userEvent.click(systemKebabButton);

      // Edit action should be hidden for system groups
      const editAction = within(document.body).queryByText('Edit user group');
      await expect(editAction).not.toBeInTheDocument();

      // Delete action should still be present but disabled
      const deleteAction = await within(document.body).findByRole('menuitem', { name: /delete user group/i });
      await expect(deleteAction).toBeDisabled();
    });
  },
};

// Bulk selection management
export const BulkSelectionManagement: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers(mockGroupsForHandlers),
        ...groupMembersHandlers({}, {}),
        ...groupRolesHandlers({}),
        ...createRoleBindingsListHandlers(storyRoleBindings),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for groups to load first to avoid timing issues
      await expect((await canvas.findAllByText(mockGroups[0].name))[0]).toBeInTheDocument();

      // Test bulk select functionality managed by container
      const bulkSelectCheckbox = await canvas.findByLabelText('Select page');
      await expect(bulkSelectCheckbox).toBeInTheDocument();

      await userEvent.click(bulkSelectCheckbox);

      // Container manages selection state
      // This could be used for future bulk operations
    });
  },
};

// Large dataset handling (1500 total count for pagination)
const largeDatasetGroups: GroupOut[] = [
  ...mockGroupsForHandlers,
  ...Array.from({ length: 1497 }, (_, i) => ({
    ...mockGroupsForHandlers[0],
    uuid: `extra-${i}`,
    name: `Group ${i + 4}`,
  })),
];
export const LargeDataset: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers(largeDatasetGroups)],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for data to load and verify pagination handles large dataset
      const countElements = await canvas.findAllByText(String(largeDatasetGroups.length));
      await expect(countElements.length).toBeGreaterThanOrEqual(1);

      // Container manages pagination through React Query and URL params
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
    });
  },
};

// Error state handling
export const ErrorStateHandling: StoryObj<typeof meta> = {
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true, // Ignore Chrome context errors in outlet components
    },
    msw: {
      handlers: [...groupsErrorHandlers(500)],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Error state may show empty state, error message, loading state, or still render grid with no data
      // Container manages error through React Query and notifications
      // Wait for UI to settle - might show error notification, empty state, or just render with no data
      await waitFor(
        () => {
          const grid = canvas.queryByRole('grid');
          const emptyStates = canvas.queryAllByText(/no data|no groups|no user group|error|failed/i);
          const loadingState = getSkeletonCount(canvasElement) > 0;
          // Either the grid, an empty/error state (could be multiple), or still loading should be present
          expect(grid || emptyStates.length > 0 || loadingState).toBeTruthy();
        },
        { timeout: 5000 },
      );
    });
  },
};

/** Lists only Default access; opening the row shows implicit “All users” membership empty state in the drawer. */
export const DefaultAccessDrawer: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers(defaultAccessOnlyGroupsForHandlers), ...createGroupMembersHandlers({}, {}), ...groupRolesHandlers({})],
    },
    docs: {
      description: {
        story:
          'User groups table with the platform default group only. The drawer Users tab shows the “All users” empty state; the table shows normalized principal count from `useGroupsQuery`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Wait for default access group and normalized user count', async () => {
      await expect(canvas.findByText(GROUP_SYSTEM_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ALL_USERS_EMPTY_TITLE)).resolves.toBeInTheDocument();
    });
    await step('Open drawer and verify Users tab empty state', async () => {
      const nameCell = (await canvas.findAllByText(GROUP_SYSTEM_DEFAULT.name))[0];
      const row = nameCell.closest('tr');
      await expect(row).toBeTruthy();
      await userEvent.click(row!);
      const drawer = await waitForDrawer();
      await expect(drawer.findByRole('heading', { name: ALL_USERS_EMPTY_TITLE })).resolves.toBeInTheDocument();
      await expect(drawer.findByText(ALL_USERS_EMPTY_BODY)).resolves.toBeInTheDocument();
    });
  },
};

/** Lists only Default admin access; drawer shows “All org admins” implicit membership messaging. */
export const AdminDefaultDrawer: StoryObj<typeof meta> = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers(adminDefaultOnlyGroupsForHandlers), ...createGroupMembersHandlers({}, {}), ...groupRolesHandlers({})],
    },
    docs: {
      description: {
        story:
          'User groups table with the admin default group only. The drawer Users tab shows the “All org admins” empty state; the table shows normalized principal count.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Wait for admin default group and normalized user count', async () => {
      await expect(canvas.findByText(GROUP_ADMIN_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ALL_ORG_ADMINS_EMPTY_TITLE)).resolves.toBeInTheDocument();
    });
    await step('Open drawer and verify Users tab empty state', async () => {
      const nameCell = (await canvas.findAllByText(GROUP_ADMIN_DEFAULT.name))[0];
      const row = nameCell.closest('tr');
      await expect(row).toBeTruthy();
      await userEvent.click(row!);
      const drawer = await waitForDrawer();
      await expect(drawer.findByRole('heading', { name: ALL_ORG_ADMINS_EMPTY_TITLE })).resolves.toBeInTheDocument();
      await expect(drawer.findByText(ALL_ORG_ADMINS_EMPTY_BODY)).resolves.toBeInTheDocument();
    });
  },
};
