import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { HttpResponse, http } from 'msw';
import { RoleAccessModal } from './RoleAccessModal';
import { type Group } from '../../../../data/queries/groups';

// Mock group data
const mockGroup: Group = {
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
};

// Mock roles data
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Workspace Administrator',
    display_name: 'Workspace Administrator',
    description: 'Full administrative access to workspace resources',
    accessCount: 15,
    modified: '2024-01-20T14:45:00Z',
  },
  {
    uuid: 'role-2',
    name: 'Workspace Viewer',
    display_name: 'Workspace Viewer',
    description: 'Read-only access to workspace resources',
    accessCount: 8,
    modified: '2024-01-18T10:30:00Z',
  },
  {
    uuid: 'role-3',
    name: 'Workspace Editor',
    display_name: 'Workspace Editor',
    description: 'Edit access to workspace resources',
    accessCount: 12,
    modified: '2024-01-19T09:15:00Z',
  },
  {
    uuid: 'role-4',
    name: 'Cost Administrator',
    display_name: 'Cost Administrator',
    description: 'Manage cost-related resources and budgets',
    accessCount: 6,
    modified: '2024-01-17T16:20:00Z',
  },
  {
    uuid: 'role-5',
    name: 'Security Auditor',
    display_name: 'Security Auditor',
    description: 'View security configurations and audit logs',
    accessCount: 10,
    modified: '2024-01-16T11:00:00Z',
  },
];

// Extended mock roles for pagination testing (25 roles total)
const mockRolesForPagination = [
  ...mockRoles,
  {
    uuid: 'role-6',
    name: 'Network Administrator',
    display_name: 'Network Administrator',
    description: 'Manage network configurations and connectivity',
    accessCount: 9,
    modified: '2024-01-15T08:30:00Z',
  },
  {
    uuid: 'role-7',
    name: 'Storage Manager',
    display_name: 'Storage Manager',
    description: 'Manage storage resources and volumes',
    accessCount: 7,
    modified: '2024-01-14T15:20:00Z',
  },
  {
    uuid: 'role-8',
    name: 'Database Administrator',
    display_name: 'Database Administrator',
    description: 'Manage database instances and configurations',
    accessCount: 11,
    modified: '2024-01-13T12:10:00Z',
  },
  {
    uuid: 'role-9',
    name: 'Application Developer',
    display_name: 'Application Developer',
    description: 'Develop and deploy applications',
    accessCount: 5,
    modified: '2024-01-12T09:45:00Z',
  },
  {
    uuid: 'role-10',
    name: 'Compliance Officer',
    display_name: 'Compliance Officer',
    description: 'Monitor and enforce compliance policies',
    accessCount: 8,
    modified: '2024-01-11T14:30:00Z',
  },
  {
    uuid: 'role-11',
    name: 'Backup Administrator',
    display_name: 'Backup Administrator',
    description: 'Manage backup and recovery operations',
    accessCount: 6,
    modified: '2024-01-10T11:15:00Z',
  },
  {
    uuid: 'role-12',
    name: 'Monitoring Specialist',
    display_name: 'Monitoring Specialist',
    description: 'Monitor system health and performance',
    accessCount: 9,
    modified: '2024-01-09T16:00:00Z',
  },
  {
    uuid: 'role-13',
    name: 'Incident Responder',
    display_name: 'Incident Responder',
    description: 'Respond to security incidents and alerts',
    accessCount: 10,
    modified: '2024-01-08T10:20:00Z',
  },
  {
    uuid: 'role-14',
    name: 'Resource Manager',
    display_name: 'Resource Manager',
    description: 'Manage compute and memory resources',
    accessCount: 7,
    modified: '2024-01-07T13:45:00Z',
  },
  {
    uuid: 'role-15',
    name: 'Access Reviewer',
    display_name: 'Access Reviewer',
    description: 'Review and audit user access permissions',
    accessCount: 8,
    modified: '2024-01-06T09:30:00Z',
  },
  {
    uuid: 'role-16',
    name: 'Policy Manager',
    display_name: 'Policy Manager',
    description: 'Create and manage access policies',
    accessCount: 12,
    modified: '2024-01-05T15:10:00Z',
  },
  {
    uuid: 'role-17',
    name: 'Service Account Manager',
    display_name: 'Service Account Manager',
    description: 'Manage service accounts and credentials',
    accessCount: 6,
    modified: '2024-01-04T11:00:00Z',
  },
  {
    uuid: 'role-18',
    name: 'Workspace Creator',
    display_name: 'Workspace Creator',
    description: 'Create and configure new workspaces',
    accessCount: 9,
    modified: '2024-01-03T14:20:00Z',
  },
  {
    uuid: 'role-19',
    name: 'Cost Analyst',
    display_name: 'Cost Analyst',
    description: 'Analyze and report on cost usage',
    accessCount: 5,
    modified: '2024-01-02T10:15:00Z',
  },
  {
    uuid: 'role-20',
    name: 'Integration Specialist',
    display_name: 'Integration Specialist',
    description: 'Manage system integrations and APIs',
    accessCount: 8,
    modified: '2024-01-01T12:30:00Z',
  },
  {
    uuid: 'role-21',
    name: 'Documentation Manager',
    display_name: 'Documentation Manager',
    description: 'Manage documentation and knowledge base',
    accessCount: 4,
    modified: '2023-12-31T09:00:00Z',
  },
  {
    uuid: 'role-22',
    name: 'Training Coordinator',
    display_name: 'Training Coordinator',
    description: 'Coordinate training programs and materials',
    accessCount: 3,
    modified: '2023-12-30T15:45:00Z',
  },
  {
    uuid: 'role-23',
    name: 'Quality Assurance',
    display_name: 'Quality Assurance',
    description: 'Ensure quality standards and testing',
    accessCount: 7,
    modified: '2023-12-29T11:20:00Z',
  },
  {
    uuid: 'role-24',
    name: 'Release Manager',
    display_name: 'Release Manager',
    description: 'Manage software releases and deployments',
    accessCount: 9,
    modified: '2023-12-28T13:10:00Z',
  },
  {
    uuid: 'role-25',
    name: 'Configuration Manager',
    display_name: 'Configuration Manager',
    description: 'Manage system configurations and settings',
    accessCount: 8,
    modified: '2023-12-27T10:00:00Z',
  },
];

