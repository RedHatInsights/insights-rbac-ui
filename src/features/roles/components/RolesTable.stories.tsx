import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RolesTable } from './RolesTable';
import { Role } from '../types';

// Mock roles data
const mockRoles: Role[] = [
  {
    uuid: 'role-1',
    name: 'Platform Administrator',
    display_name: 'Platform Administrator',
    description: 'Full access to all platform features',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 25,
    created: '2023-11-01T10:00:00Z',
    modified: '2023-12-01T10:30:00Z',
    applications: ['rbac', 'inventory', 'cost-management'],
    external_role_id: '',
    external_tenant: '',
    policyCount: 3,
    groups_in_count: 3,
    groups_in: [
      { uuid: 'group-1', name: 'Administrators', description: 'System administrators group' },
      { uuid: 'group-2', name: 'Platform Team', description: 'Platform engineering team' },
      { uuid: 'group-3', name: 'Super Users', description: 'Super user access group' },
    ],
    access: [
      { permission: 'rbac:*:*', resourceDefinitions: [] },
      { permission: 'inventory:*:*', resourceDefinitions: [] },
      { permission: 'cost-management:*:*', resourceDefinitions: [] },
    ],
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    display_name: 'Cost Management Viewer',
    description: 'View cost management data and reports',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 8,
    created: '2023-10-15T08:00:00Z',
    modified: '2023-11-28T14:20:00Z',
    applications: ['cost-management'],
    external_role_id: '',
    external_tenant: '',
    policyCount: 2,
    groups_in_count: 1,
    groups_in: [{ uuid: 'group-4', name: 'Finance Team', description: 'Finance and accounting team' }],
    access: [
      { permission: 'cost-management:*:read', resourceDefinitions: [] },
      { permission: 'cost-management:report:read', resourceDefinitions: [] },
    ],
  },
  {
    uuid: 'role-3',
    name: 'System Role',
    display_name: 'System Role',
    description: 'Built-in system role (not editable)',
    system: true,
    platform_default: true,
    admin_default: false,
    accessCount: 50,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    applications: ['*'],
    external_role_id: '',
    external_tenant: '',
    policyCount: 0,
    groups_in_count: 0,
    groups_in: [],
    access: [],
  },
];

const meta: Meta<typeof RolesTable> = {
  component: RolesTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**RolesTable** is a custom PatternFly table component with compound expandable rows for roles.

## Features
- Compound expandable rows for groups and permissions
- Row selection for non-system roles
- Sorting on Name and Last Modified columns
- Row actions dropdown (edit/delete)
- Nested tables in expanded rows
- Admin/non-admin view modes

## Why Custom Table?
PatternFly's DataViewTable doesn't support compound expandable rows with nested tables.
This component uses the core Table component wrapped in a custom implementation.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  args: {
    roles: mockRoles,
    isAdmin: true,
    isSelectable: true,
    selectedRows: [],
    expandedCells: {},
    sortByState: { index: 1, direction: 'asc' as const },
    onRowSelection: fn(),
    onExpansion: fn(),
    onSort: fn(),
    onEditRole: fn(),
    onDeleteRole: fn(),
    adminGroup: undefined,
  },
};

export default meta;
type Story = StoryObj<typeof RolesTable>;

export const AdminView: Story = {
  name: 'Admin View with All Features',
  parameters: {
    docs: {
      description: {
        story: 'Admin users see selection checkboxes, row actions, and can interact with all features.',
      },
    },
  },
};

export const NonAdminView: Story = {
  name: 'Non-Admin View (Read-Only)',
  args: {
    isAdmin: false,
    isSelectable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Non-admin users see a read-only view without selection or actions.',
      },
    },
  },
};

export const WithSelectedRows: Story = {
  args: {
    selectedRows: [
      { uuid: 'role-1', label: 'Platform Administrator' },
      { uuid: 'role-2', label: 'Cost Management Viewer' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows roles with some rows selected.',
      },
    },
  },
};

export const WithExpandedGroups: Story = {
  args: {
    expandedCells: {
      'role-1': 'groups',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the groups nested table expanded for a role.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the nested groups table is visible for the specific role
    const groupsTable = await canvas.findByLabelText('Groups for role Platform Administrator');
    expect(groupsTable).toBeInTheDocument();

    // Verify group data is displayed
    expect(await within(groupsTable).findByText('Administrators')).toBeInTheDocument();
    expect(await within(groupsTable).findByText('Platform Team')).toBeInTheDocument();
  },
};

export const WithExpandedPermissions: Story = {
  args: {
    expandedCells: {
      'role-1': 'permissions',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the permissions nested table expanded for a role.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the nested permissions table is visible for the specific role
    const permissionsTable = await canvas.findByLabelText('Permissions for role Platform Administrator');
    expect(permissionsTable).toBeInTheDocument();

    // Verify permission data is displayed
    expect(await within(permissionsTable).findByText('rbac')).toBeInTheDocument();
    expect(await within(permissionsTable).findByText('inventory')).toBeInTheDocument();
  },
};

export const SortedByName: Story = {
  name: 'Sorted by Name',
  args: {
    sortByState: { index: 1, direction: 'asc' as const },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows roles sorted by name in ascending order.',
      },
    },
  },
};

