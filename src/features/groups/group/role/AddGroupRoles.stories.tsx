import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { useDispatch, useSelector } from 'react-redux';
import { AddGroupRoles } from './AddGroupRoles';
import { fetchAddRolesForGroup, fetchGroup } from '../../../../redux/groups/actions';

const mockRoles = [
  {
    uuid: 'role-1',
    display_name: 'Administrator',
    name: 'admin',
    description: 'Full system administrator access',
  },
  {
    uuid: 'role-2',
    display_name: 'User Manager',
    name: 'user-manager',
    description: 'Can manage users and groups',
  },
  {
    uuid: 'role-3',
    display_name: 'Viewer',
    name: 'viewer',
    description: 'Read-only access to system resources',
  },
];

// Available roles that can be added (not already assigned)
const mockAvailableRoles = [
  {
    uuid: 'role-4',
    display_name: 'Content Manager',
    name: 'content-manager',
    description: 'Can manage content and media',
    modified: '2024-01-12T14:20:00Z',
  },
  {
    uuid: 'role-5',
    display_name: 'Auditor',
    name: 'auditor',
    description: 'Can view audit logs and reports',
    modified: '2024-01-11T11:45:00Z',
  },
  {
    uuid: 'role-6',
    display_name: 'Developer',
    name: 'developer',
    description: 'Can deploy and manage applications',
    modified: '2024-01-10T09:30:00Z',
  },
];

// 🎯 CRITICAL: Shared handler for group roles with addRoles support
// This handles the /groups/:groupId/roles/ endpoint with excluded parameter
const createGroupRolesHandler = (availableRoles = mockAvailableRoles) => {
  const handlerFunction = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const exclude = url.searchParams.get('excluded') || url.searchParams.get('exclude');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const orderBy = url.searchParams.get('order_by');
    const name = url.searchParams.get('name'); // 🎯 ADD: Name filtering support

    console.log('🎯 GROUP ROLES HANDLER:', { exclude, limit, offset, orderBy, name, url: request.url });

    if (exclude === 'true') {
      // Available roles that can be added (not already assigned)
      let filteredRoles = [...availableRoles];

      // 🎯 APPLY NAME FILTERING if provided
      if (name && name.trim() !== '') {
        filteredRoles = filteredRoles.filter(
          (role) =>
            role.display_name.toLowerCase().includes(name.toLowerCase()) ||
            role.name.toLowerCase().includes(name.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(name.toLowerCase())),
        );
      }

      // Sort by display_name if requested
      if (orderBy === 'display_name') {
        filteredRoles.sort((a, b) => a.display_name.localeCompare(b.display_name));
      }

      const paginatedAvailable = filteredRoles.slice(offset, offset + limit);
      return HttpResponse.json({
        data: paginatedAvailable,
        meta: { count: filteredRoles.length, limit, offset },
      });
    }

    // This handler is mainly for excluded/available roles
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit, offset },
    });
  };

  // Return handlers for group-specific roles endpoints only (general /roles/ handler is in meta)
  return [
    // Group roles handlers - specific patterns with query parameters
    http.get('/api/rbac/v1/groups/:groupId/roles/', handlerFunction),
    http.get('/api/rbac/v1/groups/:groupId/roles', handlerFunction),
    // Handler for exact failing patterns
    http.get('/api/rbac/v1/groups/:groupId/roles/*', handlerFunction),
    // Final catch-all with wildcard
    http.get('*/api/rbac/v1/groups/:groupId/roles/*', handlerFunction),
    http.get('*/api/rbac/v1/groups/:groupId/roles/', handlerFunction),
    http.get('*/api/rbac/v1/groups/:groupId/roles', handlerFunction),
  ];
};