// Mock role bindings response for the group
const mockRoleBindingsResponse = {
  data: [
    {
      last_modified: '2024-01-20T14:45:00Z',
      subject: {
        id: 'group-1',
        type: 'group',
        group: {
          name: 'Platform Administrators',
          description: 'Full access to all platform resources and administrative functions',
          user_count: 12,
        },
      },
      roles: [
        { id: 'role-1', name: 'Workspace Administrator' },
        { id: 'role-3', name: 'Workspace Editor' },
      ],
      resource: {
        id: 'workspace-1',
        type: 'workspace',
        workspace: {
          name: 'Development Workspace',
          type: 'standard',
          description: 'Development environment workspace',
        },
      },
    },
  ],
  meta: {
    count: 1,
    limit: 1000,
    offset: 0,
  },
};

// Wrapper component that manages modal state and provides trigger button
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ModalWrapper = ({ storyArgs }: { storyArgs?: any }) => {
  const args = storyArgs ?? {};
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    if (args.onClose) {
      args.onClose();
    }
    setIsOpen(false);
  };

  const handleUpdate = (selectedRoleIds: string[]) => {
    if (args.onUpdate) {
      args.onUpdate(selectedRoleIds);
    }
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Button variant="primary" onClick={() => setIsOpen(true)} data-testid="open-modal-button">
        Open Role Access Modal
      </Button>
      <RoleAccessModal {...args} isOpen={isOpen} onClose={handleClose} onUpdate={handleUpdate} />
    </div>
  );
};

