import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, waitFor, within } from 'storybook/test';
import { userEvent } from 'storybook/test';
import { RoutedOrgRoleAccessModal } from './RoutedOrgRoleAccessModal';
import type { MockUserIdentity } from '../../../../.storybook/contexts/StorybookMockContext';
import { groupsHandlers } from '../../../shared/data/mocks/groups.handlers';
import { v2RolesHandlers } from '../../data/mocks/roles.handlers';
import { roleBindingsHandlers, roleBindingsLoadingHandlers } from '../../data/mocks/roleBindings.handlers';
import { DEFAULT_GROUPS } from '../../../shared/data/mocks/seed';
import { DEFAULT_V2_ROLES } from '../../data/mocks/seed';
import type { RoleBinding } from '../../data/queries/roleBindings';
import pathnames from '../../utilities/pathnames';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GROUP_ID = DEFAULT_GROUPS[1].uuid ?? 'group-1'; // Platform Admins
const ORG_ID = 'org-987654321';
const TENANT_RESOURCE_ID = `redhat/${ORG_ID}`;

// Route helpers derived from pathnames so story URLs stay in sync with the app
const IAM_PREFIX = '/iam';
const INITIAL_ROUTE = `${IAM_PREFIX}${pathnames['org-management-edit-access'].link(GROUP_ID)}`;
const ROUTE_PATH = `${IAM_PREFIX}${pathnames['org-management-edit-access'].link(':groupId')}`;

const mockUserIdentity: MockUserIdentity = {
  account_number: '123456789',
  org_id: ORG_ID,
  organization: { name: 'Red Hat Test Organization' },
  user: {
    username: 'admin',
    email: 'admin@redhat.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_internal: false,
    is_org_admin: true,
    locale: 'en_US',
  },
};

// Only role-tenant-admin is pre-assigned; the rest are available to add.
const mockBindings: RoleBinding[] = [
  {
    role: { id: DEFAULT_V2_ROLES[0].id ?? 'role-tenant-admin', name: DEFAULT_V2_ROLES[0].name ?? 'Tenant admin' },
    subject: { id: GROUP_ID, type: 'group' },
    resource: { id: TENANT_RESOURCE_ID, name: 'Red Hat Test Organization', type: 'tenant' },
  },
];

const loadedHandlers = [...groupsHandlers(DEFAULT_GROUPS), ...v2RolesHandlers(DEFAULT_V2_ROLES), ...roleBindingsHandlers(mockBindings)];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RoutedOrgRoleAccessModal> = {
  component: RoutedOrgRoleAccessModal,
  parameters: {
    docs: {
      description: {
        component: `
**RoutedOrgRoleAccessModal** is the route-driven edit-access modal for the Organization-Wide Access page.

Rendered at \`/organization-management/organization-wide-access/:groupId/edit-access\`.
Uses \`resourceType: 'tenant'\` for all role binding queries and mutations.
        `,
      },
    },
    userIdentity: mockUserIdentity,
    msw: { handlers: loadedHandlers },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[INITIAL_ROUTE]}>
        <Routes>
          <Route path={ROUTE_PATH} element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RoutedOrgRoleAccessModal>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers(DEFAULT_GROUPS), ...v2RolesHandlers(DEFAULT_V2_ROLES), ...roleBindingsLoadingHandlers()],
    },
    docs: {
      description: {
        story: 'Modal in loading state while role bindings are being fetched.',
      },
    },
  },
  play: async ({ step }) => {
    await step('Spinner visible while loading', async () => {
      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
      await expect(body.findByRole('progressbar', { name: /loading/i })).resolves.toBeInTheDocument();
    });
  },
};

export const Loaded: Story = {
  parameters: {
    msw: { handlers: loadedHandlers },
    docs: {
      description: {
        story: 'Modal fully loaded showing roles for the group in the organization context.',
      },
    },
  },
  play: async ({ step }) => {
    await step('Modal renders with role list', async () => {
      const body = within(document.body);
      await expect(body.findByRole('dialog', {}, { timeout: 5000 })).resolves.toBeInTheDocument();

      await expect(body.findByText('Edit access', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
      await expect(body.findByRole('grid', { name: /roles selection table/i }, { timeout: 10000 })).resolves.toBeInTheDocument();
    });

    await step('Organization name shown in modal description', async () => {
      const body = within(document.body);
      await expect(body.findByText(/Red Hat Test Organization/, {}, { timeout: 10000 })).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Journey: open modal → add a role → save → modal closes.
 *
 * **Flow:**
 * 1. Wait for the role-selection grid to appear
 * 2. Locate the first unchecked role row (Workspace admin — not pre-assigned)
 * 3. Check its checkbox to mark it as selected (making the form dirty)
 * 4. Click **Update** — the mutation fires and `handleClose` navigates away
 * 5. Assert the dialog is no longer in the document
 */
export const HappyPath: Story = {
  name: 'Journey / Select roles → save',
  parameters: {
    msw: { handlers: loadedHandlers },
    docs: {
      description: {
        story: `
## Edit Access — Happy Path

Opens the org-wide edit access modal, adds a role, and submits.

1. Wait for role grid to load
2. Check the first unchecked role (Workspace admin)
3. Click **Update**
4. Assert modal closes (navigation away from edit-access route)
        `,
      },
    },
  },
  play: async ({ step }) => {
    const user = userEvent.setup();
    const body = within(document.body);

    await step('Wait for dialog and role grid to load', async () => {
      await expect(body.findByRole('dialog', {}, { timeout: 5000 })).resolves.toBeInTheDocument();
      await expect(body.findByRole('grid', { name: /roles selection table/i }, { timeout: 10000 })).resolves.toBeInTheDocument();
    });

    await step('Select an unassigned role', async () => {
      const dialog = await body.findByRole('dialog', {}, { timeout: 5000 });
      const table = within(dialog).getByRole('grid', { name: /roles selection table/i });

      // Wait for role rows to render
      await waitFor(
        () => {
          const unchecked = table.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not(:checked)');
          expect(unchecked.length).toBeGreaterThan(0);
        },
        { timeout: 10000 },
      );

      const uncheckedBoxes = table.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not(:checked)');
      await user.click(uncheckedBoxes[0]);
    });

    await step('Submit with Update and assert modal closes', async () => {
      const dialog = await body.findByRole('dialog', {}, { timeout: 5000 });
      const updateButton = within(dialog).getByRole('button', { name: /update/i });
      await expect(updateButton).not.toBeDisabled();
      await user.click(updateButton);

      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 10000 });
    });
  },
};
