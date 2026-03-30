import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { clearAndType, getSkeletonCount } from '../../../../../test-utils/interactionHelpers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BaseGroupAssignmentsTable } from './BaseGroupAssignmentsTable';
import type { WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import { createGroupMembersHandlers, groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';

const NOOP_CALLBACKS = {
  onGroupSelect: () => {},
  onGroupDeselect: () => {},
  onGrantAccess: () => {},
};

const mockGroups: WorkspaceGroupRow[] = [
  {
    id: 'group-1',
    name: 'Platform Administrators',
    description: 'Full access to all platform resources and administrative functions',
    userCount: 12,
    isDefaultGroup: false,
    isAdminDefault: false,
    roleCount: 2,
    roles: [
      { id: 'role-1', name: 'Administrator' },
      { id: 'role-2', name: 'User Manager' },
    ],
    lastModified: '2024-01-20T14:45:00Z',
  },
  {
    id: 'group-2',
    name: 'Development Team',
    description: 'Access to development resources and environments',
    userCount: 25,
    isDefaultGroup: false,
    isAdminDefault: false,
    roleCount: 2,
    roles: [
      { id: 'role-3', name: 'Developer' },
      { id: 'role-4', name: 'Viewer' },
    ],
    lastModified: '2024-01-18T16:20:00Z',
  },
  {
    id: 'group-3',
    name: 'QA Engineers',
    description: '',
    userCount: 8,
    isDefaultGroup: false,
    isAdminDefault: false,
    roleCount: 1,
    roles: [{ id: 'role-5', name: 'Tester' }],
    lastModified: '2024-01-19T13:30:00Z',
  },
];

// MSW handlers for group details API calls
const groupDetailsHandlers = [...groupMembersHandlers({}, {})];

const withRouter = () => {
  const RouterWrapper = (Story: React.ComponentType) => (
    <MemoryRouter initialEntries={['/iam/access-management/workspaces/detail/ws-test/direct-roles']}>
      <Routes>
        <Route path="/iam/access-management/workspaces/detail/:workspaceId/*" element={<Story />} />
      </Routes>
    </MemoryRouter>
  );
  RouterWrapper.displayName = 'RouterWrapper';
  return RouterWrapper;
};

const meta: Meta<typeof BaseGroupAssignmentsTable> = {
  component: BaseGroupAssignmentsTable,
  tags: ['autodocs'],
  decorators: [withRouter()],
  argTypes: {},
  parameters: {
    msw: { handlers: groupDetailsHandlers },
    docs: {
      description: {
        component: `
Base group assignments table for displaying groups within a single workspace context.

Manages its own table state (pagination, sorting, filtering, selection) via useTableState.
The parent only provides data and loading state.

## Columns
- User group (sortable)
- Description
- Users (sortable)
- Roles (sortable)
- Last modified (sortable)
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    ouiaId: 'role-assignments-table',
    ...NOOP_CALLBACKS,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default base group assignments', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      await waitFor(async () => {
        await expect(canvas.queryByText('Description')).toBeInTheDocument();
        await expect(canvas.queryByText('Users')).toBeInTheDocument();
        await expect(canvas.queryByText('Roles')).toBeInTheDocument();
        await expect(canvas.queryByText('Last modified')).toBeInTheDocument();
      });

      await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('QA Engineers')).resolves.toBeInTheDocument();

      const paginationElements = canvas.getAllByText('1 - 3', { exact: false });
      await expect(paginationElements.length).toBeGreaterThan(0);
    });
  },
};

export const LoadingState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: true,
    ouiaId: 'role-assignments-table-loading',
    ...NOOP_CALLBACKS,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify loading state', async () => {
      await waitFor(
        () => {
          expect(getSkeletonCount(canvasElement)).toBeGreaterThan(0);
          const loadingElements = canvas.queryAllByText('Platform Administrators');
          expect(loadingElements.length).toBe(0);
        },
        { timeout: 2000 },
      );
    });
  },
};

export const EmptyState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: false,
    ouiaId: 'role-assignments-table-empty',
    ...NOOP_CALLBACKS,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
    });
  },
};

const DrawerInteractionWrapper: React.FC = () => {
  const [focusedGroupId, setFocusedGroupId] = React.useState<string | undefined>();
  return (
    <BaseGroupAssignmentsTable
      groups={mockGroups}
      totalCount={mockGroups.length}
      isLoading={false}
      ouiaId="role-assignments-drawer-test"
      focusedGroupId={focusedGroupId}
      onGroupSelect={(group) => setFocusedGroupId(group.id)}
      onGroupDeselect={() => setFocusedGroupId(undefined)}
      onGrantAccess={() => {}}
    />
  );
};

export const DrawerInteraction: Story = {
  render: () => <DrawerInteractionWrapper />,
  parameters: {
    msw: {
      handlers: [
        ...createGroupMembersHandlers(
          {
            'group-1': [
              {
                username: 'admin',
                email: 'admin@company.com',
                first_name: 'John',
                last_name: 'Doe',
                is_active: true,
                is_org_admin: true,
                external_source_id: '1',
              },
              {
                username: 'user1',
                email: 'user1@company.com',
                first_name: 'Jane',
                last_name: 'Smith',
                is_active: true,
                is_org_admin: false,
                external_source_id: '2',
              },
            ],
          },
          {},
        ),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify drawer interaction', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

      const firstGroupRow = await canvas.findByText('Platform Administrators');
      await userEvent.click(firstGroupRow);

      await waitFor(
        async () => {
          const tabs = canvas.queryAllByRole('tab');
          expect(tabs.length).toBeGreaterThanOrEqual(2);
          const tabTexts = tabs.map((tab) => tab.textContent?.toLowerCase() || '');
          expect(tabTexts.some((text) => text.includes('role'))).toBeTruthy();
          expect(tabTexts.some((text) => text.includes('user'))).toBeTruthy();
        },
        { timeout: 5000 },
      );

      await waitFor(
        async () => {
          const roleElements = canvas.queryAllByText(/administrator|user manager/i);
          expect(roleElements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      await waitFor(async () => {
        const tabs = canvas.queryAllByRole('tab');
        const usersTab = tabs.find((tab) => tab.textContent?.toLowerCase().includes('user'));
        expect(usersTab).toBeTruthy();
        if (usersTab) await userEvent.click(usersTab);
      });

      await waitFor(
        async () => {
          const userElements = canvas.queryAllByText(/admin|john|doe/i);
          expect(userElements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      await waitFor(
        async () => {
          const closeButtons = canvas.queryAllByRole('button');
          const closeButton = closeButtons.find(
            (btn) => btn.textContent?.toLowerCase().includes('close') || btn.getAttribute('aria-label')?.toLowerCase().includes('close'),
          );
          if (closeButton) {
            await userEvent.click(closeButton);
          }
        },
        { timeout: 2000 },
      );
    });
  },
};

const WORKSPACE_ARGS = {
  groups: mockGroups,
  totalCount: mockGroups.length,
  isLoading: false,
  currentWorkspace: { id: 'ws-test', name: 'Test Workspace', type: 'workspace' as const },
  ...NOOP_CALLBACKS,
} as const;

export const RowActionsEnabled: Story = {
  tags: ['ff:platform.rbac.workspaces-role-bindings-write'],
  args: {
    ...WORKSPACE_ARGS,
    canGrantAccess: true,
    canEditAccess: true,
    canRevokeAccess: true,
    ouiaId: 'role-assignments-row-actions-enabled',
  },
  parameters: {
    featureFlags: { 'platform.rbac.workspaces-role-bindings-write': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify row actions are enabled with full permissions', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      const firstGroupRow = await canvas.findByText(mockGroups[0].name);
      const row = firstGroupRow.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${mockGroups[0].name}`, 'i'));
      await userEvent.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).not.toHaveAttribute('disabled');

      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).not.toHaveAttribute('disabled');
    });
  },
};

