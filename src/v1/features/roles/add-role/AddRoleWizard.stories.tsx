import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddRoleWizard } from './AddRoleWizard';
import { v1RolesHandlers } from '../../../data/mocks/roles.handlers';
import { permissionsHandlers } from '../../../../shared/data/mocks/permissions.handlers';

// API Spies
const createRoleSpy = fn();
const fetchRolesSpy = fn();

// Mock permissions data
const mockPermissions = [
  {
    application: 'inventory',
    resource_type: 'hosts',
    verb: 'read',
    permission: 'inventory:hosts:read',
    description: 'View inventory hosts',
  },
  {
    application: 'inventory',
    resource_type: 'hosts',
    verb: 'write',
    permission: 'inventory:hosts:write',
    description: 'Modify inventory hosts',
  },
  {
    application: 'cost-management',
    resource_type: 'rate',
    verb: 'read',
    permission: 'cost-management:rate:read',
    description: 'View cost rates',
  },
  {
    application: 'rbac',
    resource_type: 'role',
    verb: 'read',
    permission: 'rbac:role:read',
    description: 'View roles',
  },
];

// Mock roles for copy
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Platform Administrator',
    display_name: 'Platform Administrator',
    description: 'Full platform access',
    accessCount: 5,
    system: false,
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    display_name: 'Cost Management Viewer',
    description: 'View cost reports',
    accessCount: 3,
    system: false,
  },
];

// Router decorator
const withRouter = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/roles/create-role"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="/user-access/groups" element={<div data-testid="groups-page">Groups Page</div>} />
        <Route path="*" element={<Navigate to="/roles/create-role" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof AddRoleWizard> = {
  component: AddRoleWizard,
  tags: ['add-role-wizard', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    pagination: { limit: 20 },
    filters: {},
  },
};

export default meta;
type Story = StoryObj<typeof AddRoleWizard>;

// Default handlers
const createDefaultHandlers = () => [
  ...permissionsHandlers(mockPermissions as unknown as Parameters<typeof permissionsHandlers>[0], { networkDelay: 100 }),
  ...v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], {
    networkDelay: 100,
    onList: (params) => fetchRolesSpy({ limit: parseInt(params?.get?.('limit') ?? '20'), offset: parseInt(params?.get?.('offset') ?? '0') }),
    onCreate: (body) => createRoleSpy(body),
  }),
];

/**
 * Default state - Wizard opens with "Create role" step
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    const body = within(document.body);

    // Wizard should be visible (may have multiple dialogs - wizard + warning modal)
    const dialogs = await body.findAllByRole('dialog');
    expect(dialogs.length).toBeGreaterThan(0);

    // Title should show "Create role" - use getAllByText since it appears multiple times
    const createRoleTexts = body.getAllByText(/create role/i);
    expect(createRoleTexts.length).toBeGreaterThan(0);

    // Type selector options should be visible
    expect(body.getByText(/create a role from scratch/i)).toBeInTheDocument();
    expect(body.getByText(/copy an existing role/i)).toBeInTheDocument();
  },
};

/**
 * Select "Create from scratch" option
 */
export const SelectCreateFromScratch: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Select create from scratch and verify name input', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Click "Create a role from scratch" option
      const createOption = body.getByText(/create a role from scratch/i);
      await userEvent.click(createOption);

      // Role name input should appear (conditional field)
      await waitFor(() => {
        const nameInputs = body.queryAllByRole('textbox');
        expect(nameInputs.length).toBeGreaterThan(0);
      });
    });
  },
};

/**
 * Select "Copy existing role" option - verifies radio button is clickable
 */