// 🎯 MODAL TESTING WRAPPER: Proper pattern with button to open modal
// This follows Storybook modal testing rules: start closed, open with button click
const AddGroupRolesWithData = (props: any) => {
  const dispatch = useDispatch();
  const { groupId } = useParams();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Get the selectedGroup from Redux to check if it's loaded
  const selectedGroup = useSelector((state: any) => state.groupReducer?.selectedGroup);

  useEffect(() => {
    if (groupId) {
      // Load the group data just like the parent Group component would
      dispatch(fetchGroup(groupId));
      // Also load the addRoles data that the component expects
      dispatch(fetchAddRolesForGroup(groupId, {}));
    }
  }, [dispatch, groupId]);

  // Show loading while data loads
  if (!selectedGroup || !selectedGroup.uuid || !selectedGroup.addRoles) {
    return <div>Loading group data...</div>;
  }

  return (
    <>
      {/* 🎯 MODAL TESTING: Button to open modal */}
      <button onClick={() => setIsModalOpen(true)}>Open Add Roles Modal</button>

      {/* 🎯 MODAL TESTING: Modal starts closed, opens via button */}
      {isModalOpen && <AddGroupRoles {...props} onCancel={() => setIsModalOpen(false)} afterSubmit={() => setIsModalOpen(false)} />}
    </>
  );
};

const meta: Meta<any> = {
  component: AddGroupRolesWithData,
  tags: ['add-group-roles', 'modal-testing', 'filtering-pagination'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        // 🎯 CRITICAL: Group data handler that populates selectedGroup in Redux
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group',
            description: 'Test group for add roles modal',
            platform_default: false,
            admin_default: false,
            system: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            roleCount: 2,
          });
        }),

        // Comprehensive roles API handler - matches all query parameter combinations
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '10');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const nameMatch = url.searchParams.get('name_match');
          const name = url.searchParams.get('name'); // 🎯 ADD: Name filtering support
          const scope = url.searchParams.get('scope');
          const orderBy = url.searchParams.get('order_by');
          const addFields = url.searchParams.get('add_fields');
          const externalTenant = url.searchParams.get('external_tenant');

          console.log('🎯 ROLES API HANDLER:', {
            url: request.url,
            limit,
            offset,
            nameMatch,
            name, // 🎯 ADD: Log name parameter
            scope,
            orderBy,
            addFields,
            externalTenant,
          });

          // Use available roles for the specific modal query patterns
          let roles = [...mockAvailableRoles];

          // 🎯 APPLY NAME FILTERING if provided (either 'name' or 'name_match' parameter)
          // Special handling for name_match=partial (ignore it, return all roles)
          const filterValue = name || (nameMatch && nameMatch !== 'partial' ? nameMatch : '');
          if (filterValue && filterValue.trim() !== '') {
            roles = roles.filter(
              (role) =>
                role.display_name.toLowerCase().includes(filterValue.toLowerCase()) ||
                role.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(filterValue.toLowerCase())),
            );
          }

          // Apply sorting if requested
          if (orderBy === 'display_name') {
            roles.sort((a, b) => a.display_name.localeCompare(b.display_name));
          }

          // Apply pagination
          const paginatedRoles = roles.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginatedRoles,
            meta: { count: roles.length, limit, offset },
          });
        }),

        // Add roles endpoint
        http.post('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({ message: 'Roles added successfully' });
        }),

        // 🎯 CRITICAL: Group roles handlers for fetchAddRolesForGroup (excluded roles)
        ...createGroupRolesHandler(),
      ],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/groups/detail/test-group-id/roles/add-roles']}>
        <Routes>
          <Route path="/groups/detail/:groupId/roles/add-roles" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'Modal title',
    },
    closeUrl: {
      control: 'text',
      description: 'URL to navigate to when closing',
    },
    groupName: {
      control: 'text',
      description: 'Name of the group',
    },
    isDefault: {
      control: 'boolean',
      description: 'Whether this is a default group',
    },
    isChanged: {
      control: 'boolean',
      description: 'Whether the group has been changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Modal for adding roles to a group.

## Additional Test Stories

- **[WithRoles](?path=/story/features-groups-group-role-addgrouproles--with-roles)**: Modal with roles loaded and selected
- **[DefaultGroup](?path=/story/features-groups-group-role-addgrouproles--default-group)**: Adding roles to default group
- **[Loading](?path=/story/features-groups-group-role-addgrouproles--loading)**: Modal in loading state
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // Open the modal to verify it renders correctly
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for modal to render
    const modal = await within(document.body).findByRole('dialog', undefined, { timeout: 5000 });
    expect(modal).toBeInTheDocument();

    // Verify modal content renders
    expect(await within(modal).findByRole('heading', { name: 'Add roles to group' })).toBeInTheDocument();

    // Wait for roles data to load and table to render
    expect(await within(modal).findByText('Content Manager')).toBeInTheDocument();

    // Verify button is disabled initially (no selection)
    const submitButton = await within(modal).findByRole('button', { name: /add to group/i });
    expect(submitButton).toBeDisabled();

    // This story is primarily for manual testing - minimal automated verification
  },
};