export const RowActionsDisabledByPermission: Story = {
  tags: ['ff:platform.rbac.workspaces-role-bindings-write'],
  args: {
    ...WORKSPACE_ARGS,
    canGrantAccess: false,
    canEditAccess: false,
    canRevokeAccess: false,
    ouiaId: 'role-assignments-row-actions-disabled',
  },
  parameters: {
    featureFlags: { 'platform.rbac.workspaces-role-bindings-write': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify row actions are disabled without permissions', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      const firstGroupRow = await canvas.findByText(mockGroups[0].name);
      const row = firstGroupRow.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${mockGroups[0].name}`, 'i'));
      await userEvent.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');

      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const EditAccessDisabledRevokeEnabled: Story = {
  tags: ['ff:platform.rbac.workspaces-role-bindings-write'],
  args: {
    ...WORKSPACE_ARGS,
    canGrantAccess: true,
    canEditAccess: false,
    canRevokeAccess: true,
    ouiaId: 'role-assignments-mixed-permissions',
  },
  parameters: {
    featureFlags: { 'platform.rbac.workspaces-role-bindings-write': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify edit disabled but revoke enabled', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      const firstGroupRow = await canvas.findByText(mockGroups[0].name);
      const row = firstGroupRow.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${mockGroups[0].name}`, 'i'));
      await userEvent.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');

      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).not.toHaveAttribute('disabled');
    });
  },
};