// Provider wrapper - providers are handled globally by Storybook preview
const withProviders = () => {
  const ProviderWrapper = (Story: React.ComponentType) => (
    <MemoryRouter initialEntries={['/']}>
      <Story />
    </MemoryRouter>
  );
  ProviderWrapper.displayName = 'ProviderWrapper';
  return ProviderWrapper;
};

const meta: Meta<typeof RoleAccessModal> = {
  component: RoleAccessModal,
  decorators: [withProviders()],
  parameters: {
    docs: {
      description: {
        component: `
**RoleAccessModal** allows users to grant or remove role access for a group within a workspace.

This component demonstrates:
- **Modal Pattern**: Renders outside story canvas in document.body
- **Role Selection**: Checkbox-based role selection with search and filtering
- **Tab Navigation**: Switch between all roles and selected roles
- **React Query Integration**: Loads roles using React Query hooks
- **API Integration**: Fetches currently assigned roles for the group
- **Pagination**: Handles large role lists with pagination
- **Sorting**: Sortable columns for role management

### Testing Note
Since modals break autodocs, these stories use a button wrapper pattern where you click a button to open the modal for testing.
        `,
      },
    },
  },
  render: (args) => <ModalWrapper storyArgs={args} />,
};

export default meta;
type Story = StoryObj<typeof RoleAccessModal>;

const defaultMswHandlers = [
  http.get('/api/rbac/v1/roles/', () => {
    return HttpResponse.json({
      data: mockRoles,
      meta: { count: mockRoles.length, limit: 1000, offset: 0 },
    });
  }),
  http.get('/api/rbac/v2/role-bindings/by-subject', ({ request }) => {
    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subject_id') || url.searchParams.get('subjectId');
    const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId');
    const subjectType = url.searchParams.get('subject_type') || url.searchParams.get('subjectType');
    const resourceType = url.searchParams.get('resource_type') || url.searchParams.get('resourceType');
    if (
      subjectId === 'group-1' &&
      resourceId === 'workspace-1' &&
      (subjectType === 'group' || !subjectType) &&
      (resourceType === 'workspace' || !resourceType)
    ) {
      return HttpResponse.json(mockRoleBindingsResponse);
    }
    return HttpResponse.json({ data: [], meta: { count: 0, limit: 1000, offset: 0 } });
  }),
];

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    isOpen: false,
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: { handlers: defaultMswHandlers },
    docs: {
      description: {
        story: `Default state with modal closed. Click the button to open the modal.

## Additional Test Stories

- **ModalOpen**: Modal in open state with role selection interface
- **EditAccessJourney**: Full journey — open modal, change selection, save, verify callback
- **LoadingState**: Tests loading state with skeleton components
- **EmptyState**: Tests empty state when no roles are available
- **Pagination**: Tests pagination functionality
- **TabSwitchWithPagination**: Tests tab switching after pagination`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = await canvas.findByTestId('open-modal-button');
    await expect(openButton).toBeInTheDocument();
  },
};

export const ModalOpen: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <RoleAccessModal
        {...args}
        isOpen={isOpen}
        onClose={() => {
          args.onClose?.();
          setIsOpen(false);
        }}
        onUpdate={(selectedRoleIds) => {
          args.onUpdate?.(selectedRoleIds);
          setIsOpen(false);
        }}
      />
    );
  },
  args: {
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: { handlers: defaultMswHandlers },
    docs: { description: { story: 'Modal in open state, showing the role selection interface.' } },
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
    await expect(body.findByText(/Grant or remove access/)).resolves.toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <RoleAccessModal
        {...args}
        isOpen={isOpen}
        onClose={() => {
          args.onClose?.();
          setIsOpen(false);
        }}
        onUpdate={(ids) => {
          args.onUpdate?.(ids);
          setIsOpen(false);
        }}
      />
    );
  },
  args: {
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', () => new Promise(() => {})),
        http.get('/api/rbac/v2/role-bindings/by-subject', () => new Promise(() => {})),
      ],
    },
    docs: { description: { story: 'Modal showing loading state with skeleton components while roles are being fetched.' } },
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
    await waitFor(
      async () => {
        const skeletonElements = document.body.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
    expect(body.queryByText(/no roles found/i)).not.toBeInTheDocument();
  },
};

