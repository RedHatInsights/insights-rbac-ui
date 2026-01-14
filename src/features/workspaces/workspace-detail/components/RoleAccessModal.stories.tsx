import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { Button } from '@patternfly/react-core';
import { HttpResponse, http } from 'msw';
import { RoleAccessModal } from './RoleAccessModal';
import { Group } from '../../../../redux/groups/reducer';
import { getRegistry } from '../../../../utilities/store';
import { RegistryContext } from '../../../../utilities/store';
import messages from '../../../../locales/data.json';
import { locale } from '../../../../locales/locale';

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
        {
          id: 'role-1',
          name: 'Workspace Administrator',
        },
        {
          id: 'role-3',
          name: 'Workspace Editor',
        },
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
const ModalWrapper = ({ ...storyArgs }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    if (storyArgs.onClose) {
      storyArgs.onClose();
    }
    setIsOpen(false);
  };

  const handleUpdate = (selectedRoleIds: string[]) => {
    if (storyArgs.onUpdate) {
      storyArgs.onUpdate(selectedRoleIds);
    }
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Button variant="primary" onClick={() => setIsOpen(true)} data-testid="open-modal-button">
        Open Role Access Modal
      </Button>
      <RoleAccessModal {...storyArgs} isOpen={isOpen} onClose={handleClose} onUpdate={handleUpdate} />
    </div>
  );
};