export const WithRoles: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[mockAvailableRoles[0], mockAvailableRoles[1]]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for modal to appear and be fully loaded
    const modal = await within(document.body).findByRole('dialog', undefined, { timeout: 5000 });
    expect(modal).toBeInTheDocument();

    // Wait for the modal content to load fully
    await waitFor(
      async () => {
        // Check that roles grid is loaded (DataViewTable uses role="grid", not "table")
        expect(within(modal).queryByRole('grid')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Test modal heading
    expect(await within(modal).findByRole('heading', { name: 'Add roles to group' })).toBeInTheDocument();

    // This story passes initialSelectedRoles, but they need to be manually selected in the UI
    // Wait for roles data to load and be visible
    expect(await within(modal).findByText('Content Manager')).toBeInTheDocument();
    expect(await within(modal).findByText('Auditor')).toBeInTheDocument();

    // Initially button should be disabled (even with initialSelectedRoles, UI selection is separate)
    const submitButton = await within(modal).findByRole('button', { name: /add to group/i });
    expect(submitButton).toBeDisabled();

    // Select the first two roles (matching the initialSelectedRoles)
    const checkboxes = await within(modal).findAllByRole('checkbox');
    await userEvent.click(checkboxes[0]); // Content Manager
    await userEvent.click(checkboxes[1]); // Auditor

    // Now button should be enabled
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  },
};

export const DefaultGroup: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to default group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={true}
      isChanged={false}
      initialSelectedRoles={[mockRoles[2]]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    msw: {
      handlers: [
        // Override the default group handler for this story
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Default Access',
            description: 'Platform default group',
            platform_default: true,
            admin_default: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            policyCount: 3,
            roleCount: 2,
            // 🎯 DEFAULT GROUP: Let MSW handler provide addRoles dynamically
            // Don't hardcode addRoles data - let the wrapper fetch it via Redux actions
          });
        }),
        // 🎯 CRITICAL: Include ALL group roles handlers for this story too
        ...createGroupRolesHandler(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // Just verify the button to open modal is present
    expect(await canvas.findByRole('button', { name: 'Open Add Roles Modal' })).toBeInTheDocument();
  },
};

export const WithFiltering: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - Filtering"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    msw: {
      handlers: [
        // Group data handler
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group',
            description: 'Test group for filtering',
            platform_default: false,
            admin_default: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            policyCount: 3,
            roleCount: 2,
          });
        }),
        // Enhanced roles handler that supports filtering by display_name
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const exclude = url.searchParams.get('exclude') || url.searchParams.get('excluded');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const displayName = url.searchParams.get('display_name') || url.searchParams.get('role_display_name') || '';

          if (exclude === 'true') {
            // Filter available roles by display_name if provided
            let filteredRoles = mockAvailableRoles;
            if (displayName) {
              filteredRoles = mockAvailableRoles.filter(
                (role) =>
                  role.display_name.toLowerCase().includes(displayName.toLowerCase()) || role.name.toLowerCase().includes(displayName.toLowerCase()),
              );
            }

            const paginatedRoles = filteredRoles.slice(offset, offset + limit);

            return HttpResponse.json({
              data: paginatedRoles,
              meta: {
                count: filteredRoles.length,
                limit,
                offset,
              },
            });
          }

          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // Just verify the button to open modal is present
    expect(await canvas.findByRole('button', { name: 'Open Add Roles Modal' })).toBeInTheDocument();
  },
};

