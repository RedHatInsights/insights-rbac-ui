import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { getSkeletonCount, queryDialog } from '../../../../../test-utils/interactionHelpers';
import { MemoryRouter } from 'react-router-dom';
import { BaseGroupAssignmentsTable } from './BaseGroupAssignmentsTable';
import type { WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import { createGroupMembersHandlers, groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import { groupsHandlers } from '../../../../../shared/data/mocks/groups.handlers';
import { v2RolesHandlers } from '../../../../data/mocks/roles.handlers';

const mockGroups: WorkspaceGroupRow[] = [
  {
    id: 'group-1',
    name: 'Platform Administrators',
    description: 'Full access to all platform resources and administrative functions',
    userCount: 12,
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
    roleCount: 1,
    roles: [{ id: 'role-5', name: 'Tester' }],
    lastModified: '2024-01-19T13:30:00Z',
  },
];

// MSW handlers for group details API calls
const groupDetailsHandlers = [...groupMembersHandlers({}, {})];

const withRouter = () => {
  const RouterWrapper = (Story: React.ComponentType) => (
    <MemoryRouter initialEntries={['/']}>
      <Story />
    </MemoryRouter>
  );
  RouterWrapper.displayName = 'RouterWrapper';
  return RouterWrapper;
};

const meta: Meta<typeof BaseGroupAssignmentsTable> = {
  component: BaseGroupAssignmentsTable,
  tags: ['autodocs'],
  decorators: [withRouter()],
  argTypes: {
    onGrantAccessWizardToggle: { control: false, action: false },
  },
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
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
    });
  },
};

export const DrawerInteraction: Story = {
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    ouiaId: 'role-assignments-drawer-test',
  },
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
  workspaceName: 'Test Workspace',
  currentWorkspace: { id: 'ws-test', name: 'Test Workspace' },
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
      const kebab = within(row).getByLabelText(`Actions for ${mockGroups[0].name}`);
      await userEvent.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/edit access for this workspace/i);
      await expect(editItem.closest('button')).not.toHaveAttribute('disabled');

      const removeItem = await body.findByText(/remove from workspace/i);
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
      const kebab = within(row).getByLabelText(`Actions for ${mockGroups[0].name}`);
      await userEvent.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/edit access for this workspace/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');

      const removeItem = await body.findByText(/remove from workspace/i);
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
      const kebab = within(row).getByLabelText(`Actions for ${mockGroups[0].name}`);
      await userEvent.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/edit access for this workspace/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');

      const removeItem = await body.findByText(/remove from workspace/i);
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

export const GrantAccessWizardTest: Story = {
  tags: ['ff:platform.rbac.workspaces-role-bindings-write'],
  args: {
    ...WORKSPACE_ARGS,
    canGrantAccess: true,
    canEditAccess: true,
    canRevokeAccess: true,
    ouiaId: 'role-assignments-grant-access-test',
    onGrantAccessWizardToggle: undefined,
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces-role-bindings-write': true,
    },
    msw: {
      handlers: [
        ...groupDetailsHandlers,
        ...groupsHandlers([
          {
            uuid: 'group-1',
            name: 'Test Group 1',
            description: 'Test group for wizard',
            principalCount: 5,
            roleCount: 2,
            created: '2024-01-15T10:30:00Z',
            modified: '2024-01-20T14:45:00Z',
            admin_default: false,
            platform_default: false,
            system: false,
          },
        ]),
        ...v2RolesHandlers([
          {
            id: 'role-1',
            name: 'administrator',
            description: 'Full administrative access',
            permissions: [],
            permissions_count: 5,
            last_modified: '2024-01-20T14:45:00Z',
          },
        ]),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify grant access wizard', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      let grantAccessButton: HTMLElement | null = null;
      await waitFor(
        async () => {
          grantAccessButton = canvas.queryByRole('button', { name: /grant access/i });
          await expect(grantAccessButton).toBeInTheDocument();
          await expect(grantAccessButton).toBeEnabled();
        },
        { timeout: 10000 },
      );

      await userEvent.click(grantAccessButton!);

      await waitFor(
        async () => {
          const wizardModal = queryDialog();
          expect(wizardModal).toBeInTheDocument();
          const modalContent = within(wizardModal!);
          await expect(modalContent.queryByText(/grant access in workspace test workspace/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Cancel the wizard
      await waitFor(
        async () => {
          const wizardModal = queryDialog();
          expect(wizardModal).toBeInTheDocument();
          const allButtons = wizardModal!.querySelectorAll('button');
          let cancelButton: HTMLButtonElement | null = null;
          for (const button of allButtons) {
            const buttonText = button.textContent?.toLowerCase() || '';
            if (buttonText.includes('cancel')) {
              cancelButton = button as HTMLButtonElement;
              break;
            }
          }
          if (cancelButton) {
            await userEvent.click(cancelButton);
          }
        },
        { timeout: 2000 },
      );

      await waitFor(
        async () => {
          const wizardModal = queryDialog();
          expect(wizardModal).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await expect(canvas.findByRole('button', { name: /grant access/i })).resolves.toBeInTheDocument();
    });
  },
};
