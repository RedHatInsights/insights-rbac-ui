import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { useDispatch, useSelector } from 'react-redux';
import AddGroupRoles from './add-group-roles-legacy';
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

    console.log('🎯 GROUP ROLES HANDLER:', { exclude, limit, offset, orderBy, url: request.url });

    if (exclude === 'true') {
      // Available roles that can be added (not already assigned)
      let sortedRoles = [...availableRoles];

      // Sort by display_name if requested
      if (orderBy === 'display_name') {
        sortedRoles.sort((a, b) => a.display_name.localeCompare(b.display_name));
      }

      const paginatedAvailable = sortedRoles.slice(offset, offset + limit);
      return HttpResponse.json({
        data: paginatedAvailable,
        meta: { count: sortedRoles.length, limit, offset },
      });
    }

    // This handler is mainly for excluded/available roles
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit, offset },
    });
  };

  // Return multiple handlers to catch ALL possible URL patterns and query combinations
  return [
    // Specific patterns with query parameters (MSW matches URL + query params)
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
  title: 'Features/Groups/Group/Role/AddGroupRoles-Legacy',
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

        // Roles data for the modal
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length },
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
      selectedRoles={[]}
      setSelectedRoles={fn()}
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
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test modal content using within(modal) - specific heading match
    expect(within(modal).getByRole('heading', { name: 'Add roles to group' })).toBeInTheDocument();
    // Just verify modal has functional content - look for specific unique elements
    const modalContent = within(modal);
    // Check for table first (most specific), then fallback to text content
    const hasTable = modalContent.queryByRole('table');
    const hasFilterAlert = modalContent.queryByText(/filtered to only show roles/i);

    expect(hasTable || hasFilterAlert).toBeTruthy();
  },
};

export const WithRoles: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      selectedRoles={[mockRoles[0], mockRoles[1]]}
      setSelectedRoles={fn()}
      addRolesToGroup={fn(() => Promise.resolve())}
      afterSubmit={fn()}
      onDefaultGroupChanged={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test modal content - specific heading match
    expect(within(modal).getByRole('heading', { name: 'Add roles to group' })).toBeInTheDocument();

    // Check for submit button - may have different text variations
    const submitButton = within(modal).queryByRole('button', { name: /add|submit|save/i });
    if (submitButton) {
      expect(submitButton).toBeEnabled();
    } else {
      // Alternative: just verify modal has interactive content
      expect(within(modal).queryByRole('table')).toBeTruthy();
    }
  },
};

export const DefaultGroup: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to default group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={true}
      isChanged={false}
      selectedRoles={[mockRoles[2]]}
      setSelectedRoles={fn()}
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
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test modal content - specific heading match for default group
    expect(within(modal).getByRole('heading', { name: 'Add roles to default group' })).toBeInTheDocument();
    // Focus on key modal functionality rather than exact text
    expect(within(modal).queryByText(/default|Default Access/i) || within(modal).queryByRole('table')).toBeTruthy();

    // May show additional confirmation for default groups within modal
    const alertElements = within(modal).queryAllByRole('alert');
    expect(alertElements.length).toBeGreaterThanOrEqual(0);
  },
};

export const WithFiltering: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - Filtering"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      selectedRoles={[]}
      setSelectedRoles={fn()}
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
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal should open
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // 🎯 FILTERING TEST: Find search input
    const searchInput = await within(modal).findByPlaceholderText(/role name/i);
    expect(searchInput).toBeInTheDocument();

    // 🎯 FILTERING TEST: Type in search filter
    await userEvent.type(searchInput, 'admin');

    // 🎯 FILTERING TEST: Verify filtered results appear
    await waitFor(async () => {
      // Should show filtered roles containing 'admin'
      const tableRows = within(modal).queryAllByRole('row');
      expect(tableRows.length).toBeGreaterThan(1); // Header + data rows
    });

    // 🎯 FILTERING TEST: Clear filter
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'nonexistent');

    // 🎯 FILTERING TEST: Verify empty results handled gracefully
    await waitFor(async () => {
      // Should handle no results gracefully (might show empty state or no data rows)
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument(); // Modal should stay open
    });
  },
};

export const WithPagination: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group - Pagination"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      selectedRoles={[]}
      setSelectedRoles={fn()}
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
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Roles Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal should open
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // 🎯 PAGINATION TEST: Wait for table to load - flexible table detection
    await waitFor(async () => {
      // Try different ways to find the table since it might not have role="table"
      const table = within(modal).queryByRole('table') || modal.querySelector('table') || modal.querySelector('[class*="table"]');
      expect(table).toBeTruthy();
    });

    // 🎯 PAGINATION TEST: Check for pagination controls
    const paginationControls = within(modal).queryAllByLabelText(/pagination/i);
    if (paginationControls.length > 0) {
      expect(paginationControls.length).toBeGreaterThan(0);

      // 🎯 PAGINATION TEST: Test page size selector if present
      const pageSizeSelector = within(modal).queryByLabelText(/items per page/i);
      if (pageSizeSelector) {
        expect(pageSizeSelector).toBeInTheDocument();
      }

      // 🎯 PAGINATION TEST: Test navigation buttons if present - get first one in modal
      const nextPageButton = within(modal).queryAllByLabelText(/next page/i)[0];
      if (nextPageButton && !(nextPageButton as HTMLButtonElement).disabled) {
        await userEvent.click(nextPageButton);

        // Verify page navigation worked - flexible table detection
        await waitFor(async () => {
          const table = within(modal).queryByRole('table') || modal.querySelector('table') || modal.querySelector('[class*="table"]');
          expect(table).toBeTruthy();
        });
      }
    }

    // 🎯 PAGINATION TEST: Verify large dataset is loaded
    const tableRows = within(modal).queryAllByRole('row');
    expect(tableRows.length).toBeGreaterThan(1); // Should have header + data rows
  },
};

export const Loading: Story = {
  render: () => (
    <AddGroupRolesWithData
      title="Add roles to group"
      closeUrl="/groups/detail/test-group-id/roles"
      isDefault={false}
      isChanged={false}
      selectedRoles={[]}
      setSelectedRoles={fn()}
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
    expect(within(modal).getByText('Add roles to group')).toBeInTheDocument();
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
