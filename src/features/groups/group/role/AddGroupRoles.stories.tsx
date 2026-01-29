import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { AddGroupRoles } from './AddGroupRoles';

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

// API spy for testing
const addRolesApiSpy = fn();

// Standard group data handler
const createGroupHandler = (overrides = {}) =>
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
      ...overrides,
    });
  });

// Standard roles list handler with filtering
const createRolesHandler = (roles = mockAvailableRoles) => [
  // General roles endpoint
  http.get('/api/rbac/v1/roles/', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const displayName = url.searchParams.get('display_name');
    const name = url.searchParams.get('name');

    let filtered = [...roles];

    const filter = displayName || name;
    if (filter && filter.trim() !== '') {
      filtered = filtered.filter(
        (role) =>
          role.display_name.toLowerCase().includes(filter.toLowerCase()) ||
          role.name.toLowerCase().includes(filter.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(filter.toLowerCase())),
      );
    }

    const paginated = filtered.slice(offset, offset + limit);
    return HttpResponse.json({
      data: paginated,
      meta: { count: filtered.length, limit, offset },
    });
  }),
  // Group-specific roles endpoint (for available roles with exclude=true)
  http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request }) => {
    const url = new URL(request.url);
    const exclude = url.searchParams.get('exclude');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const displayName = url.searchParams.get('role_display_name');
    const name = url.searchParams.get('role_name');

    let filtered = [...roles];

    const filter = displayName || name;
    if (filter && filter.trim() !== '') {
      filtered = filtered.filter(
        (role) =>
          role.display_name.toLowerCase().includes(filter.toLowerCase()) ||
          role.name.toLowerCase().includes(filter.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(filter.toLowerCase())),
      );
    }

    // When exclude=true, return available roles to add
    if (exclude === 'true') {
      const paginated = filtered.slice(offset, offset + limit);
      return HttpResponse.json({
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      });
    }

    // Otherwise return empty (current group roles)
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit, offset },
    });
  }),
];

// Add roles POST handler
const createAddRolesHandler = (spy?: ReturnType<typeof fn>) =>
  http.post('/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
    const body = (await request.json()) as { roles?: string[] };
    spy?.({ groupId: params.groupId, roles: body });
    return HttpResponse.json({ message: 'Roles added successfully' });
  });

const meta: Meta<typeof AddGroupRoles> = {
  component: AddGroupRoles,
  tags: ['custom-css'],
  parameters: {
    msw: {
      handlers: [createGroupHandler(), ...createRolesHandler(), createAddRolesHandler()],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/user-access/groups/detail/test-group-id/roles/add-roles']}>
        <Routes>
          <Route path="/user-access/groups/detail/:groupId/roles/add-roles" element={<Story />} />
          <Route path="/iam/user-access/groups/detail/:groupId/roles" element={<div data-testid="group-roles-page">Group Roles Page</div>} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Modal for adding roles to a group.

The component fetches its own data via React Query.
`,
      },
    },
  },
  play: async () => {
    await delay(300);

    // Modal is open by default (rendered directly as route)
    const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
    expect(modal).toBeInTheDocument();

    // Verify modal content renders
    expect(await within(modal).findByRole('heading', { name: /add roles/i })).toBeInTheDocument();

    // Wait for roles data to load
    expect(await within(modal).findByText('Content Manager')).toBeInTheDocument();

    // Button should be disabled initially (no selection)
    const submitButton = await within(modal).findByRole('button', { name: /add to group/i });
    await waitFor(() => expect(submitButton).toBeDisabled(), { timeout: 2000 });
  },
};

export const SelectAndAddRoles: Story = {
  name: 'Select and Add Roles',
  parameters: {
    msw: {
      handlers: [createGroupHandler(), ...createRolesHandler(), createAddRolesHandler(addRolesApiSpy)],
    },
  },
  play: async () => {
    addRolesApiSpy.mockClear();
    await delay(300);

    const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
    const modalContent = within(modal);

    // Wait for roles to load
    await modalContent.findByText('Content Manager');

    // Select a role
    const checkboxes = await modalContent.findAllByRole('checkbox');
    await userEvent.click(checkboxes[1]); // First row checkbox

    // Button should be enabled
    const submitButton = await modalContent.findByRole('button', { name: /add to group/i });
    await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 2000 });

    // Click submit
    await userEvent.click(submitButton);

    // Verify API was called
    await waitFor(
      () => {
        expect(addRolesApiSpy).toHaveBeenCalled();
        expect(addRolesApiSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            groupId: 'test-group-id',
          }),
        );
      },
      { timeout: 3000 },
    );
  },
};

export const DefaultGroup: Story = {
  name: 'Default Group (Shows Warning)',
  parameters: {
    docs: {
      description: {
        story: `
When adding roles to an **unmodified default group**, a warning modal appears
asking for confirmation before modifying.

The component determines this from the group data:
- \`platform_default: true\` = this is the default group
- \`system: true\` = it hasn't been modified yet
`,
      },
    },
    msw: {
      handlers: [
        // Return a platform_default + system group
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Default access',
            description: 'Platform default group',
            platform_default: true,
            admin_default: false,
            system: true, // Not yet modified
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 'All',
            roleCount: 0,
          });
        }),
        ...createRolesHandler(),
        createAddRolesHandler(addRolesApiSpy),
      ],
    },
  },
  play: async () => {
    addRolesApiSpy.mockClear();
    await delay(300);

    const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
    const modalContent = within(modal);

    // Wait for roles to load
    await modalContent.findByText('Content Manager');

    // Select a role
    const checkboxes = await modalContent.findAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);

    // Click submit
    const submitButton = await modalContent.findByRole('button', { name: /add to group/i });
    await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 2000 });
    await userEvent.click(submitButton);

    // Warning modal should appear (DefaultGroupChangeModal)
    const warningModal = await within(document.body).findByRole('dialog', undefined, { timeout: 5000 });
    expect(warningModal).toBeInTheDocument();

    // Check the confirmation checkbox
    const confirmCheckbox = within(warningModal).getByRole('checkbox');
    await userEvent.click(confirmCheckbox);

    // Click Continue
    const continueButton = within(warningModal).getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    // API should be called after confirmation
    await waitFor(
      () => {
        expect(addRolesApiSpy).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  },
};