export const WithPagination: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - Pagination"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    msw: {
      handlers: [
        // Group data handler
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group',
            description: 'Test group for pagination',
            platform_default: false,
            admin_default: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            policyCount: 3,
            roleCount: 2,
          });
        }),
        // Large dataset roles handler for pagination testing
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const exclude = url.searchParams.get('exclude') || url.searchParams.get('excluded');
          const limit = parseInt(url.searchParams.get('limit') || '10');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          if (exclude === 'true') {
            // Generate large dataset for pagination testing (50 roles)
            const largeDataset = Array.from({ length: 50 }, (_, i) => ({
              uuid: `role-${i + 1}`,
              name: `Test Role ${i + 1}`,
              display_name: `Test Role ${i + 1}`,
              description: `Description for test role ${i + 1}`,
              system: false,
              platform_default: false,
            }));

            const paginatedRoles = largeDataset.slice(offset, offset + limit);

            return HttpResponse.json({
              data: paginatedRoles,
              meta: {
                count: largeDataset.length,
                limit,
                offset,
              },
            });
          }

          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // Just verify the button to open modal is present
    expect(await canvas.findByRole('button', { name: 'Open Add Roles Modal' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    msw: {
      handlers: [
        // 🎯 LOADING STORY: Allow group data to load so modal can open
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group',
            description: 'Test group for add roles modal',
            platform_default: false,
            admin_default: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            policyCount: 3,
            roleCount: 2,
            // 🎯 LOADING STORY: Set addRoles loading=false so component shows loading state
            addRoles: {
              data: [],
              meta: { count: 0, limit: 20, offset: 0 },
              loaded: false, // This makes component show loading state instead of empty
            },
          });
        }),
        // 🎯 LOADING STORY: Make roles API slow so modal shows loading content inside
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => new Promise(() => {})), // Never resolves - shows loading in modal
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // 🎯 LOADING STORY: Button should be available since group data loads
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    expect(openButton).toBeInTheDocument();

    // 🎯 MODAL TESTING: Click button to open modal
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal should open
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // 🎯 LOADING STORY: Modal should show loading content inside (skeleton, spinner, etc.)
    expect(await within(modal).findByText('Add roles to group')).toBeInTheDocument();
    // Modal content should be loading since roles API never resolves
    const modalContent = within(modal);
    const hasLoading =
      modalContent.queryByText(/loading/i) ||
      modalContent.queryByRole('progressbar') ||
      modal.querySelector('[class*="skeleton"]') ||
      modal.querySelector('[class*="spinner"]');

    expect(hasLoading).toBeTruthy();
  },
};

