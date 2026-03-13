import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { GroupRoles } from './GroupRoles';
import { groupsHandlers } from '../../../../data/mocks/groups.handlers';
import { groupRolesHandlers, groupRolesLoadingHandlers } from '../../../../../shared/data/mocks/groupRoles.handlers';
import type { GroupOut } from '../../../../../shared/data/mocks/db';
import type { RoleOut } from '../../../../../shared/data/mocks/db';

// Spy for testing API calls
const getRolesSpy = fn();

// Regular group roles (RoleOut shape)
const mockRoles: RoleOut[] = [
  {
    uuid: 'role-1',
    name: 'Console Administrator',
    display_name: 'Console Administrator',
    description: 'Full administrative access to all resources and settings',
    system: false,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'role-2',
    name: 'Organization Administrator',
    display_name: 'Organization Administrator',
    description: 'Manage organization settings, users, and subscriptions',
    system: false,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'role-3',
    name: 'Insights Viewer',
    display_name: 'Insights Viewer',
    description: 'View insights, recommendations, and system health data',
    system: false,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
];

const availableRolesToAdd: RoleOut[] = [
  {
    uuid: 'role-4',
    name: 'Cost Administrator',
    display_name: 'Cost Administrator',
    description: 'Manage cost data',
    system: false,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'role-5',
    name: 'Compliance Viewer',
    display_name: 'Compliance Viewer',
    description: 'View compliance reports',
    system: false,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
];

// Admin default group roles (RoleOut shape)
const mockDefaultGroupRoles: RoleOut[] = [
  {
    uuid: 'default-role-1',
    name: 'User Access administrator',
    display_name: 'User Access administrator',
    description: 'Perform any available operation against any User Access resource',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-2',
    name: 'Inventory Hosts Viewer',
    display_name: 'Inventory Hosts Viewer',
    description: 'A viewer role that grants read permissions on Inventory Hosts and groups',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-3',
    name: 'Automation Analytics Viewer',
    display_name: 'Automation Analytics Viewer',
    description: 'A viewer role that grants read permissions on Automation Analytics',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-4',
    name: 'Compliance Viewer',
    display_name: 'Compliance Viewer',
    description: 'A viewer role that grants read permissions on Compliance',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-5',
    name: 'Remediations User',
    display_name: 'Remediations User',
    description: 'A user role that grants read and execute permissions on Remediations',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-6',
    name: 'Subscriptions Viewer',
    display_name: 'Subscriptions Viewer',
    description: 'A viewer role that grants read permissions on Subscriptions',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-7',
    name: 'Cost Price List Viewer',
    display_name: 'Cost Price List Viewer',
    description: 'A viewer role that grants read permissions on Cost Management Price List',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
  {
    uuid: 'default-role-8',
    name: 'Advisor Viewer',
    display_name: 'Advisor Viewer',
    description: 'A viewer role that grants read permissions on Insights Advisor',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
  },
];

const mockGroup: GroupOut = {
  uuid: 'test-group-id',
  name: 'Test Group',
  description: 'A test group for development',
  platform_default: false,
  admin_default: false,
  system: false,
  principalCount: 5,
  roleCount: 3,
  created: '2023-01-01T00:00:00.000Z',
  modified: '2023-01-15T12:00:00.000Z',
};

const mockDefaultGroup: GroupOut = {
  uuid: 'default-group-id',
  name: 'Default access',
  description: 'Default access group for all users',
  platform_default: false,
  admin_default: true,
  system: false,
  principalCount: 0,
  roleCount: 8,
  created: '2023-01-01T00:00:00.000Z',
  modified: '2023-01-15T12:00:00.000Z',
};

const rolesByGroupId: Record<string, RoleOut[]> = {
  'test-group-id': mockRoles,
  'available-pool': availableRolesToAdd,
  'default-group-id': mockDefaultGroupRoles,
};

const meta: Meta<typeof GroupRoles> = {
  component: GroupRoles,
  tags: ['custom-css'], // NO autodocs on meta
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[`/user-access/groups/detail/${parameters?.groupId || 'test-group-id'}/roles`]}>
        <Routes>
          <Route path="/user-access/groups/detail/:groupId/roles" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    groupId: 'test-group-id',
  },
};

export default meta;
type Story = StoryObj<typeof GroupRoles>;

export const Default: Story = {
  tags: ['autodocs', 'perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Group roles management with full functionality including role listing, selection, and actions.

This story demonstrates the complete GroupRoles component with:
- Role table with Name, Description, Modified columns
- Individual role selection and bulk selection
- Add role and remove role actions
- Proper permissions-based action visibility

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[WithoutPermissions](?path=/story/features-groups-group-role-grouproles--without-permissions)**: Tests role view without edit permissions
- **[DefaultGroupRoles](?path=/story/features-groups-group-role-grouproles--default-group-roles)**: Tests system default group with restricted actions
- **[LoadingState](?path=/story/features-groups-group-role-grouproles--loading-state)**: Tests skeleton loading state
- **[EmptyState](?path=/story/features-groups-group-role-grouproles--empty-state)**: Tests empty roles table
- **[BulkSelection](?path=/story/features-groups-group-role-grouproles--bulk-selection)**: Tests bulk select and remove functionality
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([mockGroup]),
        ...groupRolesHandlers(rolesByGroupId, {
          onRemoveRoles: fn(),
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table and role data load', async () => {
      const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
      expect(table).toBeInTheDocument();

      expect(await canvas.findByText('Console Administrator')).toBeInTheDocument();
      expect(await canvas.findByText('Organization Administrator')).toBeInTheDocument();
      expect(await canvas.findByText('Insights Viewer')).toBeInTheDocument();
    });

    await step('Verify Add role button is enabled', async () => {
      const addRoleButton = await canvas.findByRole('button', { name: /add role/i });
      expect(addRoleButton).toBeInTheDocument();

      await waitFor(
        () => {
          expect(addRoleButton).not.toBeDisabled();
        },
        { timeout: 5000 },
      );
    });

    await step('Verify individual role actions menu', async () => {
      const actionButton = await canvas.findByRole('button', { name: /actions for role console administrator/i });
      expect(actionButton).toBeInTheDocument();
    });
  },
};

export const WithoutPermissions: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Read-Only View**: User without permissions sees roles but cannot edit.

**Key Behavior**:
- ❌ No "Add Role" button (user lacks \`user-access-admin\` permission)
- ❌ No checkboxes for selection (no edit permissions)
- ✅ Can view role list (read-only access)
- ❌ No kebab menu actions on individual roles

**Contrast with DefaultGroupRoles**: That story shows a user WITH permissions viewing an admin default group, where the button exists but is disabled.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: false,
    },
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupRolesHandlers(rolesByGroupId)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify read-only view without permissions', async () => {
      const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
      expect(table).toBeInTheDocument();

      expect(await canvas.findByText('Console Administrator')).toBeInTheDocument();

      expect(canvas.queryByRole('button', { name: /add role/i })).not.toBeInTheDocument();
      expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /actions for role/i })).not.toBeInTheDocument();
    });
  },
};

export const DefaultGroupRoles: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Admin Default Group**: User WITH permissions viewing a system default group.

**Key Behavior** (visually identical to WithoutPermissions but for different reason):
- ❌ "Add Role" button NOT RENDERED (admin_default group protection - see line 311 in useGroupRoles.tsx)
- ❌ No checkboxes for selection (default groups are protected)
- ❌ No kebab menu actions (default groups are protected)

**Why this story exists**:
Although the UI looks the same as WithoutPermissions, the code path is different:
- \`WithoutPermissions\`: \`!hasPermissions = true\` → button not rendered
- \`DefaultGroupRoles\`: \`isAdminDefault = true\` → button not rendered

**Business Rule**: Admin default groups contain roles that apply to all users in the organization. Even users WITH admin permissions cannot modify them to prevent accidental changes to baseline permissions.

**Code**: \`if (!hasPermissions || isAdminDefault) { return []; }\` in useGroupRoles.tsx line 311
        `,
      },
    },
    groupId: 'default-group-id',
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...groupsHandlers([mockDefaultGroup]), ...groupRolesHandlers({ ...rolesByGroupId, 'default-group-id': mockDefaultGroupRoles })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify admin default group roles and restricted actions', async () => {
      const table = await canvas.findByRole('grid', undefined, { timeout: 10000 });
      expect(table).toBeInTheDocument();

      expect(await canvas.findByText('User Access administrator')).toBeInTheDocument();
      expect(await canvas.findByText('Inventory Hosts Viewer')).toBeInTheDocument();
      expect(await canvas.findByText('Automation Analytics Viewer')).toBeInTheDocument();
      expect(await canvas.findByText('Compliance Viewer')).toBeInTheDocument();
      expect(await canvas.findByText('Remediations User')).toBeInTheDocument();
      expect(await canvas.findByText('Subscriptions Viewer')).toBeInTheDocument();
      expect(await canvas.findByText('Cost Price List Viewer')).toBeInTheDocument();
      expect(await canvas.findByText('Advisor Viewer')).toBeInTheDocument();

      expect(canvas.queryByText('Console Administrator')).not.toBeInTheDocument();
      expect(canvas.queryByText('Organization Administrator')).not.toBeInTheDocument();

      expect(canvas.queryByRole('button', { name: /add role/i })).not.toBeInTheDocument();
      expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /actions for role/i })).not.toBeInTheDocument();
    });
  },
};