export const GrantAccessButtonDisabledByFlag: Story = {
  args: {
    ...WORKSPACE_ARGS,
    canGrantAccess: true,
    canEditAccess: true,
    canRevokeAccess: true,
    ouiaId: 'role-assignments-grant-access-disabled-test',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces-role-bindings-write': false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify grant access disabled when m4 flag is off', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeInTheDocument();
      await expect(grantAccessButton).toBeDisabled();
    });
  },
};

export const GrantAccessButtonDisabledByPermission: Story = {
  tags: ['ff:platform.rbac.workspaces-role-bindings-write'],
  args: {
    ...WORKSPACE_ARGS,
    canGrantAccess: false,
    canEditAccess: false,
    canRevokeAccess: false,
    ouiaId: 'role-assignments-grant-access-no-permission-test',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces-role-bindings-write': true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify grant access disabled when user lacks create permission', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeInTheDocument();
      await expect(grantAccessButton).toBeDisabled();
    });
  },
};

const GROUP_PLATFORM = mockGroups[0];
const GROUP_DEV = mockGroups[1];
const GROUP_QA = mockGroups[2];

/**
 * Tests client-side filtering by group name.
 */
export const FilterByGroupName: Story = {
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    ouiaId: 'role-assignments-table',
    ...NOOP_CALLBACKS,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Type partial name and verify rows narrow', async () => {
      await clearAndType(user, () => canvas.getByPlaceholderText(/filter by user group/i) as HTMLInputElement, 'Platform');
      await expect(canvas.findByText(GROUP_PLATFORM.name)).resolves.toBeInTheDocument();
      await waitFor(() => {
        expect(canvas.queryByText(GROUP_DEV.name)).not.toBeInTheDocument();
        expect(canvas.queryByText(GROUP_QA.name)).not.toBeInTheDocument();
      });
    });

    await step('Clear filter and verify all rows return', async () => {
      const filterInput = await canvas.findByPlaceholderText(/filter by user group/i);
      await user.clear(filterInput);
      await expect(canvas.findByText(GROUP_PLATFORM.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(GROUP_DEV.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(GROUP_QA.name)).resolves.toBeInTheDocument();
    });

    await step('Filter is case-insensitive', async () => {
      await clearAndType(user, () => canvas.getByPlaceholderText(/filter by user group/i) as HTMLInputElement, 'qa');
      await expect(canvas.findByText(GROUP_QA.name)).resolves.toBeInTheDocument();
      await waitFor(() => {
        expect(canvas.queryByText(GROUP_PLATFORM.name)).not.toBeInTheDocument();
      });
    });

    await step('No-match shows empty state', async () => {
      await clearAndType(user, () => canvas.getByPlaceholderText(/filter by user group/i) as HTMLInputElement, 'zzz-nonexistent');
      await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
    });
  },
};