// Provider wrapper
const withProviders = () => {
  const registry = getRegistry();
  const ProviderWrapper = (Story: React.ComponentType) => (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <RegistryContext.Provider
        value={{
          getRegistry,
        }}
      >
        <Provider store={registry.getStore()}>
          <MemoryRouter initialEntries={['/']}>
            <Story />
          </MemoryRouter>
        </Provider>
      </RegistryContext.Provider>
    </IntlProvider>
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
- **Redux Integration**: Loads roles from Redux store
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
    msw: {
      handlers: [
        // Mock roles API - handles requests from fetchRolesWithPolicies
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: {
              count: mockRoles.length,
              limit: 1000,
              offset: 0,
            },
          });
        }),
        // Mock role bindings API
        http.get('/api/rbac/v2/role-bindings/by-subject', ({ request }) => {
          const url = new URL(request.url);
          // Check for both snake_case and camelCase parameter names
          const subjectId = url.searchParams.get('subject_id') || url.searchParams.get('subjectId');
          const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId');
          const subjectType = url.searchParams.get('subject_type') || url.searchParams.get('subjectType');
          const resourceType = url.searchParams.get('resource_type') || url.searchParams.get('resourceType');

          // Return role bindings if the subject and resource match
          // The API might pass these as query parameters or the client might format them differently
          if (
            subjectId === 'group-1' &&
            resourceId === 'workspace-1' &&
            (subjectType === 'group' || !subjectType) &&
            (resourceType === 'workspace' || !resourceType)
          ) {
            return HttpResponse.json(mockRoleBindingsResponse);
          }

          // Return empty response for other requests
          return HttpResponse.json({
            data: [],
            meta: {
              count: 0,
              limit: 1000,
              offset: 0,
            },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: `Default state with modal closed. Click the button to open the modal.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[ModalOpen](?path=/story/features-workspaces-workspace-detail-components-roleaccessmodal--modal-open)**: Modal in open state with role selection interface
- **[LoadingState](?path=/story/features-workspaces-workspace-detail-components-roleaccessmodal--loading-state)**: Tests loading state with skeleton components
- **[EmptyState](?path=/story/features-workspaces-workspace-detail-components-roleaccessmodal--empty-state)**: Tests empty state when no roles are available
- **[Pagination](?path=/story/features-workspaces-workspace-detail-components-roleaccessmodal--pagination)**: Tests pagination functionality with page navigation and per-page selection
- **[TabSwitchWithPagination](?path=/story/features-workspaces-workspace-detail-components-roleaccessmodal--tab-switch-with-pagination)**: Tests tab switching after pagination to ensure selected roles display correctly`,
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
    msw: {
      handlers: [
        // Mock roles API - handles requests from fetchRolesWithPolicies
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: {
              count: mockRoles.length,
              limit: 1000,
              offset: 0,
            },
          });
        }),
        // Mock role bindings API
        http.get('/api/rbac/v2/role-bindings/by-subject', ({ request }) => {
          const url = new URL(request.url);
          // Check for both snake_case and camelCase parameter names
          const subjectId = url.searchParams.get('subject_id') || url.searchParams.get('subjectId');
          const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId');
          const subjectType = url.searchParams.get('subject_type') || url.searchParams.get('subjectType');
          const resourceType = url.searchParams.get('resource_type') || url.searchParams.get('resourceType');

          // Return role bindings if the subject and resource match
          // The API might pass these as query parameters or the client might format them differently
          if (
            subjectId === 'group-1' &&
            resourceId === 'workspace-1' &&
            (subjectType === 'group' || !subjectType) &&
            (resourceType === 'workspace' || !resourceType)
          ) {
            return HttpResponse.json(mockRoleBindingsResponse);
          }

          // Return empty response for other requests
          return HttpResponse.json({
            data: [],
            meta: {
              count: 0,
              limit: 1000,
              offset: 0,
            },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: 'Modal in open state, showing the role selection interface.',
      },
    },
  },
  play: async () => {
    // Wait for modal to appear - IMPORTANT: Use document.body for modals, not canvas
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
    msw: {
      handlers: [
        // Mock roles API - never resolves to show loading state
        http.get('/api/rbac/v1/roles/', () => new Promise(() => {})),
        // Mock role bindings API - never resolves to show loading state
        http.get('/api/rbac/v2/role-bindings/by-subject', () => new Promise(() => {})),
      ],
    },
    docs: {
      description: {
        story: 'Modal showing loading state with skeleton components while roles are being fetched.',
      },
    },
  },
  play: async () => {
    // Wait for modal to appear - IMPORTANT: Use document.body for modals, not canvas
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Test skeleton loading state (check for skeleton class)
    await waitFor(
      async () => {
        const skeletonElements = document.body.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Should NOT show empty state content
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
    msw: {
      handlers: [
        // Mock roles API - returns empty array
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: [],
            meta: {
              count: 0,
              limit: 1000,
              offset: 0,
            },
          });
        }),
        // Mock role bindings API - returns empty array
        http.get('/api/rbac/v2/role-bindings/by-subject', () => {
          return HttpResponse.json({
            data: [],
            meta: {
              count: 0,
              limit: 1000,
              offset: 0,
            },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: 'Modal showing empty state when no roles are available.',
      },
    },
  },
  play: async () => {
    // Wait for modal to appear - IMPORTANT: Use document.body for modals, not canvas
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Wait for empty state to appear
    await waitFor(
      async () => {
        await expect(body.findByText(/no roles found/i)).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Should NOT show skeleton loading state
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
    msw: {
      handlers: [
        // Mock roles API - returns extended list for pagination testing
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRolesForPagination,
            meta: {
              count: mockRolesForPagination.length,
              limit: 1000,
              offset: 0,
            },
          });
        }),
        // Mock role bindings API
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

          return HttpResponse.json({
            data: [],
            meta: {
              count: 0,
              limit: 1000,
              offset: 0,
            },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: 'Modal showing pagination functionality with 25 roles. Test page navigation and per-page selection.',
      },
    },
  },
  play: async () => {
    // Wait for modal to appear - IMPORTANT: Use document.body for modals, not canvas
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Wait for table to load with first page of roles
    await waitFor(
      async () => {
        // Verify first page shows 10 roles (default perPage)
        await expect(body.findByText('Workspace Administrator')).resolves.toBeInTheDocument();
        await expect(body.findByText('Security Auditor')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Verify pagination shows correct info (1 - 10 of 25)
    // There are two pagination controls (top and bottom), so we check for at least one
    const paginationTexts = body.getAllByText(/1 - 10/i);
    await expect(paginationTexts.length).toBeGreaterThan(0);

    // Find pagination controls - there should be next page buttons (multiple due to top and bottom pagination)
    const nextButtons = body.getAllByRole('button', { name: /next/i });
    await expect(nextButtons.length).toBeGreaterThan(0);

    // Find an enabled next button (since we have more than 10 roles)
    const enabledNextButtons = nextButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true');
    await expect(enabledNextButtons.length).toBeGreaterThan(0);

    // Test navigating to next page using the first enabled next button
    if (enabledNextButtons.length > 0) {
      await userEvent.click(enabledNextButtons[0]);

      // Wait for second page to load
      await waitFor(
        async () => {
          // Verify we're on page 2 (should show roles 11-20)
          const page2Texts = body.getAllByText(/11 - 20/i);
          await expect(page2Texts.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    }

    // Test per-page selection - find per page dropdown (use bottom pagination for better visibility)
    const perPageButtons = body.getAllByRole('button', { name: /items per page/i });
    if (perPageButtons.length > 0) {
      // Use the last one (bottom pagination) as it's more likely to be visible
      const perPageButton = perPageButtons[perPageButtons.length - 1];
      await userEvent.click(perPageButton);

      // Wait for dropdown menu and select 20 per page
      await waitFor(
        async () => {
          const perPage20 = body.getByRole('option', { name: /20 per page/i });
          await expect(perPage20).toBeInTheDocument();
          await userEvent.click(perPage20);
        },
        { timeout: 5000 },
      );

      // Verify pagination updated to show 1 - 20 of 25
      await waitFor(
        async () => {
          const updatedPaginationTexts = body.getAllByText(/1 - 20/i);
          await expect(updatedPaginationTexts.length).toBeGreaterThan(0);
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
    msw: {
      handlers: [
        // Mock roles API - returns extended list for pagination testing
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRolesForPagination,
            meta: {
              count: mockRolesForPagination.length,
              limit: 1000,
              offset: 0,
            },
          });
        }),
        // Mock role bindings API - returns role bindings with roles from first page
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

          return HttpResponse.json({
            data: [],
            meta: {
              count: 0,
              limit: 1000,
              offset: 0,
            },
          });
        }),
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
    // Wait for modal to appear - IMPORTANT: Use document.body for modals, not canvas
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Wait for table to load with first page of roles
    await waitFor(
      async () => {
        await expect(body.findByText('Workspace Administrator')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Navigate to page 2
    const nextButtons = body.getAllByRole('button', { name: /next/i });
    const enabledNextButtons = nextButtons.filter((btn) => !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true');

    if (enabledNextButtons.length > 0) {
      await userEvent.click(enabledNextButtons[0]);

      // Wait for page 2 to load
      await waitFor(
        async () => {
          const page2Texts = body.getAllByText(/11 - 20/i);
          await expect(page2Texts.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    }

    // Now switch to Selected tab
    const selectedTab = body.getByRole('tab', { name: /selected/i });
    await userEvent.click(selectedTab);

    // Wait for selected tab to load and verify:
    // 1. Page should reset to 1 (should show "1 - X" where X is number of selected roles)
    // 2. Selected roles should be visible
    await waitFor(
      async () => {
        // Verify we're back on page 1 (should show "1 - 2" since we have 2 selected roles from mockRoleBindingsResponse)
        const page1Texts = body.getAllByText(/1 - 2/i);
        await expect(page1Texts.length).toBeGreaterThan(0);

        // Verify selected roles are visible
        await expect(body.findByText('Workspace Administrator')).resolves.toBeInTheDocument();
        await expect(body.findByText('Workspace Editor')).resolves.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify we're NOT still on page 2 (should not show "11 - 20")
    const page2Texts = body.queryAllByText(/11 - 20/i);
    expect(page2Texts.length).toBe(0);
  },
};