export const BulkSelection: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([mockGroup]),
        ...groupRolesHandlers(rolesByGroupId, {
          onRemoveRoles: fn(),
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for data and select first role', async () => {
      await canvas.findByText('Console Administrator', undefined, { timeout: 10000 });

      const table = canvas.getByRole('grid');
      const tableContext = within(table);
      const firstRoleCheckbox = await tableContext.findByLabelText('Select row 0');

      await userEvent.click(firstRoleCheckbox);
      expect(firstRoleCheckbox).toBeChecked();

      await canvas.findByLabelText('Bulk select toggle');
    });

    await step('Select all on page and verify', async () => {
      const table = canvas.getByRole('grid');
      const tableContext = within(table);
      const firstRoleCheckbox = await tableContext.findByLabelText('Select row 0');
      const bulkSelectCheckbox = await canvas.findByLabelText('Select page');
      await userEvent.click(bulkSelectCheckbox);

      const row1Checkbox = await tableContext.findByLabelText('Select row 1');
      const row2Checkbox = await tableContext.findByLabelText('Select row 2');
      expect(firstRoleCheckbox).toBeChecked();
      expect(row1Checkbox).toBeChecked();
      expect(row2Checkbox).toBeChecked();
    });
  },
};

// Generate many roles for pagination testing (RoleOut shape)
const manyRoles: RoleOut[] = Array.from({ length: 25 }, (_, i) => ({
  uuid: `role-${i + 1}`,
  name: `Role ${i + 1}`,
  display_name: `Role ${i + 1}`,
  description: `Description for role ${i + 1}`,
  system: false,
  platform_default: false,
  created: '2023-01-01T00:00:00Z',
  modified: '2023-01-01T00:00:00Z',
}));