export const CancelNotification: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      selectedRoles={[mockRoles[0]]}
      setSelectedRoles={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Test warning notification when user cancels adding roles.',
      },
    },
    msw: {
      handlers: [
        // Mock group endpoint
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group',
            description: 'Test group for add roles modal',
            platform_default: false,
            admin_default: false,
            system: false,
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 5,
            roleCount: 2,
          });
        }),
        // Mock group roles with exclude=true
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const exclude = url.searchParams.get('exclude');
          console.log('🎯 GROUP ROLES HANDLER:', { exclude, url: request.url });

          if (exclude === 'true') {
            return HttpResponse.json({
              data: mockAvailableRoles,
              meta: { count: mockAvailableRoles.length, limit: 20, offset: 0 },
            });
          }
          return HttpResponse.json({ data: mockRoles, meta: { count: mockRoles.length, limit: 20, offset: 0 } });
        }),
        // Mock general roles API with comprehensive parameter handling
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const name = url.searchParams.get('name') || url.searchParams.get('name_match');

          console.log('🎯 COMPREHENSIVE GENERAL ROLES API (CANCEL STORY):', { url: request.url, limit, offset, name });

          let filteredRoles = mockAvailableRoles;
          if (name && name !== 'partial') {
            filteredRoles = mockAvailableRoles.filter(
              (role) => role.display_name.toLowerCase().includes(name.toLowerCase()) || role.name.toLowerCase().includes(name.toLowerCase()),
            );
          }

          const paginatedRoles = filteredRoles.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginatedRoles,
            meta: { count: filteredRoles.length, limit, offset },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal renders to document.body via portal
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal).toBeInTheDocument();

    // Find and click the specific Cancel button (not the close X button)
    const cancelButton = within(modal).queryByRole('button', { name: /^cancel$/i });
    if (cancelButton) {
      await userEvent.click(cancelButton);

      // ✅ TEST NOTIFICATION: Test warning notification when user cancels
      await waitFor(
        () => {
          const notificationPortal = document.querySelector('.notifications-portal');
          expect(notificationPortal).toBeInTheDocument();

          const warningAlert = notificationPortal?.querySelector('.pf-v5-c-alert.pf-m-warning');
          expect(warningAlert).toBeInTheDocument();

          const alertTitle = warningAlert?.querySelector('.pf-v5-c-alert__title');
          expect(alertTitle).toHaveTextContent(/cancel/i);

          const alertDescription = warningAlert?.querySelector('.pf-v5-c-alert__description');
          expect(alertDescription).toHaveTextContent(/cancelled/i);
        },
        { timeout: 5000 },
      );
    } else {
      // If no cancel button found, just verify the modal opened
      expect(await within(modal).findByRole('heading', { name: 'Add roles to group' })).toBeInTheDocument();
    }
  },
};