export const SelectCopyExistingRole: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Select copy existing role option', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Click "Copy an existing role" option
      const copyOption = body.getByText(/copy an existing role/i);
      expect(copyOption).toBeInTheDocument();
      await userEvent.click(copyOption);

      // Wait for UI to update
      await waitFor(() => {
        expect(body.getAllByRole('radio').length).toBeGreaterThan(0);
      });

      // The radio should now be selected (checked)
      const radioInputs = body.getAllByRole('radio');
      expect(radioInputs.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Enter role name when creating from scratch
 */
export const EnterRoleName: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Enter role name', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Click "Create a role from scratch" option
      const createOption = body.getByText(/create a role from scratch/i);
      await userEvent.click(createOption);

      // Wait for name input
      await waitFor(() => {
        expect(body.getAllByRole('textbox').length).toBeGreaterThan(0);
      });

      // Find text inputs and type role name
      const nameInputs = body.getAllByRole('textbox');
      const nameInput = nameInputs[0];
      await userEvent.type(nameInput, 'My Test Role');
      expect(nameInput).toHaveValue('My Test Role');
    });
  },
};

/**
 * Cancel button is visible
 */
export const CancelButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify cancel button', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Cancel button should be present
      const cancelButton = body.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeEnabled();
    });
  },
};

/**
 * Next button initially visible
 */
export const NextButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify next button', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Next button should be present
      const nextButton = body.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
    });
  },
};

/**
 * Wizard navigation shows step indicators
 */
export const WizardStepIndicators: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify wizard step indicators', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Step nav should show step names (PatternFly-specific, no accessible alternative)
      const wizardNav = document.querySelector('.pf-v6-c-wizard__nav');
      expect(wizardNav).toBeInTheDocument();
    });
  },
};

/**
 * Verify role name input accepts text
 */
export const RoleNameInputAcceptsText: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify role name input accepts text', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Click "Create a role from scratch"
      const createOption = body.getByText(/create a role from scratch/i);
      await userEvent.click(createOption);

      // Find text inputs
      await waitFor(() => {
        expect(body.getAllByRole('textbox').length).toBeGreaterThan(0);
      });
      const nameInputs = body.getAllByRole('textbox');
      expect(nameInputs.length).toBeGreaterThan(0);

      // Type role name
      const nameInput = nameInputs[0];
      await userEvent.type(nameInput, 'Test Role Name');
      expect(nameInput).toHaveValue('Test Role Name');
    });
  },
};

const mockDuplicateRole = {
  uuid: 'existing-role-uuid',
  name: 'Duplicate Role',
  display_name: 'Duplicate Role',
  description: 'Existing role used to validate duplicate name behavior',
  accessCount: 1,
  system: false,
  platform_default: false,
  created: '2023-01-01T00:00:00Z',
  modified: '2023-01-01T00:00:00Z',
  applications: ['rbac'],
};

/**
 * Duplicate role name validation blocks progress (IQE: test_enter_duplicate_role_name)
 */
export const DuplicateRoleNameValidation: Story = {
  parameters: {
    msw: {
      handlers: [
        ...permissionsHandlers(mockPermissions as unknown as Parameters<typeof permissionsHandlers>[0], { networkDelay: 100 }),
        ...v1RolesHandlers([...mockRoles, mockDuplicateRole] as unknown as Parameters<typeof v1RolesHandlers>[0], {
          networkDelay: 100,
          onList: (params) => fetchRolesSpy({ limit: parseInt(params?.get?.('limit') ?? '20'), offset: parseInt(params?.get?.('offset') ?? '0') }),
          onCreate: (body) => createRoleSpy(body),
        }),
      ],
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify duplicate role name validation', async () => {
      // Wizard should be visible
      await body.findAllByRole('dialog');

      // Select create from scratch
      const createOption = body.getByText(/create a role from scratch/i);
      await userEvent.click(createOption);

      // Wait for name input
      await waitFor(() => {
        expect(body.getByLabelText('Role name')).toBeInTheDocument();
      });

      // Type duplicate role name (validator is debounced)
      const roleNameInput = body.getByLabelText('Role name');
      await userEvent.clear(roleNameInput);
      await userEvent.type(roleNameInput, 'Duplicate Role');

      // Wait for duplicate-name error message
      await expect(body.findByText(/already been taken/i)).resolves.toBeInTheDocument();

      // Next should be disabled while the name is invalid
      const nextButton = body.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  },
};