export const BulkSelectionPaginated: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupRolesHandlers({ 'test-group-id': manyRoles })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select roles on page 1', async () => {
      await canvas.findByText('Role 1', undefined, { timeout: 10000 });

      const table = canvas.getByRole('grid');
      const tableContext = within(table);

      const firstRoleCheckbox = await tableContext.findByLabelText('Select row 0');
      await userEvent.click(firstRoleCheckbox);
      expect(firstRoleCheckbox).toBeChecked();

      const bulkSelectCheckbox = await canvas.findByLabelText('Select page');
      await userEvent.click(bulkSelectCheckbox);

      const row1Checkbox = await tableContext.findByLabelText('Select row 1');
      const row5Checkbox = await tableContext.findByLabelText('Select row 5');
      const row10Checkbox = await tableContext.findByLabelText('Select row 10');
      expect(firstRoleCheckbox).toBeChecked();
      expect(row1Checkbox).toBeChecked();
      expect(row5Checkbox).toBeChecked();
      expect(row10Checkbox).toBeChecked();
    });

    await step('Navigate to page 2 and verify selection is page-level only', async () => {
      const nextPageButtons = canvas.getAllByLabelText('Go to next page');
      await userEvent.click(nextPageButtons[0]);

      await canvas.findByText('Role 21', undefined, { timeout: 10000 });

      const page2Table = canvas.getByRole('grid');
      const page2TableContext = within(page2Table);
      const page2FirstCheckbox = await page2TableContext.findByLabelText('Select row 0');

      expect(page2FirstCheckbox).not.toBeChecked();
    });
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupRolesLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify skeleton loading state', async () => {
      await waitFor(
        () => {
          const skeletons = canvasElement.querySelectorAll('[class*="skeleton"]');
          expect(skeletons.length).toBeGreaterThan(0);
        },
        { timeout: 10000 },
      );
    });
  },
};

export const EmptyState: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupRolesHandlers({ 'test-group-id': [] })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state and Add role button', async () => {
      const emptyMessage = await canvas.findByText(/there are no roles in this group/i, undefined, { timeout: 10000 });
      expect(emptyMessage).toBeInTheDocument();

      expect(await canvas.findByRole('button', { name: /add role/i })).toBeInTheDocument();
    });
  },
};

export const RemoveSingleRoleFlow: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Flow**: Complete user journey from table to removal confirmation modal.

