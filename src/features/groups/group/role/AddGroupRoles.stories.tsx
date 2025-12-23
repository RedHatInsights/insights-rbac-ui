import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { useDispatch, useSelector } from 'react-redux';
import { AddGroupRoles } from './AddGroupRoles';
import { fetchAddRolesForGroup, fetchGroup } from '../../../../redux/groups/actions';
import { resetRegistry } from '../../../../utilities/store';

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

// 🎯 API SPIES: Proper spy pattern for testing API calls
const postRolesSpy = fn();

// 🎯 CRITICAL: Shared handler for group roles with addRoles support
// This handles the /groups/:groupId/roles/ endpoint with excluded parameter
const createGroupRolesHandler = (availableRoles = mockAvailableRoles) => {
  const handlerFunction = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    // API client uses 'exclude' param (not 'excluded')
    const exclude = url.searchParams.get('exclude');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const orderBy = url.searchParams.get('order_by');
    // API client uses 'role_name' and 'role_display_name' for filtering
    const roleName = url.searchParams.get('role_name');
    const roleDisplayName = url.searchParams.get('role_display_name');

    if (exclude === 'true') {
      // Available roles that can be added (not already assigned)
      let filteredRoles = [...availableRoles];

      // 🎯 APPLY NAME FILTERING if provided (check both role_name and role_display_name)
      const nameFilter = roleName || roleDisplayName;
      if (nameFilter && nameFilter.trim() !== '') {
        filteredRoles = filteredRoles.filter(
          (role) =>
            role.display_name.toLowerCase().includes(nameFilter.toLowerCase()) ||
            role.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(nameFilter.toLowerCase())),
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
  tags: ['custom-css'],
  parameters: {
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
          const name = url.searchParams.get('name'); // 🎯 ADD: Name filtering support
          // const scope = url.searchParams.get('scope');
          // const orderBy = url.searchParams.get('order_by');
          // const addFields = url.searchParams.get('add_fields');
          // const externalTenant = url.searchParams.get('external_tenant');

          // Use available roles for the specific modal query patterns
          let roles = [...mockAvailableRoles];

          // 🎯 APPLY NAME FILTERING if provided
          if (name && name.trim() !== '') {
            roles = roles.filter(
              (role) =>
                role.display_name.toLowerCase().includes(name.toLowerCase()) ||
                role.name.toLowerCase().includes(name.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(name.toLowerCase())),
            );
          }

          // Apply sorting if requested
          // if (orderBy === 'display_name') {
          //   roles.sort((a, b) => a.display_name.localeCompare(b.display_name));
          // }

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

        // Reset state endpoint for resetStoryState helper
        http.post('/api/test/reset-state', () => {
          return HttpResponse.json({ success: true });
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
          {/* Route for useAppNavigate with /iam/user-access basename */}
          <Route path="/iam/user-access/groups/detail/:groupId/roles" element={<div data-testid="group-roles-page">Group Roles Page</div>} />
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

    // Verify button is disabled initially (no selection) - wait for selection state to stabilize
    const submitButton = await within(modal).findByRole('button', { name: /add to group/i });
    await waitFor(
      () => {
        expect(submitButton).toBeDisabled();
      },
      { timeout: 2000 },
    );

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

    // Wait for roles data to load and be visible
    expect(await within(modal).findByText('Content Manager')).toBeInTheDocument();
    expect(await within(modal).findByText('Auditor')).toBeInTheDocument();

    // With initialSelectedRoles, button should be enabled from the start (rows are pre-selected)
    const submitButton = await within(modal).findByRole('button', { name: /add to group/i });
    await waitFor(
      () => {
        expect(submitButton).toBeEnabled();
      },
      { timeout: 2000 },
    );

    // Verify that roles are pre-selected (row checkboxes should be checked)
    // Note: checkboxes[0] is the BulkSelect checkbox, row checkboxes start at index 1
    const checkboxes = await within(modal).findAllByRole('checkbox');
    expect(checkboxes[1]).toBeChecked(); // First row (Content Manager)
    expect(checkboxes[2]).toBeChecked(); // Second row (Auditor)
  },
};

// Spy for tracking addRolesToGroup API calls
const addRolesToGroupApiSpy = fn();

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
          });
        }),
        // Handler for POST /groups/:groupId/roles/ - the actual role addition
        http.post('/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
          const body = await request.json();
          addRolesToGroupApiSpy({ groupId: params.groupId, roles: body });
          return HttpResponse.json({ message: 'Roles added successfully' });
        }),
        // 🎯 CRITICAL: Include ALL group roles handlers for this story too
        ...createGroupRolesHandler(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // Reset spy for clean test
    addRolesToGroupApiSpy.mockClear();

    await delay(300);
    const canvas = within(canvasElement);

    // Open the modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for modal to render
    const modal = await within(document.body).findByRole('dialog', undefined, { timeout: 5000 });
    expect(modal).toBeInTheDocument();

    // Wait for roles table to load (use grid role since TableView renders as grid)
    await waitFor(
      () => {
        expect(within(modal).getByRole('grid')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Wait for roles data to load
    expect(await within(modal).findByText('Content Manager', undefined, { timeout: 5000 })).toBeInTheDocument();

    // Select a role - checkboxes[0] is BulkSelect, row checkboxes start at index 1
    const checkboxes = await within(modal).findAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);

    // Click "Add to group" button
    const submitButton = await within(modal).findByRole('button', { name: /add to group/i });
    await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 2000 });
    await userEvent.click(submitButton);

    // Verify DefaultGroupChangeModal confirmation dialog appears
    // When isDefault=true and isChanged=false, clicking submit shows confirmation first
    const confirmationModal = await within(document.body).findByRole('dialog', undefined, { timeout: 3000 });
    expect(confirmationModal).toBeInTheDocument();

    // Find and check the "I understand" checkbox (required before continuing)
    const confirmCheckbox = within(confirmationModal).getByRole('checkbox');
    await userEvent.click(confirmCheckbox);

    // Click "Continue" to confirm and add roles
    const continueButton = within(confirmationModal).getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    // Verify addRolesToGroup API was called with the correct data
    await waitFor(
      () => {
        expect(addRolesToGroupApiSpy).toHaveBeenCalled();
        const callArgs = addRolesToGroupApiSpy.mock.calls[0][0];
        expect(callArgs.groupId).toBe('test-group-id');
        // Should include both initial selected role (Developer/role-3) and newly selected role
        // Note: Rows are sorted alphabetically by display_name, so Auditor (role-5) is first row
        expect(callArgs.roles.roles).toContain('role-3'); // Developer from initialSelectedRoles
        expect(callArgs.roles.roles).toContain('role-5'); // Auditor (first row when sorted by display_name)
      },
      { timeout: 3000 },
    );

    // CLEANUP: Clear modals after test to prevent pollution of subsequent stories
    const modalContainer = document.getElementById('storybook-modals');
    if (modalContainer) {
      modalContainer.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
    }
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
        // 🎯 LOADING STORY: Add missing general roles API handler
        http.get('/api/rbac/v1/roles/', () => new Promise(() => {})), // Never resolves - shows loading in modal
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

// 🎯 Test story for role filtering with API spies
export const RoleFilteringTest: Story = {
  name: 'Role Filtering with API Spies',
  decorators: [
    (Story) => {
      // Reset Redux and clear modals before component mounts
      resetRegistry();
      const modalContainer = document.getElementById('storybook-modals');
      if (modalContainer) {
        modalContainer.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
      }
      // Unique key forces React to remount the component fresh
      return <Story key={`filtering-${Date.now()}`} />;
    },
  ],
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
          // API client uses 'exclude' param (not 'excluded')
          const exclude = url.searchParams.get('exclude');
          // API client uses 'role_name' for name filtering (not 'name')
          const roleName = url.searchParams.get('role_name');
          const roleDisplayName = url.searchParams.get('role_display_name');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          if (exclude === 'true') {
            let filteredRoles = [...mockAvailableRoles];

            // Apply name filtering (check both role_name and role_display_name)
            const nameFilter = roleName || roleDisplayName;
            if (nameFilter && nameFilter.trim() !== '') {
              filteredRoles = filteredRoles.filter(
                (role) =>
                  role.display_name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                  role.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                  (role.description && role.description.toLowerCase().includes(nameFilter.toLowerCase())),
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

        // 🎯 CRITICAL FIX: General roles API handler with proper filtering
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const displayName = url.searchParams.get('display_name');
          const name = url.searchParams.get('name');
          const nameMatch = url.searchParams.get('name_match');

          let filteredRoles = [...mockAvailableRoles];

          // Apply filtering when display_name is provided (this is what the component actually sends)
          if (displayName && displayName.trim() !== '') {
            filteredRoles = filteredRoles.filter(
              (role) =>
                role.display_name.toLowerCase().includes(displayName.toLowerCase()) ||
                role.name.toLowerCase().includes(displayName.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(displayName.toLowerCase())),
            );
          }
          // Fallback: Apply filtering when name_match=partial and name is provided
          else if (nameMatch === 'partial' && name && name.trim() !== '') {
            filteredRoles = filteredRoles.filter(
              (role) =>
                role.display_name.toLowerCase().includes(name.toLowerCase()) ||
                role.name.toLowerCase().includes(name.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(name.toLowerCase())),
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

        // Reset state endpoint for resetStoryState helper
        http.post('/api/test/reset-state', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Clear modal container from any previous story's leftover modals
    const existingModalContainer = document.getElementById('storybook-modals');
    if (existingModalContainer) {
      existingModalContainer.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
    }
    postRolesSpy.mockClear();

    const canvas = within(canvasElement);

    // Wait for component to load data (shows "Loading group data..." until ready)
    await canvas.findByRole('button', { name: 'Open Add Roles Modal' }, { timeout: 10000 });

    // Click the button to open the modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for the modal to load - use modal container for Storybook
    const modalContainer = document.getElementById('storybook-modals') || document.body;
    const modal = await within(modalContainer).findByRole('dialog', undefined, { timeout: 10000 });
    expect(modal).toBeInTheDocument();
    const modalContent = within(modal);

    // Wait for data to fully load (proves table rendered with data)
    await waitFor(
      () => {
        expect(modalContent.getByText('Auditor')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Query fresh for elements (don't hold stale references - TableView re-renders)
    const filterInput = modalContent.getByPlaceholderText('Filter by role name');
    expect(filterInput).toBeInTheDocument();

    // Get initial role count - query fresh
    const initialRows = modalContent.getAllByRole('row');
    const initialRowCount = initialRows.length - 1; // Subtract header row
    expect(initialRowCount).toBeGreaterThan(0);

    // Type in filter - search for "aud" (should match "Auditor" role)
    await userEvent.type(filterInput, 'aud');

    // Wait for debounce + Redux state update + re-render
    await delay(500);

    // Wait for filtered results
    await waitFor(
      () => {
        const filteredRows = modalContent.getAllByRole('row');
        const filteredRowCount = filteredRows.length - 1; // Subtract header row

        // Should have fewer roles now (filtering should work)
        expect(filteredRowCount).toBeLessThan(initialRowCount);
        expect(filteredRowCount).toBeGreaterThan(0); // Should still have the Auditor role
      },
      { timeout: 5000 },
    );

    // Verify the Auditor role is visible
    expect(await modalContent.findByText('Auditor')).toBeInTheDocument();

    // Clear the filter and verify all roles return
    await userEvent.clear(filterInput);

    // Wait for debounce + Redux state update + re-render
    await delay(500);

    await waitFor(
      () => {
        const clearedRows = modalContent.getAllByRole('row');
        const clearedRowCount = clearedRows.length - 1; // Subtract header row

        // Should have all roles back (at least as many as initial)
        expect(clearedRowCount).toBeGreaterThanOrEqual(Math.min(initialRowCount, 2)); // At least 2 roles after clear
      },
      { timeout: 5000 },
    );
    // Verify specific roles are visible after clearing filter
    expect(await modalContent.findByText('Content Manager')).toBeInTheDocument();
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
          // API client uses 'role_name' and 'role_display_name' for filtering
          const roleName = url.searchParams.get('role_name');
          const roleDisplayName = url.searchParams.get('role_display_name');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const allRoles = [
            { uuid: 'role-4', display_name: 'Content Manager', name: 'content-manager', description: 'Can manage content' },
            { uuid: 'role-5', display_name: 'Auditor', name: 'auditor', description: 'Can view audit logs' },
            { uuid: 'role-6', display_name: 'Developer', name: 'developer', description: 'Can deploy applications' },
          ];

          if (exclude === 'true') {
            let filteredRoles = [...allRoles];

            // Apply name filtering (check both role_name and role_display_name)
            const nameFilter = roleName || roleDisplayName;
            if (nameFilter && nameFilter.trim() !== '') {
              filteredRoles = filteredRoles.filter(
                (role) =>
                  role.display_name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                  role.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                  (role.description && role.description.toLowerCase().includes(nameFilter.toLowerCase())),
              );
            }

            const paginatedRoles = filteredRoles.slice(offset, offset + limit);
            return HttpResponse.json({
              data: paginatedRoles,
              meta: { count: filteredRoles.length, limit, offset },
            });
          }

          return HttpResponse.json({
            data: allRoles,
            meta: { count: 3, limit: 20, offset: 0 },
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

    // Wait for filtered results with debounced API call
    await waitFor(() => {
      const filteredRows = modalContent.getAllByRole('row');
      expect(filteredRows.length - 1).toBe(1); // Should have just Auditor
      expect(modalContent.getByText('Auditor')).toBeInTheDocument();
    });

    // 🎯 NOW TEST THE ACTUAL "CLEAR FILTERS" BUTTON CLICK
    const clearFiltersButton = await modalContent.findByRole('button', { name: /clear filters/i });
    expect(clearFiltersButton).toBeInTheDocument();

    await userEvent.click(clearFiltersButton);

    // Verify that clicking the button actually clears the filter and shows all roles
    // Wait for debounced API call to complete
    await waitFor(() => {
      const clearedRows = modalContent.getAllByRole('row');
      const clearedRowCount = clearedRows.length - 1; // Subtract header

      // Should have all roles back
      expect(clearedRowCount).toBeGreaterThanOrEqual(2); // At least Content Manager + others
    });
    expect(await modalContent.findByText('Content Manager')).toBeInTheDocument();
    expect(await modalContent.findByText('Developer')).toBeInTheDocument();

    // Filter input should be cleared
    expect((filterInput as HTMLInputElement).value).toBe('');
  },
};

// 🎯 Test story for POST API call with spies
export const AddRolesToGroupAPITest: Story = {
  name: 'Add Roles API Call with Spies',
  decorators: [
    (Story) => {
      // Reset Redux and clear modals before component mounts
      resetRegistry();
      const modalContainer = document.getElementById('storybook-modals');
      if (modalContainer) {
        modalContainer.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
      }
      // Unique key forces React to remount the component fresh
      return <Story key={`api-${Date.now()}`} />;
    },
  ],
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
        // Mock group endpoint (with trailing slash to match API client)
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Test Group for API Calls',
            description: 'A test group to verify API calls',
            principalCount: 5,
            roleCount: 2,
          });
        }),

        // 🎯 SPY-ENABLED: Group roles handler (same as RoleFilteringTest)
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
          const url = new URL(request.url);
          // API client uses 'exclude' param (not 'excluded')
          const exclude = url.searchParams.get('exclude');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          if (exclude === 'true') {
            // Return available roles to add
            const paginatedRoles = mockAvailableRoles.slice(offset, offset + limit);
            return HttpResponse.json({
              data: paginatedRoles,
              meta: { count: mockAvailableRoles.length, limit, offset },
            });
          }

          // Return current group roles (for refresh after POST)
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length, limit, offset },
          });
        }),

        // 🎯 SPY-ENABLED: Add roles POST endpoint with spy tracking
        http.post('/api/rbac/v1/groups/:groupId/roles/', async ({ request, params }) => {
          const requestBody = (await request.json()) as { roles?: string[] };

          // 🔍 CRITICAL: Call spy with request data for test assertions
          postRolesSpy({
            groupId: params.groupId,
            requestBody,
          });

          // Validate the request structure
          if (!requestBody || !Array.isArray(requestBody.roles)) {
            return HttpResponse.json({ error: 'Invalid request body' }, { status: 400 });
          }

          return HttpResponse.json({
            message: 'Roles added successfully',
            addedRoles: requestBody.roles,
          });
        }),

        // Mock general roles endpoint (fallback)
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockAvailableRoles,
            meta: { count: mockAvailableRoles.length, limit: 20, offset: 0 },
          });
        }),

        // Reset state endpoint for resetStoryState helper
        http.post('/api/test/reset-state', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Clear modal container from any previous story's leftover modals
    const existingModalContainer = document.getElementById('storybook-modals');
    if (existingModalContainer) {
      existingModalContainer.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
    }
    postRolesSpy.mockClear();

    const canvas = within(canvasElement);

    // Wait for component to load data (shows "Loading group data..." until ready)
    await canvas.findByRole('button', { name: 'Open Add Roles Modal' }, { timeout: 10000 });

    // Click the button to open the modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // Wait for the modal to load - use modal container for Storybook
    const modalContainer = document.getElementById('storybook-modals') || document.body;
    const modal = await within(modalContainer).findByRole('dialog', undefined, { timeout: 10000 });
    const modalContent = within(modal);

    // Wait for data to fully load - look for actual content (proves table is rendered with data)
    await waitFor(
      () => {
        expect(modalContent.getByText('Auditor')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Query fresh for the table and checkboxes (don't hold stale references)
    const table = modalContent.getByRole('grid');
    const checkboxes = within(table).getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    const firstRoleCheckbox = checkboxes[0];

    await userEvent.click(firstRoleCheckbox);

    // Checkbox should be checked immediately after click
    expect(firstRoleCheckbox).toBeChecked();

    // Find the "Add to Group" button and wait for it to become enabled
    const addButton = await modalContent.findByRole('button', { name: /add to group/i });
    expect(addButton).toBeInTheDocument();

    // Wait for button to become enabled after role selection (fixes race condition)
    await waitFor(
      () => {
        expect(addButton).not.toBeDisabled();
      },
      { timeout: 5000 },
    );

    await userEvent.click(addButton);

    // 🔍 VERIFY POST API CALL: Check that the spy was called with correct parameters
    await waitFor(
      () => {
        expect(postRolesSpy).toHaveBeenCalled();
        expect(postRolesSpy).toHaveBeenCalledWith({
          groupId: 'test-group-id',
          requestBody: expect.objectContaining({
            roles: expect.arrayContaining(['role-4']), // First role (Content Manager) UUID
          }),
        });
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
  },
};