export const AlreadyModifiedDefaultGroup: Story = {
  name: 'Already Modified Default Group (No Warning)',
  parameters: {
    docs: {
      description: {
        story: `
When adding roles to an **already modified default group**, no warning appears
because the group has already been "copied".

The component determines this from the group data:
- \`platform_default: true\` = this is a default group
- \`system: false\` = it has already been modified
`,
      },
    },
    msw: {
      handlers: [
        // Return a modified default group (system: false)
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          return HttpResponse.json({
            uuid: params.groupId,
            name: 'Custom default access',
            description: 'Modified default group',
            platform_default: true,
            admin_default: false,
            system: false, // Already modified
            created: '2024-01-15T10:30:00.000Z',
            modified: '2024-01-15T10:30:00.000Z',
            principalCount: 'All',
            roleCount: 2,
          });
        }),
        ...createRolesHandler(),
        createAddRolesHandler(addRolesApiSpy),
      ],
    },
  },
  play: async () => {
    addRolesApiSpy.mockClear();
    await delay(300);

    const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
    const modalContent = within(modal);

    // Wait for roles to load
    await modalContent.findByText('Content Manager');

    // Select a role
    const checkboxes = await modalContent.findAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);

    // Click submit - should NOT show warning for already-modified group
    const submitButton = await modalContent.findByRole('button', { name: /add to group/i });
    await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 2000 });
    await userEvent.click(submitButton);

    // API should be called directly (no warning modal)
    await waitFor(
      () => {
        expect(addRolesApiSpy).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  },
};

export const CancelNotification: Story = {
  play: async () => {
    await delay(300);

    const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
    const cancelButton = within(modal).getByRole('button', { name: /^cancel$/i });
    await userEvent.click(cancelButton);

    // Warning notification should appear
    await waitFor(
      () => {
        const notificationPortal = document.querySelector('.notifications-portal');
        expect(notificationPortal).toBeInTheDocument();
        const warningAlert = notificationPortal?.querySelector('.pf-v6-c-alert.pf-m-warning');
        expect(warningAlert).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

export const FilterRoles: Story = {
  play: async () => {
    await delay(300);

    const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
    const modalContent = within(modal);

    // Wait for roles to load
    await modalContent.findByText('Content Manager');

    // Get initial row count
    const initialRows = modalContent.getAllByRole('row');
    const initialCount = initialRows.length - 1; // Subtract header
    expect(initialCount).toBeGreaterThan(0);

    // Type in filter
    const filterInput = modalContent.getByPlaceholderText('Filter by role name');
    await userEvent.type(filterInput, 'aud');
    await delay(500); // Debounce

    // Should have fewer rows
    await waitFor(
      () => {
        const filteredRows = modalContent.getAllByRole('row');
        expect(filteredRows.length - 1).toBeLessThan(initialCount);
      },
      { timeout: 5000 },
    );

    // Auditor should still be visible
    expect(modalContent.getByText('Auditor')).toBeInTheDocument();
  },
};