This story demonstrates:
1. User clicks kebab menu on a role row
2. Selects "Remove" action
3. Confirmation modal appears with proper messaging
4. User can confirm or cancel the removal

Perfect for code review and UX validation.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupRolesHandlers(rolesByGroupId)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open kebab menu and select Remove', async () => {
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();

      await canvas.findByText('Console Administrator');

      const firstRow = (await canvas.findByText('Console Administrator')).closest('tr');
      if (!firstRow) throw new Error('Could not find first role row');

      const kebabButton = within(firstRow).getByLabelText(/Actions for role/i);
      await userEvent.click(kebabButton);

      const removeMenuItem = await within(document.body).findByRole('menuitem', { name: /Remove/i });
      expect(removeMenuItem).toBeInTheDocument();

      await userEvent.click(removeMenuItem);
    });

    await step('Verify removal confirmation modal', async () => {
      const body = within(document.body);
      const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Remove role\?/i)).toBeInTheDocument();
      expect(within(modal).getByText(/Console Administrator/i)).toBeInTheDocument();
    });
  },
};

export const BulkRemoveRolesFlow: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Bulk Removal Flow**: Complete user journey for removing multiple roles at once.

This story demonstrates:
1. User selects multiple roles using checkboxes
2. Clicks bulk "Remove" button in toolbar
3. Confirmation modal appears showing plural messaging ("Remove roles?")
4. Modal shows count of roles to be removed

Perfect for testing bulk operations and proper pluralization.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupRolesHandlers(rolesByGroupId)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select multiple roles and open bulk Remove', async () => {
      await canvas.findByText('Console Administrator', undefined, { timeout: 10000 });

      const table = canvas.getByRole('grid');
      const tableContext = within(table);
      const firstCheckbox = await tableContext.findByLabelText('Select row 0', undefined, { timeout: 15000 });
      await userEvent.click(firstCheckbox);

      const secondCheckbox = await tableContext.findByLabelText('Select row 1', undefined, { timeout: 5000 });
      await userEvent.click(secondCheckbox);

      const kebabToggle = await canvas.findByLabelText(/bulk actions/i);
      await userEvent.click(kebabToggle);

      const removeMenuItem = await within(document.body).findByRole('menuitem', { name: /Remove/i });
      await userEvent.click(removeMenuItem);
    });

    await step('Verify bulk removal confirmation modal', async () => {
      const body = within(document.body);
      const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Remove roles\?/i)).toBeInTheDocument();
    });
  },
};

// Test filtering functionality
export const FilterRoles: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Filter Functionality Test**: Validates that role filtering works correctly with API calls and "Clear filters" button.

This story tests:
1. Filter input updates the table
2. API is called with correct filter parameters
3. "Clear filters" button appears and works
4. API is called with empty filter when clearing
5. Table displays all roles after clearing filters

Perfect for testing filter state management and API integration.
        `,
      },
    },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([mockGroup]),
        ...groupRolesHandlers(rolesByGroupId, {
          onListRoles: (_groupId, params) =>
            getRolesSpy({
              name: (params as URLSearchParams).get('role_display_name') || '',
              limit: parseInt((params as URLSearchParams).get('limit') || '20', 10),
              offset: parseInt((params as URLSearchParams).get('offset') || '0', 10),
            }),
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for initial load and apply filter', async () => {
      await canvas.findByText('Console Administrator');
      await canvas.findByText('Organization Administrator');
      await canvas.findByText('Insights Viewer');

      getRolesSpy.mockClear();

      const filterInput = canvas.getByPlaceholderText('Filter by name');

      await userEvent.clear(filterInput);
      await userEvent.type(filterInput, 'Console');

      await waitFor(
        () => {
          expect(canvas.getByText(mockRoles[0].name)).toBeInTheDocument();
          expect(canvas.queryByText(mockRoles[1].name)).not.toBeInTheDocument();
          expect(canvas.queryByText(mockRoles[2].name)).not.toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      expect(filterInput).toHaveValue('Console');
    });

    await step('Clear filters and verify all roles displayed', async () => {
      const filterInput = canvas.getByPlaceholderText('Filter by name');
      const clearButtons = await canvas.findAllByText('Clear filters');
      await userEvent.click(clearButtons[0]);

      await waitFor(() => {
        expect(canvas.getByText(mockRoles[0].name)).toBeInTheDocument();
        expect(canvas.getByText(mockRoles[1].name)).toBeInTheDocument();
        expect(canvas.getByText(mockRoles[2].name)).toBeInTheDocument();
      });

      expect(filterInput).toHaveValue('');
    });
  },
};