export const EmptyState: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <RoleAccessModal
        {...args}
        isOpen={isOpen}
        onClose={() => {
          args.onClose?.();
          setIsOpen(false);
        }}
        onUpdate={(ids) => {
          args.onUpdate?.(ids);
          setIsOpen(false);
        }}
      />
    );
  },
  args: {
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', () => HttpResponse.json({ data: [], meta: { count: 0, limit: 1000, offset: 0 } })),
        http.get('/api/rbac/v2/role-bindings/by-subject', () => HttpResponse.json({ data: [], meta: { count: 0, limit: 1000, offset: 0 } })),
      ],
    },
    docs: { description: { story: 'Modal showing empty state when no roles are available.' } },
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
    await waitFor(
      async () => {
        await expect(body.findByText(/no roles found/i)).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
    const skeletonElements = document.body.querySelectorAll('[class*="skeleton"]');
    expect(skeletonElements.length).toBe(0);
  },
};

export const Pagination: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <RoleAccessModal
        {...args}
        isOpen={isOpen}
        onClose={() => {
          args.onClose?.();
          setIsOpen(false);
        }}
        onUpdate={(ids) => {
          args.onUpdate?.(ids);
          setIsOpen(false);
        }}
      />
    );
  },
  args: {
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', () =>
          HttpResponse.json({
            data: mockRolesForPagination,
            meta: { count: mockRolesForPagination.length, limit: 1000, offset: 0 },
          }),
        ),
        ...defaultMswHandlers.slice(1),
      ],
    },
    docs: { description: { story: 'Modal showing pagination functionality with 25 roles. Test page navigation and per-page selection.' } },
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
    await waitFor(
      () => {
        expect(body.getByText('Access Reviewer')).toBeInTheDocument();
        expect(body.getByText('Incident Responder')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
    const paginationTexts = body.getAllByText(/1 - 10/i);
    expect(paginationTexts.length).toBeGreaterThan(0);
    const nextButtons = body.getAllByRole('button', { name: /next/i });
    const enabledNextButtons = nextButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true');
    expect(enabledNextButtons.length).toBeGreaterThan(0);
    if (enabledNextButtons.length > 0) {
      await userEvent.click(enabledNextButtons[0]);
      await waitFor(
        () => {
          const page2Texts = body.getAllByText(/11 - 20/i);
          expect(page2Texts.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    }
    const perPageButtons = body.queryAllByRole('button', { name: /items per page/i });
    if (perPageButtons.length > 0) {
      const perPageButton = perPageButtons[perPageButtons.length - 1];
      await userEvent.click(perPageButton);
      await waitFor(
        () => {
          const perPage20 = body.getByRole('option', { name: /20 per page/i });
          expect(perPage20).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
      const perPage20 = body.getByRole('option', { name: /20 per page/i });
      await userEvent.click(perPage20);
      await waitFor(
        () => {
          const updatedPaginationTexts = body.getAllByText(/1 - 20/i);
          expect(updatedPaginationTexts.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    }
  },
};

export const TabSwitchWithPagination: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <RoleAccessModal
        {...args}
        isOpen={isOpen}
        onClose={() => {
          args.onClose?.();
          setIsOpen(false);
        }}
        onUpdate={(ids) => {
          args.onUpdate?.(ids);
          setIsOpen(false);
        }}
      />
    );
  },
  args: {
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', () =>
          HttpResponse.json({
            data: mockRolesForPagination,
            meta: { count: mockRolesForPagination.length, limit: 1000, offset: 0 },
          }),
        ),
        ...defaultMswHandlers.slice(1),
      ],
    },
    docs: {
      description: {
        story:
          'Tests the bug fix where switching to Selected tab after navigating to page 2 should reset to page 1 and show selected roles correctly.',
      },
    },
  },
  play: async () => {
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
    await waitFor(
      () => {
        expect(body.getByText('Access Reviewer')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
    const nextButtons = body.getAllByRole('button', { name: /next/i });
    const enabledNextButtons = nextButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true');
    if (enabledNextButtons.length > 0) {
      await userEvent.click(enabledNextButtons[0]);
      await waitFor(
        () => {
          const page2Texts = body.getAllByText(/11 - 20/i);
          expect(page2Texts.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    }
    const selectedTab = body.getByRole('button', { name: /selected/i });
    await userEvent.click(selectedTab);
    await waitFor(
      () => {
        const page1Texts = body.getAllByText(/1 - 2/i);
        expect(page1Texts.length).toBeGreaterThan(0);
        expect(body.getByText('Workspace Administrator')).toBeInTheDocument();
        expect(body.getByText('Workspace Editor')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    const page2Texts = body.queryAllByText(/11 - 20/i);
    expect(page2Texts.length).toBe(0);
  },
};

/**
 * Edit access journey: open modal via button, change role selection, save, verify callback.
 *
 * **Journey:**
 * 1. Click "Open Role Access Modal" to open the modal
 * 2. Wait for roles and current bindings to load (Workspace Administrator, Workspace Editor pre-selected)
 * 3. Deselect one role so there are changes
 * 4. Click "Update" and verify onUpdate is called with the new selection
 * 5. Modal closes after update
 */
export const EditAccessJourney: Story = {
  name: 'Journey / Edit access (grant or remove roles)',
  tags: ['autodocs'],
  args: {
    isOpen: false,
    group: mockGroup,
    workspaceId: 'workspace-1',
    workspaceName: 'Development Workspace',
    onClose: fn(),
    onUpdate: fn(),
  },
  parameters: {
    msw: { handlers: defaultMswHandlers },
    docs: {
      description: {
        story: `
## Edit Access Journey

Complete user flow for granting or removing role access for a group in a workspace.

### Journey Flow
1. Click **Open Role Access Modal** to open the modal
2. Modal loads roles and current bindings (e.g. Workspace Administrator, Workspace Editor selected)
3. User deselects one role to change the selection
4. Click **Update** — \`onUpdate\` is called with the new role IDs
5. Modal closes

### Verification
- \`onUpdate\` is called exactly once with the expected array of selected role IDs
- Dialog is no longer in the document after update
        `,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const onUpdateSpy = args.onUpdate as ReturnType<typeof fn>;
    onUpdateSpy.mockClear();

    const canvas = within(canvasElement);
    const openButton = await canvas.findByTestId('open-modal-button');
    await expect(openButton).toBeInTheDocument();
    await userEvent.click(openButton);

    const body = within(document.body);
    const dialog = await body.findByRole('dialog', {}, { timeout: 5000 });
    await expect(dialog).toBeInTheDocument();
    await expect(body.findByText(/Grant or remove access/)).resolves.toBeInTheDocument();

    await waitFor(
      async () => {
        await expect(body.findByText('Workspace Administrator')).resolves.toBeInTheDocument();
        await expect(body.findByText('Workspace Editor')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const modalScope = within(dialog);
    const table = await modalScope.findByRole('grid', { name: /roles selection table/i });
    const tableScope = within(table);

    const workspaceEditorRow = await tableScope.findByText('Workspace Editor').then((el) => el.closest('tr'));
    expect(workspaceEditorRow).toBeInTheDocument();
    const editorCheckbox = workspaceEditorRow?.querySelector('input[type="checkbox"]');
    expect(editorCheckbox).toBeInTheDocument();
    await userEvent.click(editorCheckbox!);

    const updateButton = await modalScope.findByRole('button', { name: /update/i });
    expect(updateButton).not.toBeDisabled();
    await userEvent.click(updateButton);

    await waitFor(
      () => {
        expect(onUpdateSpy).toHaveBeenCalledTimes(1);
        expect(onUpdateSpy).toHaveBeenCalledWith(['role-1']);
      },
      { timeout: 5000 },
    );

    await waitFor(
      () => {
        expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