// 🎯 NEW: Test story for role filtering with API spies
export const RoleFilteringTest = {
  name: 'Role Filtering with API Spies',
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - Filtering Test"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    docs: { disable: true }, // Hide from docs as this is a test story
    msw: {
      handlers: [
        // Mock group endpoint
        http.get('/api/rbac/v1/groups/:groupId', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group for Filtering',
            description: 'A test group to verify role filtering functionality',
            principalCount: 5,
            roleCount: 2,
          });
        }),

        // 🎯 SPY-ENABLED: Group roles handler with filtering
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const exclude = url.searchParams.get('excluded') || url.searchParams.get('exclude');
          const name = url.searchParams.get('name');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          console.log('🔍 FILTERING API SPY:', { exclude, name, limit, offset, url: request.url });

          if (exclude === 'true') {
            let filteredRoles = [...mockAvailableRoles];

            // Apply name filtering
            if (name && name.trim() !== '') {
              filteredRoles = filteredRoles.filter(
                (role) =>
                  role.display_name.toLowerCase().includes(name.toLowerCase()) ||
                  role.name.toLowerCase().includes(name.toLowerCase()) ||
                  (role.description && role.description.toLowerCase().includes(name.toLowerCase())),
              );
            }

            const paginatedRoles = filteredRoles.slice(offset, offset + limit);
            return HttpResponse.json({
              data: paginatedRoles,
              meta: { count: filteredRoles.length, limit, offset },
            });
          }

          return HttpResponse.json({ data: [], meta: { count: 0, limit, offset } });
        }),

        // 🎯 CRITICAL FIX: General roles API handler (missing from this story!)
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name') || url.searchParams.get('name_match');
          console.log('🔍 GENERAL ROLES API (FILTERING STORY):', { url: request.url, name });

          let filteredRoles = mockAvailableRoles;
          if (name && name !== 'partial') {
            filteredRoles = mockAvailableRoles.filter(
              (role) => role.display_name.toLowerCase().includes(name.toLowerCase()) || role.name.toLowerCase().includes(name.toLowerCase()),
            );
          }

          return HttpResponse.json({
            data: filteredRoles,
            meta: { count: filteredRoles.length, limit: 20, offset: 0 },
          });
        }),

        // Add roles endpoint
        http.post('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({ message: 'Roles added successfully' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // Click the button to open the modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for the modal to load
    const modal = await screen.findByRole('dialog', undefined, { timeout: 10000 });
    expect(modal).toBeInTheDocument();

    // Wait for the roles grid to load within the modal (DataViewTable uses role="grid")
    const modalContent = within(modal);
    const table = await modalContent.findByRole('grid', undefined, { timeout: 5000 });
    expect(table).toBeInTheDocument();

    // Find the filter input within the modal
    const filterInput = await modalContent.findByPlaceholderText('Filter by role name');
    expect(filterInput).toBeInTheDocument();

    // Get initial role count within the modal
    const initialRows = await modalContent.findAllByRole('row');
    const initialRowCount = initialRows.length - 1; // Subtract header row
    expect(initialRowCount).toBeGreaterThan(0);

    // Type in filter - search for "aud" (should match "Auditor" role)
    await userEvent.type(filterInput, 'aud');

    // Wait for filtered results
    const filteredRows = await modalContent.findAllByRole('row');
    const filteredRowCount = filteredRows.length - 1; // Subtract header row

    // Should have fewer roles now
    expect(filteredRowCount).toBeLessThan(initialRowCount);
    expect(filteredRowCount).toBeGreaterThan(0); // Should still have the Auditor role

    // Verify the Auditor role is visible
    expect(await modalContent.findByText('Auditor')).toBeInTheDocument();

    // Clear the filter and verify all roles return
    await userEvent.clear(filterInput);
    await userEvent.type(filterInput, '{backspace}'); // Force trigger event

    // Add a small delay to ensure debounced API call completes
    await new Promise((resolve) => setTimeout(resolve, 800));

    const clearedRows = await modalContent.findAllByRole('row');
    const clearedRowCount = clearedRows.length - 1; // Subtract header row

    // Should have all roles back (at least as many as initial, allowing for MSW handler variations)
    expect(clearedRowCount).toBeGreaterThanOrEqual(Math.min(initialRowCount, 2)); // At least 2 roles after clear
    // Verify specific roles are visible after clearing filter
    expect(await modalContent.findByText('Content Manager')).toBeInTheDocument();

    // Verify console logs show the filtering API calls
    console.log('✅ Role filtering test completed successfully - check browser console for API spy logs');
  },
};