export const SortedByModified: Story = {
  name: 'Sorted by Last Modified',
  args: {
    sortByState: { index: 5, direction: 'desc' as const },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows roles sorted by last modified date in descending order.',
      },
    },
  },
};

export const InteractiveRowSelection: Story = {
  name: 'Interactive: Row Selection',
  parameters: {
    docs: {
      description: {
        story: 'Tests row selection interaction. Click checkboxes to select roles.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the first selectable row checkbox
    const firstCheckbox = canvas.getAllByRole('checkbox')[0];
    await userEvent.click(firstCheckbox);

    // Verify the onRowSelection callback was called
    expect(args.onRowSelection).toHaveBeenCalled();
  },
};

export const InteractiveCompoundExpand: Story = {
  name: 'Interactive: Compound Expand',
  parameters: {
    docs: {
      description: {
        story: 'Tests compound expandable rows. Click the groups count to expand.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the groups expand button (shows count "3")
    const groupsButton = canvas.getByRole('button', { name: '3' });
    await userEvent.click(groupsButton);

    // Verify the onExpansion callback was called
    expect(args.onExpansion).toHaveBeenCalledWith('role-1', 'groups', true);
  },
};

export const InteractiveSort: Story = {
  name: 'Interactive: Sorting',
  parameters: {
    docs: {
      description: {
        story: 'Tests column sorting. Click the Name column header to sort.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the Name column header
    const nameHeader = canvas.getByRole('columnheader', { name: /name/i });
    const sortButton = within(nameHeader).getByRole('button');
    await userEvent.click(sortButton);

    // Verify the onSort callback was called
    expect(args.onSort).toHaveBeenCalled();
  },
};

export const InteractiveRowActions: Story = {
  name: 'Interactive: Row Actions',
  parameters: {
    docs: {
      description: {
        story: 'Tests row actions dropdown. Click the actions menu for a role.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the first row actions toggle (for Platform Administrator)
    const actionsToggle = canvas.getByLabelText(/Actions for role Platform Administrator/i);
    await userEvent.click(actionsToggle);

    // Verify dropdown is open and contains actions
    const editButton = await canvas.findByText('Edit');
    const deleteButton = await canvas.findByText('Delete');
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    // Click edit
    await userEvent.click(editButton);
    expect(args.onEditRole).toHaveBeenCalledWith('role-1');
  },
};

export const EmptyGroups: Story = {
  name: 'Role with No Groups',
  args: {
    roles: [
      {
        uuid: 'role-empty',
        name: 'Standalone Role',
        display_name: 'Standalone Role',
        description: 'A role not assigned to any groups',
        system: false,
        platform_default: false,
        admin_default: false,
        accessCount: 5,
        created: '2023-11-01T10:00:00Z',
        modified: '2023-12-01T10:30:00Z',
        applications: ['example'],
        external_role_id: '',
        external_tenant: '',
        policyCount: 1,
        groups_in_count: 0,
        groups_in: [],
        access: [{ permission: 'example:*:read', resourceDefinitions: [] }],
      },
    ],
    expandedCells: {
      'role-empty': 'groups',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when a role has no groups assigned.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify empty state message is shown
    const groupsTable = await canvas.findByLabelText(/Groups for role/i);
    expect(await within(groupsTable).findByText('No groups')).toBeInTheDocument();
  },
};

export const EmptyPermissions: Story = {
  name: 'Role with No Permissions',
  args: {
    roles: [
      {
        uuid: 'role-no-perms',
        name: 'Empty Role',
        display_name: 'Empty Role',
        description: 'A role with no permissions',
        system: false,
        platform_default: false,
        admin_default: false,
        accessCount: 0,
        created: '2023-11-01T10:00:00Z',
        modified: '2023-12-01T10:30:00Z',
        applications: [],
        external_role_id: '',
        external_tenant: '',
        policyCount: 0,
        groups_in_count: 0,
        groups_in: [],
        access: [],
      },
    ],
    expandedCells: {
      'role-no-perms': 'permissions',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when a role has no permissions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify empty state message is shown
    const permissionsTable = await canvas.findByLabelText(/Permissions for role/i);
    expect(await within(permissionsTable).findByText('No permissions')).toBeInTheDocument();
  },
};

export const SystemRoleNotSelectable: Story = {
  name: 'System Role (Not Selectable)',
  args: {
    roles: [mockRoles[2]], // System role
  },
  parameters: {
    docs: {
      description: {
        story: 'System roles cannot be selected or deleted (checkbox is disabled).',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify system role is displayed
    expect(await canvas.findByText('System Role')).toBeInTheDocument();

    // Verify checkbox exists but is disabled (system roles can't be selected)
    const checkbox = canvas.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  },
};
