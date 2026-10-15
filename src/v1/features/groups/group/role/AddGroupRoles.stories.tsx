import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { queryNotificationPortal, waitForModal } from '../../../../../test-utils/interactionHelpers';
import { AddGroupRoles } from './AddGroupRoles';
import { groupsHandlers } from '../../../../data/mocks/groups.handlers';
import { groupRolesHandlers } from '../../../../../shared/data/mocks/groupRoles.handlers';
import { v1RolesHandlers } from '../../../../data/mocks/roles.handlers';

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

const addRolesTestGroup = {
  uuid: 'test-group-id',
  name: 'Test Group',
  description: 'Test group for add roles modal',
  platform_default: false,
  admin_default: false,
  system: false,
  principalCount: 5,
  roleCount: 2,
  created: '2024-01-15T10:30:00.000Z',
  modified: '2024-01-15T10:30:00.000Z',
};

const createGroupHandler = () => groupsHandlers([addRolesTestGroup]);

const createRolesHandler = (roles = mockAvailableRoles, spy?: ReturnType<typeof fn>) => [
  ...v1RolesHandlers(
    roles.map((r) => ({
      uuid: r.uuid,
      name: r.name,
      display_name: r.display_name || r.name,
      description: r.description || '',
      system: false,
      platform_default: false,
      admin_default: false,
      created: r.modified || '2023-01-01T00:00:00Z',
      modified: r.modified || '2023-01-01T00:00:00Z',
      policyCount: 1,
      accessCount: 0,
      applications: [],
    })),
  ),
  ...groupRolesHandlers(
    {
      'test-group-id': [],
      'available-pool': roles.map((r) => ({
        uuid: r.uuid,
        name: r.name,
        display_name: r.display_name,
        description: r.description || '',
        system: false,
        platform_default: false,
        created: r.modified || '2023-01-01T00:00:00Z',
        modified: r.modified || '2023-01-01T00:00:00Z',
      })),
    },
    { onAddRoles: spy ? (groupId, body) => spy({ groupId, roles: body }) : undefined },
  ),
];

const meta: Meta<typeof AddGroupRoles> = {
  component: AddGroupRoles,
  tags: ['custom-css'],
  parameters: {
    msw: {
      handlers: [...createGroupHandler(), ...createRolesHandler()],
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
  play: async ({ step }) => {
    await step('Verify modal and roles load', async () => {
      // Modal is open by default (rendered directly as route)
      const modal = await waitForModal({ timeout: 5000 });
      // Verify modal content renders
      expect(await modal.findByRole('heading', { name: /add roles/i })).toBeInTheDocument();

      // Wait for roles data to load
      expect(await modal.findByText('Content Manager')).toBeInTheDocument();

      // Button should be disabled initially (no selection)
      const submitButton = await modal.findByRole('button', { name: /add to group/i });
      await waitFor(() => expect(submitButton).toBeDisabled(), { timeout: 2000 });
    });
  },
};

export const SelectAndAddRoles: Story = {
  name: 'Select and Add Roles',
  parameters: {
    msw: {
      handlers: [...createGroupHandler(), ...createRolesHandler(mockAvailableRoles, addRolesApiSpy)],
    },
  },
  play: async ({ step }) => {
    await step('Select role and add to group', async () => {
      addRolesApiSpy.mockClear();

      const modal = await waitForModal({ timeout: 5000 });

      // Wait for roles to load
      await modal.findByText('Content Manager');

      // Select a role
      const checkboxes = await modal.findAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // First row checkbox

      // Button should be enabled
      const submitButton = await modal.findByRole('button', { name: /add to group/i });
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
    });
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
        ...groupsHandlers([
          {
            ...addRolesTestGroup,
            uuid: 'test-group-id',
            name: 'Default access',
            description: 'Platform default group',
            platform_default: true,
            admin_default: false,
            system: true,
            principalCount: 0,
            roleCount: 0,
          },
        ]),
        ...createRolesHandler(mockAvailableRoles, addRolesApiSpy),
      ],
    },
  },
  play: async ({ step }) => {
    await step('Add role to default group with warning', async () => {
      addRolesApiSpy.mockClear();

      const modal = await waitForModal({ timeout: 5000 });

      // Wait for roles to load
      await waitFor(
        () => {
          expect(modal.queryByText('Content Manager')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Select a role
      const checkboxes = await modal.findAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      // Click submit
      const submitButton = await modal.findByRole('button', { name: /add to group/i });
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
    });
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
        ...groupsHandlers([
          {
            ...addRolesTestGroup,
            name: 'Custom default access',
            description: 'Modified default group',
            platform_default: true,
            admin_default: false,
            system: false,
            roleCount: 2,
          },
        ]),
        ...createRolesHandler(mockAvailableRoles, addRolesApiSpy),
      ],
    },
  },
  play: async ({ step }) => {
    await step('Add role to already-modified default group', async () => {
      addRolesApiSpy.mockClear();

      const modal = await waitForModal({ timeout: 5000 });

      // Wait for roles to load
      await modal.findByText('Content Manager');

      // Select a role
      const checkboxes = await modal.findAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      // Click submit - should NOT show warning for already-modified group
      const submitButton = await modal.findByRole('button', { name: /add to group/i });
      await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 2000 });
      await userEvent.click(submitButton);

      // API should be called directly (no warning modal)
      await waitFor(
        () => {
          expect(addRolesApiSpy).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });
  },
};

export const CancelNotification: Story = {
  play: async ({ step }) => {
    await step('Cancel and verify warning notification', async () => {
      const modal = await screen.findByRole('dialog', undefined, { timeout: 5000 });
      const cancelButton = within(modal).getByRole('button', { name: /^cancel$/i });
      await userEvent.click(cancelButton);

      // Warning notification should appear
      await waitFor(
        () => {
          const notificationPortal = queryNotificationPortal();
          expect(notificationPortal).toBeInTheDocument();
          const warningAlert = notificationPortal?.querySelector('.pf-v6-c-alert.pf-m-warning');
          expect(warningAlert).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  },
};

export const FilterRoles: Story = {
  play: async ({ step }) => {
    await step('Filter roles', async () => {
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

      // Should have fewer rows (waitFor handles debounce)
      await waitFor(
        () => {
          const filteredRows = modalContent.queryAllByRole('row');
          expect(filteredRows.length).toBeGreaterThan(1);
          expect(filteredRows.length - 1).toBeLessThan(initialCount);
        },
        { timeout: 5000 },
      );

      // Auditor should still be visible
      expect(modalContent.getByText('Auditor')).toBeInTheDocument();
    });
  },
};