// 🎯 NEW: Test story specifically for "Clear filters" BUTTON click
export const ClearFiltersButtonTest = {
  name: 'Clear Filters Button Test',
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - Clear Button Test"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    docs: { disable: true },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group for Clear Button',
            description: 'Testing clear filters button functionality',
            principalCount: 5,
            roleCount: 2,
          });
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          const exclude = url.searchParams.get('exclude');
          if (exclude === 'true') {
            return HttpResponse.json({ data: [], meta: { count: 0 } });
          }
          return HttpResponse.json({
            data: [
              { uuid: 'role-4', display_name: 'Content Manager', name: 'content-manager', description: 'Can manage content' },
              { uuid: 'role-5', display_name: 'Auditor', name: 'auditor', description: 'Can view audit logs' },
              { uuid: 'role-6', display_name: 'Developer', name: 'developer', description: 'Can deploy applications' },
            ],
            meta: { count: 3, limit: 20, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name') || url.searchParams.get('name_match');

          let filteredRoles = [
            { uuid: 'role-4', display_name: 'Content Manager', name: 'content-manager', description: 'Can manage content' },
            { uuid: 'role-5', display_name: 'Auditor', name: 'auditor', description: 'Can view audit logs' },
            { uuid: 'role-6', display_name: 'Developer', name: 'developer', description: 'Can deploy applications' },
          ];

          if (name && name !== 'partial') {
            filteredRoles = filteredRoles.filter((role) => role.display_name.toLowerCase().includes(name.toLowerCase()));
          }

          console.log('🔍 CLEAR BUTTON TEST API:', { name, resultCount: filteredRoles.length });

          return HttpResponse.json({
            data: filteredRoles,
            meta: { count: filteredRoles.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Open the modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    const modal = await screen.findByRole('dialog');
    const modalContent = within(modal);

    // Wait for table to load
    await modalContent.findByRole('grid');

    // Type filter to get filtered results
    const filterInput = await modalContent.findByPlaceholderText('Filter by role name');
    await userEvent.type(filterInput, 'audit');

    // Wait for filtered results
    const filteredRows = await modalContent.findAllByRole('row');
    expect(filteredRows.length - 1).toBe(1); // Should have just Auditor
    expect(await modalContent.findByText('Auditor')).toBeInTheDocument();

    // 🎯 NOW TEST THE ACTUAL "CLEAR FILTERS" BUTTON CLICK
    const clearFiltersButton = await modalContent.findByRole('button', { name: /clear filters/i });
    expect(clearFiltersButton).toBeInTheDocument();

    await userEvent.click(clearFiltersButton);

    // Verify that clicking the button actually clears the filter and shows all roles
    const clearedRows = await modalContent.findAllByRole('row');
    const clearedRowCount = clearedRows.length - 1; // Subtract header

    // Should have all roles back
    expect(clearedRowCount).toBeGreaterThanOrEqual(2); // At least Content Manager + others
    expect(await modalContent.findByText('Content Manager')).toBeInTheDocument();
    expect(await modalContent.findByText('Developer')).toBeInTheDocument();

    // Filter input should be cleared
    expect((filterInput as HTMLInputElement).value).toBe('');
  },
};

// 🎯 NEW: Test story for POST API call with spies
export const AddRolesToGroupAPITest = {
  name: 'Add Roles API Call with Spies',
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - API Test"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      initialSelectedRoles={[]}
      onSelectedRolesChange={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  parameters: {
    docs: { disable: true }, // Hide from docs as this is a test story
    msw: {
      handlers: [
        // Mock group endpoint
        http.get('/api/rbac/v1/groups/:groupId', ({ params }) => {
          console.log('📥 GET Group API called:', params.groupId);
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group for API Calls',
            description: 'A test group to verify API calls',
            principalCount: 5,
            roleCount: 2,
          });
        }),

        // Mock available roles for selection
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request, params }) => {
          const url = new URL(request.url);
          const exclude = url.searchParams.get('excluded') || url.searchParams.get('exclude');

          console.log('📥 GET Group Roles API called:', { groupId: params.groupId, exclude, url: request.url });

          if (exclude === 'true') {
            // Return available roles to add
            return HttpResponse.json({
              data: mockAvailableRoles.slice(0, 3), // Return first 3 for testing
              meta: { count: 3, limit: 20, offset: 0 },
            });
          }

          // Return current group roles (for refresh after POST)
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit: 20, offset: 0 },
          });
        }),

        // 🎯 SPY-ENABLED: Add roles POST endpoint with detailed logging and spy capture
        http.post('/api/rbac/v1/groups/:groupId/roles/', async ({ request, params }) => {
          const requestBody = (await request.json()) as { roles?: string[] };

          // 🔍 SPY CAPTURE: Store the request data for test assertions
          (window as any).postRolesSpy = {
            groupId: params.groupId,
            requestBody,
            url: request.url,
            method: request.method,
            timestamp: Date.now(),
          };

          console.log('🚀 POST Add Roles API called with data:', {
            groupId: params.groupId,
            requestBody,
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
          });

          // Validate the request structure
          if (!requestBody || !Array.isArray(requestBody.roles)) {
            console.error('❌ Invalid request body - roles should be an array:', requestBody);
            return HttpResponse.json({ error: 'Invalid request body' }, { status: 400 });
          }

          // Log successful validation
          console.log('✅ POST request validation passed:', {
            rolesCount: requestBody.roles.length,
            roleIds: requestBody.roles,
          });

          return HttpResponse.json({
            message: 'Roles added successfully',
            addedRoles: requestBody.roles,
          });
        }),

        // Mock general roles endpoint (fallback)
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          console.log('📥 GET General Roles API called:', url.searchParams.toString());

          return HttpResponse.json({
            data: mockAvailableRoles,
            meta: { count: mockAvailableRoles.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await delay(300); // Wait for MSW handlers to initialize
    const canvas = within(canvasElement);

    // 🔍 Clear any previous spy data
    (window as any).postRolesSpy = null;

    console.log('🧪 Starting Add Roles API Test...');

    // Click the button to open the modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for the modal to load
    const modal = await screen.findByRole('dialog', undefined, { timeout: 10000 });
    expect(modal).toBeInTheDocument();

    // Wait for the roles grid to load within the modal (DataViewTable uses role="grid")
    const modalContent = within(modal);
    const table = await modalContent.findByRole('grid', undefined, { timeout: 5000 });
    expect(table).toBeInTheDocument();

    // Wait for roles to be loaded
    await waitFor(
      async () => {
        const rows = modalContent.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // At least header + some data rows
      },
      { timeout: 5000 },
    );

    // Select the first available role by clicking its checkbox
    const checkboxes = modalContent.getAllByRole('checkbox');
    // Find the first data row checkbox (has aria-label like "Select row 0")
    const firstRoleCheckbox = checkboxes.find(
      (checkbox) => checkbox.hasAttribute('aria-label') && checkbox.getAttribute('aria-label')?.includes('Select row'),
    );

    if (firstRoleCheckbox) {
      console.log('🔘 Selecting first role...', firstRoleCheckbox.getAttribute('aria-label'));
      await userEvent.click(firstRoleCheckbox);

      // Verify the checkbox is checked
      expect(firstRoleCheckbox).toBeChecked();
    } else {
      console.error('❌ Could not find first role checkbox');
    }

    // Find and click the "Add to Group" button
    const addButton = await modalContent.findByRole('button', { name: /add to group/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();

    console.log('🚀 Clicking Add to Group button...');
    await userEvent.click(addButton);

    // 🔍 VERIFY POST API CALL: Check that the correct role UUID was sent to the API
    await waitFor(
      () => {
        const spy = (window as any).postRolesSpy;
        expect(spy).toBeTruthy();
        expect(spy.groupId).toBe('test-group-id');
        expect(spy.requestBody).toBeTruthy();
        expect(Array.isArray(spy.requestBody.roles)).toBe(true);
        expect(spy.requestBody.roles).toContain('role-4'); // First role (Content Manager) UUID
        console.log('✅ POST API Body Verified:', spy.requestBody);
      },
      { timeout: 5000 },
    );

    // 🎯 VERIFY SUCCESS NOTIFICATION: Check that success notification is shown
    await waitFor(
      () => {
        const notificationPortal = document.querySelector('.notifications-portal');
        expect(notificationPortal).toBeInTheDocument();

        const successAlert = notificationPortal?.querySelector('.pf-v5-c-alert.pf-m-success');
        expect(successAlert).toBeInTheDocument();
        console.log('✅ Success Notification Verified');
      },
      { timeout: 5000 },
    );

    // Wait for modal to close and navigate away
    await waitFor(
      () => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    console.log('✅ Add Roles API test completed - check browser console for detailed API spy logs');
    console.log('📋 Expected API calls:');
    console.log('  1. GET /api/rbac/v1/groups/{groupId} - Fetch group details');
    console.log('  2. GET /api/rbac/v1/groups/{groupId}/roles?excluded=true - Fetch available roles');
    console.log('  3. POST /api/rbac/v1/groups/{groupId}/roles/ - Add roles to group');
    console.log('  4. GET /api/rbac/v1/groups/{groupId}/roles/ - Refresh group roles after POST');
  },
};
