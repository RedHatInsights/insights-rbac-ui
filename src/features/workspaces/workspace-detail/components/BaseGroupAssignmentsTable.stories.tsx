import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { BaseGroupAssignmentsTable } from './BaseGroupAssignmentsTable';
import { type Group } from '../../../../data/queries/groups';
import { HttpResponse, http } from 'msw';

// Mock group data
const mockGroups: Group[] = [
  {
    uuid: 'group-1',
    name: 'Platform Administrators',
    description: 'Full access to all platform resources and administrative functions',
    principalCount: 12,
    roleCount: 8,
    created: '2024-01-15T10:30:00Z',
    modified: '2024-01-20T14:45:00Z',
    admin_default: true,
    platform_default: false,
    system: false,
  },
  {
    uuid: 'group-2',
    name: 'Development Team',
    description: 'Access to development resources and environments',
    principalCount: 25,
    roleCount: 5,
    created: '2024-01-10T09:15:00Z',
    modified: '2024-01-18T16:20:00Z',
    admin_default: false,
    platform_default: false,
    system: false,
  },
  {
    uuid: 'group-3',
    name: 'QA Engineers',
    principalCount: 8,
    roleCount: 3,
    created: '2024-01-12T11:00:00Z',
    modified: '2024-01-19T13:30:00Z',
    admin_default: false,
    platform_default: false,
    system: false,
  },
];

// MSW handlers for group details API calls
const groupDetailsHandlers = [
  http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit: 1000, offset: 0 },
    });
  }),
  http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit: 1000, offset: 0 },
    });
  }),
];

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    await waitFor(async () => {
      await expect(canvas.getByText('Description')).toBeInTheDocument();
      await expect(canvas.getByText('Users')).toBeInTheDocument();
      await expect(canvas.getByText('Roles')).toBeInTheDocument();
      await expect(canvas.getByText('Last modified')).toBeInTheDocument();
    });

    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('QA Engineers')).resolves.toBeInTheDocument();

    const paginationElements = canvas.getAllByText('1 - 3', { exact: false });
    await expect(paginationElements.length).toBeGreaterThan(0);
  },
};

export const LoadingState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: true,
    ouiaId: 'role-assignments-table-loading',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
        const loadingElements = canvas.queryAllByText('Platform Administrators');
        expect(loadingElements.length).toBe(0);
      },
      { timeout: 2000 },
    );
  },
};

export const EmptyState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: false,
    ouiaId: 'role-assignments-table-empty',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
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
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
          return HttpResponse.json({
            data: [
              { username: 'admin', email: 'admin@company.com', first_name: 'John', last_name: 'Doe', is_org_admin: true },
              { username: 'user1', email: 'user1@company.com', first_name: 'Jane', last_name: 'Smith', is_org_admin: false },
            ],
            meta: { count: 2, limit: 1000, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: [
              { uuid: 'role-1', name: 'administrator', display_name: 'Administrator', description: 'Full admin access' },
              { uuid: 'role-2', name: 'user-manager', display_name: 'User Manager', description: 'Manage users' },
            ],
            meta: { count: 2, limit: 1000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

    const firstGroupRow = await canvas.findByText('Platform Administrators');
    await userEvent.click(firstGroupRow);

    await waitFor(
      async () => {
        const tabs = canvas.getAllByRole('tab');
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
      const tabs = canvas.getAllByRole('tab');
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
  },
};

export const GrantAccessButtonDisabled: Story = {
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    workspaceName: 'Test Workspace',
    ouiaId: 'role-assignments-grant-access-disabled-test',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces': false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
    await expect(grantAccessButton).toBeInTheDocument();
    await expect(grantAccessButton).toBeDisabled();
  },
};

export const GrantAccessWizardTest: Story = {
  tags: ['ff:platform.rbac.workspaces'],
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    workspaceName: 'Test Workspace',
    ouiaId: 'role-assignments-grant-access-test',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [
        ...groupDetailsHandlers,
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [
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
            ],
            meta: { count: 1, limit: 1000, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const addFields = url.searchParams.get('add_fields');
          if (!addFields || !addFields.includes('groups_in_count') || !addFields.includes('access')) {
            return;
          }
          return HttpResponse.json({
            data: [
              {
                uuid: 'role-1',
                name: 'administrator',
                display_name: 'Administrator',
                description: 'Full administrative access',
                accessCount: 25,
                access: [{ permission: 'admin:read' }, { permission: 'admin:write' }],
                created: '2024-01-15T10:30:00Z',
                modified: '2024-01-20T14:45:00Z',
              },
            ],
            meta: { count: 1, limit: 1000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    let grantAccessButton: HTMLElement;
    await waitFor(
      async () => {
        grantAccessButton = canvas.getByRole('button', { name: /grant access/i });
        await expect(grantAccessButton).toBeInTheDocument();
        await expect(grantAccessButton).toBeEnabled();
      },
      { timeout: 10000 },
    );

    await userEvent.click(grantAccessButton!);

    await waitFor(
      async () => {
        const wizardModal = document.querySelector('[role="dialog"]');
        expect(wizardModal).toBeInTheDocument();
        const modalContent = within(wizardModal as HTMLElement);
        await expect(modalContent.getByText(/grant access in workspace test workspace/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Cancel the wizard
    await waitFor(
      async () => {
        const wizardModal = document.querySelector('[role="dialog"]') as HTMLElement;
        const allButtons = wizardModal.querySelectorAll('button');
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
        const wizardModal = document.querySelector('[role="dialog"]');
        expect(wizardModal).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await expect(canvas.findByRole('button', { name: /grant access/i })).resolves.toBeInTheDocument();
  },
};
